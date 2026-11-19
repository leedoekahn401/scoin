import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-2 — students, CSV import, PIN set/reset. */
@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}
}
