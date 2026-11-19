describe('SepayService', () => {
  it.todo('ignores a webhook whose id was already processed');
  it.todo('credits the matching top-up when the amount is exact');
  it.todo('moves the top-up to REVIEW when the amount differs');
  it.todo('stores an UNMATCHED transaction when no SC code is found');
});
