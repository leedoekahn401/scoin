import { hash, verify } from '@node-rs/argon2';

// NFR-SEC-02: Argon2id (the library default) for passwords and PINs.
// Parameters follow the OWASP minimum: 19 MiB memory, 2 iterations, 1 lane.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashSecret(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifySecret(hashed: string, plain: string): Promise<boolean> {
  return verify(hashed, plain);
}
