import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-3 — parent top-ups, cash top-ups, review list. */
@Injectable()
export class TopupsService {
  constructor(private readonly prisma: PrismaService) {}
}
