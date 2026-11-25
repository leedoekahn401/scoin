import type { RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { config } from '../../config';
import { prisma } from '../../prisma';
import { AppError } from '../errors/app-error';
import { sha256 } from '../utils/codes';
import type { RouteSpec } from './route';

/** Checks X-Kiosk-Key against registered, active kiosk devices. */
export const kioskDevice: RequestHandler = async (req, _res, next) => {
  const key = req.header('x-kiosk-key');
  if (!key) throw new AppError('UNAUTHENTICATED', 401, 'Missing kiosk key');

  const device = await prisma.kioskDevice.findUnique({ where: { keyHash: sha256(key) } });
  if (!device?.active) throw new AppError('UNAUTHENTICATED', 401, 'Unknown kiosk');

  req.kioskDeviceId = device.id;
  next();
};

/** Requires a live student session (X-Kiosk-Session) on the calling kiosk. Use after kioskDevice. */
export const kioskSession: RequestHandler = async (req, _res, next) => {
  const token = req.header('x-kiosk-session');
  if (!token) throw new AppError('UNAUTHENTICATED', 401, 'Missing kiosk session');

  const session = await prisma.kioskSession.findUnique({ where: { tokenHash: sha256(token) } });
  if (
    !session ||
    session.endedAt ||
    session.deviceId !== req.kioskDeviceId ||
    session.expiresAt < new Date()
  ) {
    throw new AppError('UNAUTHENTICATED', 401, 'Kiosk session expired');
  }

  req.kioskStudentId = session.studentId;
  next();
};

/** SePay sends `Authorization: Apikey <SEPAY_WEBHOOK_KEY>` (NFR-SEC-03). */
export const sepayApiKey: RequestHandler = (req, _res, next) => {
  const expected = Buffer.from(`Apikey ${config.sepay.webhookKey}`);
  const actual = Buffer.from(req.header('authorization') ?? '');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new AppError('UNAUTHENTICATED', 401, 'Unauthorized');
  }
  next();
};

/** Kiosk routes acting for the signed-in student: device key + live session instead of a JWT. */
export const kioskStudentRoute: Pick<RouteSpec, 'public' | 'guards' | 'security'> = {
  public: true,
  guards: [kioskDevice, kioskSession],
  security: ['kiosk-device', 'kiosk-session'],
};
