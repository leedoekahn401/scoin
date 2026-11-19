import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-1 — staff accounts, roles. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
}
