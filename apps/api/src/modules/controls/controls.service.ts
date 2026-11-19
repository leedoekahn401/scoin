import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-2 — daily limit, low-balance threshold. */
@Injectable()
export class ControlsService {
  constructor(private readonly prisma: PrismaService) {}
}
