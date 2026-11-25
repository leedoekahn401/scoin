import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

// B11: each role gets 403 outside its column of the permission matrix (SRS 4.12).
describe('Permissions', () => {
  const app = createApp();

  afterAll(() => prisma.$disconnect());

  it('rejects unauthenticated calls to protected routes with 401', async () => {
    await request(app).get('/api/v1/parent/children').expect(401);
    await request(app).get('/api/v1/admin/students').expect(401);
  });

  it('rejects the SePay webhook without the API key with 401', async () => {
    await request(app).post('/api/v1/webhooks/sepay').send({}).expect(401);
  });

  it.todo('every role gets 403 outside its column (needs auth: sign in as each seeded user)');
});
