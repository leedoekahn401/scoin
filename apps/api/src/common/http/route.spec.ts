import { Router } from 'express';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { z } from '../zod';
import { errorHandler } from './error-handler';
import { route } from './route';

function app(router: Router) {
  return express().use(express.json()).use(router).use(errorHandler);
}

const token = (role: string) =>
  jwt.sign({ sub: 'u1', email: 'a@b.c', role }, config.jwt.accessSecret, { expiresIn: '1m' });

describe('route()', () => {
  const router = Router();
  route(router, {
    method: 'post',
    path: '/things/:id',
    name: 'create',
    tag: 'test',
    roles: ['ADMIN'],
    body: z.object({ n: z.number() }),
    handler: (req) => ({ id: req.params.id, body: req.body }),
  });
  route(router, {
    method: 'post',
    path: '/open',
    name: 'open',
    tag: 'test',
    public: true,
    status: 204,
    handler: () => 'ignored',
  });
  const server = app(router);

  it('needs a token unless public', async () => {
    await request(server).post('/things/1').send({ n: 1 }).expect(401);
    await request(server).post('/open').expect(204, '');
  });

  it('enforces roles, then validates and strips unknown keys', async () => {
    await request(server)
      .post('/things/1')
      .set('Authorization', `Bearer ${token('PARENT')}`)
      .send({ n: 1 })
      .expect(403);

    const bad = await request(server)
      .post('/things/1')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ n: 'x' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_FAILED');

    await request(server)
      .post('/things/1')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({ n: 1, extra: true })
      .expect(201, { id: '1', body: { n: 1 } });
  });
});
