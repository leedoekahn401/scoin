import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-2 — lookup, charge, void. */
@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}
}
