import { LedgerType, TopUpStatus } from '@prisma/client';
import type { Role } from '@schoolcoin/types';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import { config } from '../src/config';
import { mockPaymentProvider } from '../src/modules/payments/mock-payment.provider';
import { paymentsService } from '../src/modules/payments/payments.service';
import { ledgerService } from '../src/modules/wallet/ledger.service';
import { prisma } from '../src/prisma';

// UC-04, UC-23 with the mock payment provider (ADR 0007): the parent starts a top-up, a simulated
// transfer pays it, and the credits arrive through the double-entry ledger (ADR 0006).
describe('Top-up with the mock payment provider', () => {
  const app = createApp();
  let parentToken: string;
  let studentId: string;
  let otherStudentId: string;

  const tokenFor = (id: string, email: string, role: Role) =>
    jwt.sign({ sub: id, email, role }, config.jwt.accessSecret, { expiresIn: '5m' });

  beforeAll(async () => {
    const link = await prisma.parentStudent.findFirstOrThrow({ include: { parent: true } });
    parentToken = tokenFor(link.parentId, link.parent.email ?? '', 'PARENT');
    studentId = link.studentId;
    const other = await prisma.student.findFirstOrThrow({
      where: { parents: { none: { parentId: link.parentId } } },
    });
    otherStudentId = other.id;
  });

  afterAll(() => prisma.$disconnect());

  const asParent = () => ({ Authorization: `Bearer ${parentToken}` });

  async function startTopUp(amountCredits: number) {
    const res = await request(app)
      .post('/api/v1/parent/topups')
      .set(asParent())
      .send({ studentId, amountCredits })
      .expect(201);
    return res.body as { id: string; paymentCode: string; amountVnd: number };
  }

  function pay(amountVnd: number, content: string) {
    return request(app)
      .post('/api/v1/dev/simulate-transfer')
      .set(asParent())
      .send({ amountVnd, content })
      .expect(200);
  }

  async function balance() {
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { studentId } });
    return wallet.balanceCredits;
  }

  it('the parent starts a top-up, a simulated transfer pays it, the wallet is credited', async () => {
    const before = await balance();

    const created = await request(app)
      .post('/api/v1/parent/topups')
      .set(asParent())
      .send({ studentId, amountCredits: 50 })
      .expect(201);
    expect(created.body).toMatchObject({
      studentId,
      amountCredits: 50,
      amountVnd: 50_000,
      status: 'PENDING',
      bank: 'MOCKBANK',
    });
    expect(created.body.paymentCode).toMatch(/^SC\d{8}$/);
    expect(created.body.qrUrl).toMatch(/^data:image\/svg\+xml/);
    const { id, paymentCode } = created.body as { id: string; paymentCode: string };

    const transfer = await pay(50_000, `NAP TIEN ${paymentCode}`);
    expect(transfer.body).toMatchObject({
      status: 'MATCHED',
      code: paymentCode,
      topUpId: id,
      creditedCredits: 50,
      remainderVnd: 0,
      studentId,
    });

    const paid = await request(app).get(`/api/v1/parent/topups/${id}`).set(asParent()).expect(200);
    expect(paid.body).toMatchObject({ status: 'PAID', needsReview: false });
    expect(await balance()).toBe(before + 50);

    const posting = await prisma.ledgerTransaction.findUniqueOrThrow({
      where: { type_refType_refId: { type: LedgerType.TOPUP_SEPAY, refType: 'TOP_UP', refId: id } },
      include: { entries: { include: { wallet: { select: { kind: true } } } } },
    });
    expect(posting.entries.map((e) => [e.wallet.kind, e.amountCredits]).sort()).toEqual([
      ['BANK', -50],
      ['STUDENT', 50],
    ]);
  });

  it('credits what actually arrived and flags a different amount for review (BR-06)', async () => {
    const before = await balance();
    const { id, paymentCode } = await startTopUp(30);

    const transfer = await pay(25_500, paymentCode);

    expect(transfer.body).toMatchObject({ creditedCredits: 25, remainderVnd: 500 });
    const topUp = await prisma.topUp.findUniqueOrThrow({ where: { id } });
    expect(topUp).toMatchObject({ status: TopUpStatus.PAID, needsReview: true });
    expect(await balance()).toBe(before + 25);
  });

  it('still credits a late payment for an expired top-up (BR-08)', async () => {
    const before = await balance();
    const { id, paymentCode } = await startTopUp(20);
    await prisma.topUp.update({ where: { id }, data: { status: TopUpStatus.EXPIRED } });

    await pay(20_000, paymentCode);

    expect(await prisma.topUp.findUniqueOrThrow({ where: { id } })).toMatchObject({
      status: TopUpStatus.PAID,
    });
    expect(await balance()).toBe(before + 20);
  });

  it('records and credits the same transfer once (NFR-REL-03)', async () => {
    const before = await balance();
    const { paymentCode } = await startTopUp(10);
    const transfer = mockPaymentProvider.transfer({ amountVnd: 10_000, content: paymentCode });

    const [first, second] = await Promise.all([
      paymentsService.receiveTransfer(transfer),
      paymentsService.receiveTransfer(transfer),
    ]);
    const again = await paymentsService.receiveTransfer(transfer);

    expect(first).toEqual(second);
    expect(again).toEqual(first);
    expect(await balance()).toBe(before + 10);
  });

  it('pays a top-up once when two transfers carry its code at the same time', async () => {
    const before = await balance();
    const { paymentCode } = await startTopUp(15);

    const results = await Promise.all([pay(15_000, paymentCode), pay(15_000, paymentCode)]);

    expect(results.map((r) => r.body.status).sort()).toEqual(['MATCHED', 'UNMATCHED']);
    expect(await balance()).toBe(before + 15);
  });

  it('leaves transfers without a payable top-up unmatched (FR-TOP-06)', async () => {
    const before = await balance();

    const noCode = await pay(40_000, 'tien an trua');
    expect(noCode.body).toMatchObject({ status: 'UNMATCHED', code: null, topUpId: null });

    const { id, paymentCode } = await startTopUp(40);
    const cancelled = await request(app)
      .post(`/api/v1/parent/topups/${id}/cancel`)
      .set(asParent())
      .expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');
    const afterCancel = await pay(40_000, paymentCode);
    expect(afterCancel.body).toMatchObject({ status: 'UNMATCHED', code: paymentCode });

    await request(app).post(`/api/v1/parent/topups/${id}/cancel`).set(asParent()).expect(422);
    expect(await balance()).toBe(before);
  });

  it('rejects amounts out of range, other parents’ children and other roles', async () => {
    const outOfRange = await request(app)
      .post('/api/v1/parent/topups')
      .set(asParent())
      .send({ studentId, amountCredits: 5 })
      .expect(422);
    expect(outOfRange.body.error).toMatchObject({
      code: 'TOPUP_AMOUNT_OUT_OF_RANGE',
      details: { min: 10, max: 2000 },
    });

    await request(app)
      .post('/api/v1/parent/topups')
      .set(asParent())
      .send({ studentId: otherStudentId, amountCredits: 50 })
      .expect(403);

    const cashier = await prisma.user.findFirstOrThrow({ where: { role: 'CASHIER' } });
    await request(app)
      .post('/api/v1/parent/topups')
      .set({ Authorization: `Bearer ${tokenFor(cashier.id, '', 'CASHIER')}` })
      .send({ studentId, amountCredits: 50 })
      .expect(403);

    await request(app)
      .post('/api/v1/dev/simulate-transfer')
      .send({ amountVnd: 1_000, content: 'x' })
      .expect(401);
  });

  it('keeps the books balanced after all of the above', async () => {
    await expect(ledgerService.checkConsistency()).resolves.toEqual({
      walletMismatches: [],
      unbalancedTransactionIds: [],
      totalCredits: 0,
    });
  });
});
