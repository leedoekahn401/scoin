import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RULES } from '@schoolcoin/types';
import { Public } from '../../common/decorators/public.decorator';
import { notImplemented } from '../../common/utils/todo';
import { AuthService } from './auth.service';

const LOGIN_LIMIT = { default: { limit: RULES.RATE_LIMIT_LOGIN, ttl: 60_000 } };

/** BE-1 — FR-AUTH-01…06 */
@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Email or username + password → access token; sets the refresh cookie. */
  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('auth/login')
  @HttpCode(200)
  login() {
    notImplemented('FR-AUTH-01');
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(200)
  refresh() {
    notImplemented('FR-AUTH-05');
  }

  @Post('auth/logout')
  @HttpCode(204)
  logout() {
    notImplemented('FR-AUTH-01');
  }

  /** name, email, phone, password, inviteCode */
  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('auth/register-parent')
  registerParent() {
    notImplemented('FR-AUTH-02');
  }

  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('auth/forgot-password')
  @HttpCode(204)
  forgotPassword() {
    notImplemented('FR-AUTH-03');
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(204)
  resetPassword() {
    notImplemented('FR-AUTH-03');
  }

  /** Profile and role of the signed-in user. */
  @Get('me')
  me() {
    notImplemented('FR-AUTH-04');
  }
}
