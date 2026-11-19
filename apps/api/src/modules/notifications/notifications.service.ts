import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — in-app + email. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
}
