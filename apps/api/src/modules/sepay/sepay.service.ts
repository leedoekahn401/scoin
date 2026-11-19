import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

/** BE-3 — dedup on SePay id, match the SC code in the content, credit the wallet. */
@Injectable()
export class SepayService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(_payload: SepayWebhookDto): Promise<void> {
    throw new NotImplementedException();
  }
}
