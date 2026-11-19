import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — PIN threshold, top-up limits, bank info. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}
}
