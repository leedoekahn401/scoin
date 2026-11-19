import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Role } from '@schoolcoin/types';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Reads the access token from the httpOnly cookie, falling back to a Bearer header. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
