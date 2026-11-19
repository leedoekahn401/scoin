import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — devices, sessions, /kiosk/me. */
@Injectable()
export class KioskService {
  constructor(private readonly prisma: PrismaService) {}
}
