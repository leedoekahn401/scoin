import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — credit requests. */
@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}
}
