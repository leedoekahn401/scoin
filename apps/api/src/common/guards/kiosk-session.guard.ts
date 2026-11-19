import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { sha256 } from '../utils/codes';

/** Requires a live student session (X-Kiosk-Session) on the calling kiosk. Use after KioskDeviceGuard. */
@Injectable()
export class KioskSessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { kioskDeviceId?: string; kioskStudentId?: string }>();
    const token = req.header('x-kiosk-session');
    if (!token) throw new UnauthorizedException('Missing kiosk session');

    const session = await this.prisma.kioskSession.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!session || session.deviceId !== req.kioskDeviceId || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Kiosk session expired');
    }

    req.kioskStudentId = session.studentId;
    return true;
  }
}
