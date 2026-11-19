import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-1 — invite codes, parent-student links. */
@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}
}
