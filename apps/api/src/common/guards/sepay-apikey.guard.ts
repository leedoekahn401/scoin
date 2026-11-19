import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** SePay sends `Authorization: Apikey <key>` on every webhook call. */
@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const header = ctx.switchToHttp().getRequest<Request>().header('authorization') ?? '';
    const expected = Buffer.from(`Apikey ${this.config.getOrThrow<string>('sepay.apiKey')}`);
    const actual = Buffer.from(header);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
