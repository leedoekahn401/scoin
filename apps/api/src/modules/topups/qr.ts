/** Builds the qr.sepay.vn image URL for a bank transfer. */
export function sepayQrUrl(opts: {
  bankAccount: string;
  bankCode: string;
  amountVnd: number;
  paymentCode: string;
}): string {
  const params = new URLSearchParams({
    acc: opts.bankAccount,
    bank: opts.bankCode,
    amount: String(opts.amountVnd),
    des: opts.paymentCode,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}
