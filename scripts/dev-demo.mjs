// Runs the shared mock API on :4010 plus all four apps in "http" mode, so the
// apps share one database and the cross-app demo (SRS §B13) works end to end:
// a kiosk request shows up in the parent app, a POS charge on the dashboard…
//   pnpm dev:demo
import { spawn } from 'node:child_process';

const env = {
  ...process.env,
  NEXT_PUBLIC_API_MODE: 'http',
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4010/api/v1',
  NEXT_TELEMETRY_DISABLED: '1',
};

const child = spawn('pnpm', ['exec', 'turbo', 'run', 'dev', '--concurrency=6'], {
  stdio: 'inherit',
  env,
  shell: true,
});
child.on('exit', (code) => process.exit(code ?? 0));
