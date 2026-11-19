/** B6: VietQR image URL from SePay. `bank` is SePay's bank code (SCHOOL_BANK_NAME). */
export function sepayQrUrl(opts: {
  account: string;
  bank: string;
  amountVnd: number;
  paymentCode: string;
}): string {
  const params = new URLSearchParams({
    acc: opts.account,
    bank: opts.bank,
    amount: String(opts.amountVnd),
    des: opts.paymentCode,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}
