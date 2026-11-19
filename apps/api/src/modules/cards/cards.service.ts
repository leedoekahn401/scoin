import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-2 — issue, lock, replace, print data. */
@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}
}
