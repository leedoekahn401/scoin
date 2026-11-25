import type { PrismaClient } from '@prisma/client';
import { notImplemented } from '../../common/utils/todo';
import { prisma } from '../../prisma';
import type { SepayWebhook } from './dto/sepay-webhook.dto';

/** BE-3 — B5 "SePay webhook": dedup on id, match the code, credit the wallet. */
export class SepayService {
  constructor(private readonly prisma: PrismaClient) {}

  async handleWebhook(_payload: SepayWebhook): Promise<void> {
    notImplemented('FR-TOP-03');
  }
}

export const sepayService = new SepayService(prisma);
