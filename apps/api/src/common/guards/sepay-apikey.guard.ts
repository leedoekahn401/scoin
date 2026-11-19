import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** SePay sends `Authorization: Apikey <SEPAY_WEBHOOK_KEY>` (NFR-SEC-03). */
@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const header = ctx.switchToHttp().getRequest<Request>().header('authorization') ?? '';
    const expected = Buffer.from(`Apikey ${this.config.getOrThrow<string>('sepay.webhookKey')}`);
    const actual = Buffer.from(header);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
