import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-3 — refunds, adjustments, reconciliation. */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}
}
