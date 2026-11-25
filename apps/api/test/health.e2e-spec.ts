import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

describe('GET /health', () => {
  const app = createApp();

  afterAll(() => prisma.$disconnect());

  it('reports the database as up', async () => {
    await request(app).get('/health').expect(200, { status: 'ok', db: 'up' });
  });
});
