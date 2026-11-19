import { sepayQrUrl } from './qr';

describe('sepayQrUrl', () => {
  it('builds the qr.sepay.vn URL with the payment code as content', () => {
    expect(
      sepayQrUrl({
        account: '0123',
        bank: 'MBBank',
        amountVnd: 100_000,
        paymentCode: 'SC48213907',
      }),
    ).toBe('https://qr.sepay.vn/img?acc=0123&bank=MBBank&amount=100000&des=SC48213907');
  });
});
