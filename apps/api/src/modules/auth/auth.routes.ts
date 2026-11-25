import { RULES } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-1 — FR-AUTH-01…06 */
export const authRouter = Router();
const tag = 'auth';
const LOGIN_LIMIT = RULES.RATE_LIMIT_LOGIN;

/** Email or username + password → access token; sets the refresh cookie. */
route(authRouter, {
  method: 'post',
  path: '/auth/login',
  name: 'login',
  tag,
  public: true,
  throttle: LOGIN_LIMIT,
  status: 200,
  handler: () => notImplemented('FR-AUTH-01'),
});

route(authRouter, {
  method: 'post',
  path: '/auth/refresh',
  name: 'refresh',
  tag,
  public: true,
  status: 200,
  handler: () => notImplemented('FR-AUTH-05'),
});

route(authRouter, {
  method: 'post',
  path: '/auth/logout',
  name: 'logout',
  tag,
  status: 204,
  handler: () => notImplemented('FR-AUTH-01'),
});

/** name, email, phone, password, inviteCode */
route(authRouter, {
  method: 'post',
  path: '/auth/register-parent',
  name: 'registerParent',
  tag,
  public: true,
  throttle: LOGIN_LIMIT,
  handler: () => notImplemented('FR-AUTH-02'),
});

route(authRouter, {
  method: 'post',
  path: '/auth/forgot-password',
  name: 'forgotPassword',
  tag,
  public: true,
  throttle: LOGIN_LIMIT,
  status: 204,
  handler: () => notImplemented('FR-AUTH-03'),
});

route(authRouter, {
  method: 'post',
  path: '/auth/reset-password',
  name: 'resetPassword',
  tag,
  public: true,
  status: 204,
  handler: () => notImplemented('FR-AUTH-03'),
});

/** Profile and role of the signed-in user. */
route(authRouter, {
  method: 'get',
  path: '/me',
  name: 'me',
  tag,
  handler: () => notImplemented('FR-AUTH-04'),
});
