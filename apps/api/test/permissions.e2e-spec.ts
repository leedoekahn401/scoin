import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// B11: each role gets 403 outside its column of the permission matrix (SRS 4.12).
describe('Permissions', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(() => app.close());

  it('rejects unauthenticated calls to protected routes with 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/parent/children').expect(401);
    await request(app.getHttpServer()).get('/api/v1/admin/students').expect(401);
  });

  it('rejects the SePay webhook without the API key with 401', async () => {
    await request(app.getHttpServer()).post('/api/v1/webhooks/sepay').send({}).expect(401);
  });

  it.todo('every role gets 403 outside its column (needs auth: sign in as each seeded user)');
});
