import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { errorHandler } from '../../common/http/error-handler';
import { config } from '../../config';
import { examplesRouter } from './examples.routes';
import { examplesService } from './examples.service';

// The mock-up in docs/api/express-utils.md, driven over HTTP: no database involved.
describe('examples mock-up API', () => {
  const server = express().use(express.json()).use(examplesRouter).use(errorHandler);
  const as = (id: string, role: string) => ({
    Authorization: `Bearer ${jwt.sign({ sub: id, email: `${id}@x.vn`, role }, config.jwt.accessSecret, { expiresIn: '1m' })}`,
  });
  const manager = as('11111111-1111-4111-8111-111111111111', 'CAFE_MANAGER');
  const otherManager = as('22222222-2222-4222-8222-222222222222', 'CAFE_MANAGER');
  const admin = as('33333333-3333-4333-8333-333333333333', 'ADMIN');
  const parent = as('44444444-4444-4444-8444-444444444444', 'PARENT');

  const create = (body: object) =>
    request(server).post('/examples/snacks').set(manager).send(body).expect(201);

  beforeEach(() => examplesService.reset());

  it('creates, then 409s on a duplicate name', async () => {
    const { body } = await create({ name: 'Bánh mì', priceCredits: 15, stock: 3 });
    expect(body).toMatchObject({ name: 'Bánh mì', available: true });

    const dup = await request(server)
      .post('/examples/snacks')
      .set(manager)
      .send({ name: 'bánh mì', priceCredits: 1, stock: 1 })
      .expect(409);
    expect(dup.body.error).toMatchObject({ code: 'CONFLICT', details: { name: 'bánh mì' } });
  });

  it('lists with pagination and stringbool filters', async () => {
    for (const name of ['A', 'B', 'C']) await create({ name, priceCredits: 1, stock: 1 });
    await create({ name: 'Hidden', priceCredits: 1, stock: 1, available: false });

    const page = await request(server)
      .get('/examples/snacks?page=2&pageSize=2&available=true')
      .set(parent)
      .expect(200);
    expect(page.body).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(page.body.items).toHaveLength(1);

    await request(server).get('/examples/snacks?pageSize=500').set(parent).expect(400);
    await request(server)
      .get('/examples/snacks?from=2026-11-03&to=2026-11-02')
      .set(parent)
      .expect(400);
  });

  it('400s a malformed id and 404s an unknown one', async () => {
    const bad = await request(server).get('/examples/snacks/nope').set(parent).expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_FAILED');
    const missing = await request(server)
      .get('/examples/snacks/55555555-5555-4555-8555-555555555555')
      .set(parent)
      .expect(404);
    expect(missing.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Snack not found' });
  });

  it('422s a purchase that exceeds the stock', async () => {
    const { body: snack } = await create({ name: 'Sữa', priceCredits: 8, stock: 2 });
    const ok = await request(server)
      .post(`/examples/snacks/${snack.id}/buy`)
      .set(parent)
      .send({ quantity: 2 })
      .expect(200);
    expect(ok.body).toMatchObject({ totalCredits: 16, stockLeft: 0 });

    const refused = await request(server)
      .post(`/examples/snacks/${snack.id}/buy`)
      .set(parent)
      .send({ quantity: 1 })
      .expect(422);
    expect(refused.body.error).toMatchObject({ code: 'ITEM_UNAVAILABLE', details: { stock: 0 } });
  });

  it('lets only the creator or an admin delete', async () => {
    const { body: snack } = await create({ name: 'Chè', priceCredits: 5, stock: 1 });
    await request(server).delete(`/examples/snacks/${snack.id}`).set(parent).expect(403);
    await request(server).delete(`/examples/snacks/${snack.id}`).set(otherManager).expect(403);
    await request(server).delete(`/examples/snacks/${snack.id}`).set(admin).expect(204, '');
  });

  it('streams one SSE event on update, then closes', async () => {
    const { body: snack } = await create({ name: 'Xôi', priceCredits: 10, stock: 5 });
    const stream = request(server).get(`/examples/snacks/${snack.id}/events`).set(parent);
    const done = stream.then((res) => res);

    while (examplesService.events.listenerCount('updated') === 0) {
      await new Promise((r) => setTimeout(r, 5));
    }
    await request(server)
      .patch(`/examples/snacks/${snack.id}`)
      .set(manager)
      .send({ stock: 4 })
      .expect(200);

    const res = await done;
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('event: updated');
    expect(res.text).toContain('"stock":4');
    expect(examplesService.events.listenerCount('updated')).toBe(0);
  });
});
