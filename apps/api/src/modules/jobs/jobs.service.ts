import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — expire top-ups/requests, nightly check. */
@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}
}
