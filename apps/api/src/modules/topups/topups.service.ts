import { TopUpStatus, type Prisma, type PrismaClient } from '@prisma/client';
import { RULES, type CreateTopUpDto, type TopUp, type TopUpCheckout } from '@schoolcoin/types';
import {
  ensureFound,
  forbidden,
  isUniqueViolation,
  ruleViolation,
} from '../../common/errors/http-errors';
import { paymentCode } from '../../common/utils/codes';
import { creditsToVnd } from '../../common/utils/money';
import { prisma } from '../../prisma';
import { paymentProvider } from '../payments/payments.service';
import type { PaymentProvider } from '../payments/payment-provider';

const withStudent = { student: { select: { fullName: true } } } satisfies Prisma.TopUpInclude;
type TopUpRow = Prisma.TopUpGetPayload<{ include: typeof withStudent }>;

/** BE-3 — parent top-ups, cash top-ups, review list. */
export class TopupsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly payments: PaymentProvider,
  ) {}

  /** FR-TOP-01, 02: a PENDING top-up with a unique payment code, valid for 30 minutes. */
  async create(parentId: string, dto: CreateTopUpDto): Promise<TopUpCheckout> {
    const { TOPUP_MIN_CREDITS: min, TOPUP_MAX_CREDITS: max } = RULES;
    if (dto.amountCredits < min || dto.amountCredits > max) {
      throw ruleViolation('TOPUP_AMOUNT_OUT_OF_RANGE', `Top-ups are ${min}–${max} credits`, {
        min,
        max,
      });
    }
    await this.assertLinked(parentId, dto.studentId);
    if (dto.creditRequestId) {
      ensureFound(
        await this.prisma.creditRequest.findFirst({
          where: { id: dto.creditRequestId, studentId: dto.studentId },
        }),
        'Credit request',
      );
    }

    const expiresAt = new Date(Date.now() + RULES.TOPUP_EXPIRY_MINUTES * 60_000);
    // Payment codes are random; retry the rare collision with an existing one.
    for (let attempt = 0; ; attempt++) {
      try {
        const topUp = await this.prisma.topUp.create({
          data: {
            studentId: dto.studentId,
            parentId,
            amountCredits: dto.amountCredits,
            amountVnd: creditsToVnd(dto.amountCredits),
            paymentCode: paymentCode(),
            expiresAt,
            creditRequestId: dto.creditRequestId ?? null,
          },
          include: withStudent,
        });
        return this.toCheckout(topUp);
      } catch (err) {
        if (!isUniqueViolation(err, 'paymentCode') || attempt >= 4) throw err;
      }
    }
  }

  /** FR-TOP-10: a top-up of one of the parent's children, with its payment instructions. */
  async get(parentId: string, id: string): Promise<TopUpCheckout> {
    const topUp = ensureFound(
      await this.prisma.topUp.findUnique({ where: { id }, include: withStudent }),
      'Top-up',
    );
    await this.assertLinked(parentId, topUp.studentId);
    return this.toCheckout(topUp);
  }

  /** UC-04: only a PENDING top-up can be cancelled; a transfer for it then stays unmatched. */
  async cancel(parentId: string, id: string): Promise<TopUp> {
    const topUp = ensureFound(await this.prisma.topUp.findUnique({ where: { id } }), 'Top-up');
    await this.assertLinked(parentId, topUp.studentId);

    // Conditional update: a payment landing at the same moment wins.
    const { count } = await this.prisma.topUp.updateMany({
      where: { id, status: TopUpStatus.PENDING },
      data: { status: TopUpStatus.CANCELLED },
    });
    if (count === 0) throw ruleViolation('TOPUP_NOT_PENDING', 'Top-up is not pending');
    return toTopUp(
      await this.prisma.topUp.findUniqueOrThrow({ where: { id }, include: withStudent }),
    );
  }

  private async assertLinked(parentId: string, studentId: string) {
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
    });
    if (!link) throw forbidden('Not your child');
  }

  private toCheckout(topUp: TopUpRow): TopUpCheckout {
    return { ...toTopUp(topUp), ...this.payments.checkout(topUp) };
  }
}

function toTopUp(topUp: TopUpRow): TopUp {
  return {
    id: topUp.id,
    studentId: topUp.studentId,
    studentName: topUp.student.fullName,
    parentId: topUp.parentId,
    amountCredits: topUp.amountCredits,
    amountVnd: topUp.amountVnd,
    paymentCode: topUp.paymentCode,
    status: topUp.status,
    expiresAt: topUp.expiresAt.toISOString(),
    paidAt: topUp.paidAt?.toISOString() ?? null,
    needsReview: topUp.needsReview,
    creditRequestId: topUp.creditRequestId,
    createdAt: topUp.createdAt.toISOString(),
  };
}

export const topupsService = new TopupsService(prisma, paymentProvider);
