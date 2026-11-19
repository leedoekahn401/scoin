import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-4 — categories, items, sold-out. */
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}
}
