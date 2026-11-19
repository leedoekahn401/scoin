import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** BE-1 — login, refresh, logout, register-parent, reset. */
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
}
