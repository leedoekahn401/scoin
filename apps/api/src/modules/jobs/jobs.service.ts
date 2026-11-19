import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — B9 background jobs. */
@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /** PENDING top-ups past expiresAt → EXPIRED; push the SSE event (FR-TOP-09). */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireTopUps() {}

  /** PENDING or APPROVED requests older than 7 days → EXPIRED (FR-REQ-04). */
  @Cron(CronExpression.EVERY_HOUR)
  async expireRequests() {}

  /** Balance vs ledger sum for every wallet; log and email the admin on mismatch (FR-WAL-05). */
  @Cron('0 2 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async consistencyCheck() {}
}
