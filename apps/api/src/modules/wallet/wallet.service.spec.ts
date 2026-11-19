describe('WalletService', () => {
  it.todo('credit() adds to the balance and appends a ledger entry');
  it.todo('debit() rejects with INSUFFICIENT_BALANCE when the balance is too low');
  it.todo('debit() rejects with DAILY_LIMIT_REACHED past the daily limit');
  it.todo('debit() rejects with WALLET_LOCKED on a locked wallet');
});
