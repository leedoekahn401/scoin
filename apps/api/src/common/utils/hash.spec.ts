import { hashSecret, verifySecret } from './hash';

describe('hash', () => {
  it('produces an argon2id hash that verifies', async () => {
    const hashed = await hashSecret('1234');
    expect(hashed.startsWith('$argon2id$')).toBe(true);
    await expect(verifySecret(hashed, '1234')).resolves.toBe(true);
    await expect(verifySecret(hashed, '9999')).resolves.toBe(false);
  });
});
