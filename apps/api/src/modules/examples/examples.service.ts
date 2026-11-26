import type { Paginated } from '@schoolcoin/types';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { conflict, ensureFound, forbidden, ruleViolation } from '../../common/errors/http-errors';
import type { AuthUser } from '../../common/http/auth';
import { dateRange, paginate } from '../../common/http/query';
import type { BuySnackDto, CreateSnackDto, ListSnacksQuery, UpdateSnackDto } from './dto/snack.dto';

export interface Snack {
  id: string;
  name: string;
  priceCredits: number;
  stock: number;
  available: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mock-up for docs/api/express-utils.md: a snack shelf kept in memory, so it runs without a
 * database. Methods are async and shaped like the Prisma calls a real service would make.
 */
export class ExamplesService {
  private readonly snacks = new Map<string, Snack>();
  /** `updated` fires after every change; the SSE route listens to it. */
  readonly events = new EventEmitter<{ updated: [Snack] }>();

  async list(query: ListSnacksQuery): Promise<Paginated<Snack>> {
    const created = dateRange(query);
    const q = query.q?.toLowerCase();
    const matches = [...this.snacks.values()]
      .filter(
        (s) =>
          (!q || s.name.toLowerCase().includes(q)) &&
          (query.available === undefined || s.available === query.available) &&
          (!created.gte || s.createdAt >= created.gte) &&
          (!created.lt || s.createdAt < created.lt),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // With Prisma: paginate(query, (page) => prisma.snack.findMany({ where, ...page }), () => prisma.snack.count({ where }))
    return paginate(
      query,
      async ({ skip, take }) => matches.slice(skip, skip + take),
      async () => matches.length,
    );
  }

  async get(id: string): Promise<Snack> {
    return ensureFound(this.snacks.get(id), 'Snack');
  }

  async create(userId: string, dto: CreateSnackDto): Promise<Snack> {
    this.assertNameFree(dto.name);
    const now = new Date();
    const snack: Snack = {
      id: randomUUID(),
      ...dto,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    };
    this.snacks.set(snack.id, snack);
    return snack;
  }

  async update(id: string, dto: UpdateSnackDto): Promise<Snack> {
    const snack = await this.get(id);
    if (dto.name !== undefined && dto.name !== snack.name) this.assertNameFree(dto.name);
    Object.assign(snack, dto, { updatedAt: new Date() });
    this.events.emit('updated', snack);
    return snack;
  }

  /** Only the snack's creator or an ADMIN may remove it: a 403 the role check alone cannot express. */
  async remove(user: AuthUser, id: string): Promise<void> {
    const snack = await this.get(id);
    if (snack.createdById !== user.id && user.role !== 'ADMIN') {
      throw forbidden('Only the creator or an admin can remove this snack');
    }
    this.snacks.delete(id);
  }

  /** A business rule refusing valid input → 422 with a code the front end switches on. */
  async buy(id: string, { quantity }: BuySnackDto) {
    const snack = await this.get(id);
    if (!snack.available || snack.stock < quantity) {
      throw ruleViolation('ITEM_UNAVAILABLE', `Only ${snack.stock} left`, {
        stock: snack.stock,
        requested: quantity,
      });
    }
    snack.stock -= quantity;
    snack.updatedAt = new Date();
    this.events.emit('updated', snack);
    return {
      snackId: snack.id,
      quantity,
      totalCredits: snack.priceCredits * quantity,
      stockLeft: snack.stock,
    };
  }

  /** Test helper: empties the shelf. */
  reset() {
    this.snacks.clear();
  }

  private assertNameFree(name: string) {
    const taken = [...this.snacks.values()].some(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) throw conflict('CONFLICT', 'A snack with this name already exists', { name });
  }
}

export const examplesService = new ExamplesService();
