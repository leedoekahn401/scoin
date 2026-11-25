import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import configuration from './configuration';
import { validateEnv } from './env.validation';

// Like Nest's ConfigModule: read .env when present; variables already set win.
// Assigning keys (not process.loadEnvFile) also reaches Jest's sandboxed process.env.
if (existsSync('.env')) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync('.env', 'utf8')))) {
    process.env[key] ??= value;
  }
}
validateEnv(process.env);

export const config = configuration();
