import type { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { prisma } from '../../prisma';

/** BE-4 — B9 background jobs. */
export class JobsService {
  constructor(private readonly prisma: PrismaClient) {}

  /** PENDING top-ups past expiresAt → EXPIRED; push the SSE event (FR-TOP-09). */
  async expireTopUps() {}

  /** PENDING or APPROVED requests older than 7 days → EXPIRED (FR-REQ-04). */
  async expireRequests() {}

  /** Balance vs ledger sum for every wallet; log and email the admin on mismatch (FR-WAL-05). */
  async consistencyCheck() {}
}

export const jobsService = new JobsService(prisma);

/** Called from main.ts only, so tests never start timers. */
export function startJobs(jobs = jobsService): CronJob[] {
  const run = (name: string, fn: () => Promise<void>) => () =>
    fn().catch((err) => console.error(`[jobs] ${name} failed`, err));
  return [
    CronJob.from({
      cronTime: '0 * * * * *',
      onTick: run('expireTopUps', () => jobs.expireTopUps()),
      start: true,
    }),
    CronJob.from({
      cronTime: '0 0 * * * *',
      onTick: run('expireRequests', () => jobs.expireRequests()),
      start: true,
    }),
    CronJob.from({
      cronTime: '0 2 * * *',
      timeZone: 'Asia/Ho_Chi_Minh',
      onTick: run('consistencyCheck', () => jobs.consistencyCheck()),
      start: true,
    }),
  ];
}
