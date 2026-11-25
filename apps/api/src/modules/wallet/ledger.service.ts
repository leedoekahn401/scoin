import { LedgerType, Prisma, WalletKind, type PrismaClient } from '@prisma/client';
import type { LedgerRefType } from '@schoolcoin/types';
import { AppError } from '../../common/errors/app-error';
import { prisma } from '../../prisma';

/** The school-side wallets that sit on the other side of every student movement. */
export type SchoolWalletKind = Exclude<WalletKind, 'STUDENT'>;

/** One movement of credits from one wallet to another. */
export interface Posting {
  type: LedgerType;
  fromWalletId: string;
  toWalletId: string;
  amountCredits: number; // > 0, the amount moved
  refType: LedgerRefType;
  refId: string;
  actorId?: string | null;
  note?: string | null;
  /** Backdates the movement. Seeds and imports only. */
  at?: Date;
}

export type PostedTransaction = Prisma.LedgerTransactionGetPayload<{ include: { entries: true } }>;

export interface ConsistencyReport {
  /** Wallets whose balance differs from the sum of their entries. */
  walletMismatches: { walletId: string; balance: number; ledgerSum: number }[];
  /** Transactions that are not exactly one -amount and one +amount entry. */
  unbalancedTransactionIds: string[];
  /** Sum of every wallet balance: 0 when the books balance. */
  totalCredits: number;
}

/**
 * Writes one ledger transaction with its two entries: -amount on the sender, +amount on the
 * receiver. The database adds each entry to its wallet balance and fills in balanceAfter; nothing
 * else writes wallets.balanceCredits (ADR 0005). Call inside a transaction.
 */
export async function postLedgerTransaction(
  tx: Prisma.TransactionClient,
  posting: Posting,
): Promise<PostedTransaction> {
  const { fromWalletId, toWalletId, amountCredits } = posting;
  if (!Number.isSafeInteger(amountCredits) || amountCredits <= 0) {
    throw new Error(
      `Ledger amount must be a positive whole number of credits, got ${amountCredits}`,
    );
  }
  if (fromWalletId === toWalletId) {
    throw new Error('A ledger transaction moves credits between two different wallets');
  }

  // Students before school-side wallets, then by id: every posting locks in the same order,
  // so two postings never wait on each other in a cycle.
  const wallets = await tx.$queryRaw<{ id: string; kind: WalletKind; balanceCredits: number }[]>`
    SELECT id, kind, "balanceCredits" FROM wallets
    WHERE id IN (${fromWalletId}, ${toWalletId})
    ORDER BY (kind = 'STUDENT') DESC, id
    FOR UPDATE`;
  if (wallets.length !== 2) throw new AppError('NOT_FOUND', 404, 'Wallet not found');

  const sender = wallets.find((w) => w.id === fromWalletId)!;
  if (sender.kind === WalletKind.STUDENT && sender.balanceCredits < amountCredits) {
    throw new AppError('INSUFFICIENT_BALANCE', 422, 'Not enough credits', {
      balance: sender.balanceCredits,
      total: amountCredits,
    });
  }

  const createdAt = posting.at ?? new Date();
  try {
    return await tx.ledgerTransaction.create({
      data: {
        type: posting.type,
        amountCredits,
        refType: posting.refType,
        refId: posting.refId,
        actorId: posting.actorId ?? null,
        note: posting.note ?? null,
        createdAt,
        entries: {
          create: [
            { walletId: fromWalletId, amountCredits: -amountCredits, createdAt },
            { walletId: toWalletId, amountCredits, createdAt },
          ],
        },
      },
      include: { entries: { orderBy: { id: 'asc' } } },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(
        'CONFLICT',
        409,
        `${posting.type} for ${posting.refType} ${posting.refId} is already posted`,
      );
    }
    throw err;
  }
}

export async function schoolWalletId(
  tx: Prisma.TransactionClient,
  kind: SchoolWalletKind,
): Promise<string> {
  const wallet = await tx.wallet.findFirst({ where: { kind }, select: { id: true } });
  if (!wallet) throw new Error(`The ${kind} wallet is missing; run the database migrations`);
  return wallet.id;
}

/** The double-entry ledger (ADR 0005, FR-WAL-02…05, B9). */
export class LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  post(tx: Prisma.TransactionClient, posting: Posting): Promise<PostedTransaction> {
    return postLedgerTransaction(tx, posting);
  }

  schoolWalletId(tx: Prisma.TransactionClient, kind: SchoolWalletKind): Promise<string> {
    return schoolWalletId(tx, kind);
  }

  /** FR-WAL-05: every balance equals the sum of its entries and every transaction balances. */
  async checkConsistency(): Promise<ConsistencyReport> {
    const walletMismatches = await this.prisma.$queryRaw<ConsistencyReport['walletMismatches']>`
      SELECT w.id AS "walletId", w."balanceCredits" AS balance,
             COALESCE(SUM(e."amountCredits"), 0)::int AS "ledgerSum"
      FROM wallets w
      LEFT JOIN ledger_entries e ON e."walletId" = w.id
      GROUP BY w.id
      HAVING w."balanceCredits" <> COALESCE(SUM(e."amountCredits"), 0)`;

    const unbalanced = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT t.id
      FROM ledger_transactions t
      LEFT JOIN ledger_entries e ON e."transactionId" = t.id
      GROUP BY t.id
      HAVING COUNT(e.id) <> 2
          OR COALESCE(SUM(e."amountCredits"), 0) <> 0
          OR COUNT(*) FILTER (WHERE ABS(e."amountCredits") = t."amountCredits") <> 2`;

    const [{ total }] = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("balanceCredits"), 0)::int AS total FROM wallets`;

    return {
      walletMismatches,
      unbalancedTransactionIds: unbalanced.map((t) => t.id),
      totalCredits: total,
    };
  }
}

export const ledgerService = new LedgerService(prisma);
