// B11 unit tests for the wallet service.
describe('WalletService', () => {
  it.todo('charge: PURCHASE entry, balance decreases, balanceAfter is correct');
  it.todo('charge: INSUFFICIENT_BALANCE when balance < total, nothing written');
  it.todo('charge: DAILY_LIMIT_REACHED counts today (VN) purchases minus reversals');
  it.todo('charge: same idempotencyKey returns the existing order, no second charge');
  it.todo('charge: CARD_INACTIVE for a locked or replaced card');
  it.todo('PIN: required above threshold; 5 wrong attempts lock it for 15 minutes');
  it.todo('void: VOID_REVERSAL entry returns the credits, same day only');
  it.todo('refund: REFUND entry, cannot exceed the balance');
  it.todo('low balance: alert once when crossing below the threshold, re-arms at or above it');
});
