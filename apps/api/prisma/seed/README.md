# Demo data (B10)

`pnpm db:seed` loads this; `pnpm db:reset` drops, migrates and seeds.

| Account           | Sign in with                                                    | Role         |
| ----------------- | --------------------------------------------------------------- | ------------ |
| Council admin     | `admin@schoolcoin.local`                                        | ADMIN        |
| Accountant        | `accountant@schoolcoin.local`                                   | ACCOUNTANT   |
| Cafeteria manager | `manager@schoolcoin.local`                                      | CAFE_MANAGER |
| Cashiers          | username `cashier1`, `cashier2`                                 | CASHIER      |
| Parents           | `parent.an@…`, `parent.binh@…`, `parent.cuong@schoolcoin.local` | PARENT       |

All passwords: see `DEMO_PASSWORD` in `users.seed.ts`. All student PINs: `DEMO_PIN` in `students.seed.ts`.

| Student           | Class | Card code          | Parents                              | Controls              |
| ----------------- | ----- | ------------------ | ------------------------------------ | --------------------- |
| Nguyễn Minh Khang | 7A1   | `DEMOKHANG7A1CARD` | An, Bình (two parents)               | limit 40, alert at 20 |
| Nguyễn Bảo Ngọc   | 8A2   | `DEMONGOC8A2CARDX` | An (An has two children)             | —                     |
| Lê Gia Huy        | 7A1   | `DEMOHUY7A1CARDXX` | Cường                                | limit 60              |
| Phạm Thảo Vy      | 8A2   | `DEMOVY8A2CARDXXX` | none (link a preset parent in admin) | —                     |
| Đỗ Đức Anh        | 7A1   | `DEMOANH7A1CARDXX` | none                                 | —                     |

Card codes are fixed (not random like real ones, NFR-SEC-05) so printed demo cards survive a reset.
The kiosk device key comes from `SEED_KIOSK_KEY` in `apps/api/.env`.
History covers the last 14 days; today is empty so the demo starts with a full daily allowance.
