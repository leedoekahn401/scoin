import { LedgerType, Prisma, SepayTxStatus, TopUpStatus, type PrismaClient } from '@prisma/client';
import { PAYMENT_CODE_PATTERN, type SepayTransaction } from '@schoolcoin/types';
import { creditsToVnd, vndToCredits } from '../../common/utils/money';
import { prisma } from '../../prisma';
import { walletService, type WalletService } from '../wallet/wallet.service';
import { mockPaymentProvider } from './mock-payment.provider';
import type { IncomingTransfer, PaymentProvider } from './payment-provider';

/** The active payment add-in. Mock until SePay is wired (ADR 0007). */
export const paymentProvider: PaymentProvider = mockPaymentProvider;

const transferInclude = {
  topUp: { select: { studentId: true, student: { select: { fullName: true } } } },
  resolvedBy: { select: { fullName: true } },
} satisfies Prisma.SepayTransactionInclude;

type TransferRow = Prisma.SepayTransactionGetPayload<{ include: typeof transferInclude }>;

interface LockedTopUp {
  id: string;
  studentId: string;
  amountVnd: number;
  status: TopUpStatus;
  creditRequestId: string | null;
}

/** Payment code in the transfer content, e.g. "CHUYEN TIEN SC12345678" (FR-TOP-04). */
function findPaymentCode(content: string): string | null {
  const code = content.toUpperCase().match(/SC\d{8}/)?.[0];
  return code && PAYMENT_CODE_PATTERN.test(code) ? code : null;
}

/** BE-3 — incoming transfers from any payment provider: dedup, match the code, credit the wallet. */
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly wallets: WalletService,
  ) {}

  /**
   * Records a transfer once (NFR-REL-03). If its payment code matches a PENDING or EXPIRED top-up
   * (BR-08: a late payment is still credited), credits ⌊VND / 1,000⌋ to the student through the
   * ledger and marks the top-up PAID, flagged for review when the amount differs (BR-06).
   * Anything else stays UNMATCHED for an accountant (FR-TOP-06).
   */
  async receiveTransfer(transfer: IncomingTransfer): Promise<SepayTransaction> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const seen = await tx.sepayTransaction.findUnique({
          where: { id: transfer.id },
          select: { id: true },
        });
        if (seen) return;

        const code = findPaymentCode(transfer.content);
        // Lock the top-up so two transfers with the same code cannot both pay it.
        const [topUp] = code
          ? await tx.$queryRaw<LockedTopUp[]>`
              SELECT id, "studentId", "amountVnd", status, "creditRequestId"
              FROM top_ups WHERE "paymentCode" = ${code} FOR UPDATE`
          : [];
        const settles =
          topUp?.status === TopUpStatus.PENDING || topUp?.status === TopUpStatus.EXPIRED;
        const credits = vndToCredits(transfer.amountVnd);

        await tx.sepayTransaction.create({
          data: {
            id: transfer.id,
            gateway: transfer.gateway,
            transactionDate: transfer.receivedAt,
            accountNumber: transfer.accountNumber,
            code,
            content: transfer.content,
            transferType: 'in',
            transferAmountVnd: transfer.amountVnd,
            referenceCode: transfer.referenceCode ?? null,
            rawPayload: transfer.rawPayload,
            status: settles ? SepayTxStatus.MATCHED : SepayTxStatus.UNMATCHED,
            ...(settles && {
              topUpId: topUp.id,
              creditedCredits: credits,
              remainderVnd: transfer.amountVnd - creditsToVnd(credits),
            }),
          },
        });
        if (!settles) return;

        if (credits > 0) {
          await this.wallets.credit(tx, {
            studentId: topUp.studentId,
            amountCredits: credits,
            type: LedgerType.TOPUP_SEPAY,
            refType: 'TOP_UP',
            refId: topUp.id,
            note: transfer.content,
          });
        }
        await tx.topUp.update({
          where: { id: topUp.id },
          data: {
            status: TopUpStatus.PAID,
            paidAt: new Date(),
            needsReview: transfer.amountVnd !== topUp.amountVnd,
          },
        });
        if (topUp.creditRequestId) {
          await tx.creditRequest.update({
            where: { id: topUp.creditRequestId },
            data: { status: 'PAID' },
          });
        }
      });
    } catch (err) {
      // The same transfer arrived twice at once; the other request recorded it.
      const duplicate = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
      if (!duplicate) throw err;
    }

    const row = await this.prisma.sepayTransaction.findUniqueOrThrow({
      where: { id: transfer.id },
      include: transferInclude,
    });
    return toTransfer(row);
  }
}

function toTransfer(row: TransferRow): SepayTransaction {
  const raw = row.rawPayload as { description?: unknown } | null;
  return {
    id: String(row.id),
    gateway: row.gateway,
    transactionDate: row.transactionDate.toISOString(),
    accountNumber: row.accountNumber,
    code: row.code,
    content: row.content,
    description: typeof raw?.description === 'string' ? raw.description : '',
    transferType: row.transferType === 'out' ? 'out' : 'in',
    transferAmountVnd: row.transferAmountVnd,
    referenceCode: row.referenceCode,
    status: row.status,
    topUpId: row.topUpId,
    creditedCredits: row.creditedCredits,
    remainderVnd: row.remainderVnd,
    resolvedById: row.resolvedById,
    resolvedByName: row.resolvedBy?.fullName ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    studentId: row.topUp?.studentId ?? null,
    studentName: row.topUp?.student.fullName ?? null,
  };
}

export const paymentsService = new PaymentsService(prisma, walletService);
