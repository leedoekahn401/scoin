import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — sales, top-ups, balances, dashboard, CSV. */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}
}
