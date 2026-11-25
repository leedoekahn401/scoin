import { API_PREFIX } from '@schoolcoin/types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from './common/http/error-handler';
import { logRequests } from './common/http/logging';
import { config } from './config';
import { healthRouter } from './health/health.routes';
import { auditRouter } from './modules/audit/audit.routes';
import { authRouter } from './modules/auth/auth.routes';
import { cardsRouter } from './modules/cards/cards.routes';
import { controlsRouter } from './modules/controls/controls.routes';
import { familiesRouter } from './modules/families/families.routes';
import { financeRouter } from './modules/finance/finance.routes';
import { kioskRouter } from './modules/kiosk/kiosk.routes';
import { menuRouter } from './modules/menu/menu.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { posRouter } from './modules/pos/pos.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { requestsRouter } from './modules/requests/requests.routes';
import { sepayRouter } from './modules/sepay/sepay.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { studentsRouter } from './modules/students/students.routes';
import { topupsRouter } from './modules/topups/topups.routes';
import { usersRouter } from './modules/users/users.routes';
import { buildOpenApiDocument } from './openapi';

/** The HTTP app without listen(), so e2e tests can drive it with supertest. */
export function createApp() {
  const app = express();

  app.use(logRequests);
  app.use(cookieParser());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Student photos and menu images (B3: Docker volume, served by the API at /uploads).
  const uploadDir = resolve(config.uploadDir);
  mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  app.use(healthRouter);

  const api = Router();
  for (const router of [
    authRouter,
    usersRouter,
    familiesRouter,
    auditRouter,
    studentsRouter,
    cardsRouter,
    posRouter,
    controlsRouter,
    topupsRouter,
    sepayRouter,
    financeRouter,
    menuRouter,
    kioskRouter,
    requestsRouter,
    notificationsRouter,
    reportsRouter,
    settingsRouter,
  ]) {
    api.use(router);
  }
  app.use(`/${API_PREFIX}`, api);

  const document = buildOpenApiDocument();
  app.get('/docs-json', (_req, res) => res.json(document));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(document));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
