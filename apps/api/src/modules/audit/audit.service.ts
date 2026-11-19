import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-1 — audit log query. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
}
