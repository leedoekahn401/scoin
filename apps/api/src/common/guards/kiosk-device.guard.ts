import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { sha256 } from '../utils/codes';

/** Checks X-Kiosk-Key against registered, active kiosk devices. */
@Injectable()
export class KioskDeviceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { kioskDeviceId?: string }>();
    const key = req.header('x-kiosk-key');
    if (!key) throw new UnauthorizedException('Missing kiosk key');

    const device = await this.prisma.kioskDevice.findUnique({ where: { keyHash: sha256(key) } });
    if (!device?.active) throw new UnauthorizedException('Unknown kiosk');

    req.kioskDeviceId = device.id;
    return true;
  }
}
