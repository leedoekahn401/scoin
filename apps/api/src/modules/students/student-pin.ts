import type { PrismaClient } from '@prisma/client';
import { PIN_LOCK_MINUTES, PIN_MAX_ATTEMPTS } from '@schoolcoin/types';
import { ensureFound, ruleViolation } from '../../common/errors/http-errors';
import { verifySecret } from '../../common/utils/hash';

/**
 * BR-11, shared by the POS and the kiosk: 5 wrong PINs lock it for 15 minutes.
 * Call outside any transaction that may roll back, so a wrong attempt is always counted.
 */
export async function verifyStudentPin(
  prisma: PrismaClient,
  studentId: string,
  pin: string,
  now: Date = new Date(),
): Promise<void> {
  const student = ensureFound(
    await prisma.student.findUnique({
      where: { id: studentId },
      select: { pinHash: true, pinFailedCount: true, pinLockedUntil: true },
    }),
    'Student',
  );
  if (student.pinLockedUntil && student.pinLockedUntil > now) {
    throw ruleViolation('PIN_LOCKED', 'PIN is locked', {
      lockedUntil: student.pinLockedUntil.toISOString(),
    });
  }
  if (!student.pinHash) throw ruleViolation('PIN_NOT_SET', 'This student has no PIN yet');

  if (await verifySecret(student.pinHash, pin)) {
    if (student.pinFailedCount > 0) {
      await prisma.student.update({ where: { id: studentId }, data: { pinFailedCount: 0 } });
    }
    return;
  }

  // increment is atomic, so concurrent wrong attempts are all counted.
  const { pinFailedCount } = await prisma.student.update({
    where: { id: studentId },
    data: { pinFailedCount: { increment: 1 } },
    select: { pinFailedCount: true },
  });
  if (pinFailedCount >= PIN_MAX_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + PIN_LOCK_MINUTES * 60_000);
    await prisma.student.update({
      where: { id: studentId },
      data: { pinFailedCount: 0, pinLockedUntil: lockedUntil },
    });
    throw ruleViolation('PIN_LOCKED', 'Too many wrong PINs', {
      lockedUntil: lockedUntil.toISOString(),
    });
  }
  throw ruleViolation('PIN_INVALID', 'Wrong PIN', {
    attemptsLeft: PIN_MAX_ATTEMPTS - pinFailedCount,
  });
}
