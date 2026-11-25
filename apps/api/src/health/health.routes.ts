import { Router } from 'express';
import { route } from '../common/http/route';
import { prisma } from '../prisma';

export const healthRouter = Router();

route(
  healthRouter,
  {
    method: 'get',
    path: '/health',
    name: 'check',
    tag: 'health',
    public: true,
    throttle: false,
    handler: async (_req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', db: 'up' };
      } catch {
        res.status(503).json({ status: 'error', db: 'down' });
      }
    },
  },
  '',
);
