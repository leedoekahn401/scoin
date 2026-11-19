// B11 unit tests for the webhook handler (B5).
describe('SepayService', () => {
  it.todo('match: credits floor(amount/1000), TOPUP_SEPAY entry, top-up PAID, tx MATCHED');
  it.todo('duplicate: same SePay id returns success and changes nothing');
  it.todo('amount mismatch: credits floor(amount/1000), records remainder, needsReview = true');
  it.todo('no code: tx UNMATCHED, no wallet change');
  it.todo('out transfer: stored, no wallet change');
  it.todo('late payment on an EXPIRED top-up is still credited (BR-08)');
});
