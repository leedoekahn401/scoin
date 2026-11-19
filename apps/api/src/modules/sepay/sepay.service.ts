import { Injectable } from '@nestjs/common';
import { notImplemented } from '../../common/utils/todo';
import { PrismaService } from '../../prisma/prisma.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

/** BE-3 — B5 "SePay webhook": dedup on id, match the code, credit the wallet. */
@Injectable()
export class SepayService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(_payload: SepayWebhookDto): Promise<void> {
    notImplemented('FR-TOP-03');
  }
}
