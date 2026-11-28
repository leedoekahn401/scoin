import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — in-app + email. */
export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * FR-CTL-02: alert the parents once when the balance drops below the student's threshold;
   * re-arm once it is back at or above it. Call after the movement is committed.
   * shortcut: in-app only, add the email when the email sender lands.
   */
  async checkLowBalance(studentId: string, balance: number): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        fullName: true,
        lowBalanceThreshold: true,
        lowBalanceAlerted: true,
        parents: { select: { parentId: true } },
      },
    });
    if (!student || student.lowBalanceThreshold === null) return;
    const below = balance < student.lowBalanceThreshold;
    if (below === student.lowBalanceAlerted) return;

    // The conditional update makes two concurrent calls send one alert, not two.
    const { count } = await this.prisma.student.updateMany({
      where: { id: studentId, lowBalanceAlerted: !below },
      data: { lowBalanceAlerted: below },
    });
    if (count === 0 || !below) return;

    await this.prisma.notification.createMany({
      data: student.parents.map(({ parentId }) => ({
        userId: parentId,
        type: 'LOW_BALANCE',
        title: 'Số dư sắp hết',
        body: `${student.fullName} còn ${balance} xu.`,
        data: { studentId, balance, threshold: student.lowBalanceThreshold },
      })),
    });
  }
}

export const notificationsService = new NotificationsService(prisma);
