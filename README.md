# SchoolCoin

Prepaid credit system for one school: parents top up by VietQR bank transfer through SePay,
students pay at the cafeteria with a student card, a kiosk lets students check their balance and
ask for more, and the school council runs it all from an admin page. **1 credit = 1,000 VND.**

- Spec: [SRS and technical design v1.0](docs/srs/schoolcoin-srs-v1.0.md)
- Work: [backlog by sprint and owner](docs/backlog.md)

| App            | Path            | Port                                              | Owner     |
| -------------- | --------------- | ------------------------------------------------- | --------- |
| API (Express)  | `apps/api`      | 4000 — base path `/api/v1`, Swagger at `/docs`    | BE-1…BE-4 |
| Mock API (dev) | `apps/mock-api` | 4010 — base path `/api/v1`, reset at `/dev/reset` | FE-1…FE-2 |
| POS            | `apps/pos`      | 3001                                              | FE-1      |
| Parent PWA     | `apps/parent`   | 3002                                              | FE-2      |
| Kiosk          | `apps/kiosk`    | 3003                                              | FE-1      |
| Admin          | `apps/admin`    | 3004                                              | FE-2      |

## Setup in 5 commands

Requires Node 22 (`.nvmrc`), pnpm 10 and Docker.

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm db:reset
pnpm dev
```

`pnpm db:reset` migrates and loads the demo data ([accounts and cards](apps/api/prisma/seed/README.md)).
Dev mail lands in Mailpit at http://localhost:8025. For the kiosk, copy `apps/kiosk/.env.example`
to `apps/kiosk/.env.local`.

If another Postgres already uses port 5432, start Docker's with `POSTGRES_PORT=5433 docker compose up -d`
and change the port in `DATABASE_URL`.

To run everything in containers instead (NFR-POR-01): `docker compose --profile full up -d --build`,
then `pnpm db:seed`.

## Scripts

| Script                         | Does                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `pnpm dev`                     | runs API + 4 apps in parallel (Turbo)                                               |
| `pnpm build`                   | builds everything                                                                   |
| `pnpm lint` / `pnpm typecheck` | across all workspaces                                                               |
| `pnpm test`                    | unit tests (Jest)                                                                   |
| `pnpm test:e2e`                | API end-to-end tests (needs `DATABASE_URL` pointing at `schoolcoin_test`)           |
| `pnpm test:ui`                 | Playwright, one happy path per app (first: `pnpm exec playwright install chromium`) |
| `pnpm db:migrate`              | `prisma migrate dev`                                                                |
| `pnpm db:seed`                 | loads demo data                                                                     |
| `pnpm db:reset`                | drop, migrate, seed                                                                 |
| `pnpm api:generate`            | refreshes `packages/api-client` from the running API                                |

## Where things live

- **Business rules and limits** (`RULES`), **permission matrix** (`PERMISSIONS`), roles, ledger
  types and error codes: `packages/types` — shared by the API and the apps.
- **Data model:** `apps/api/prisma/schema.prisma` (SRS B4).
- **Endpoints:** one controller per module in `apps/api/src/modules`, matching SRS B7. Unbuilt
  endpoints answer `501 NOT_IMPLEMENTED` with the requirement ID.
- **UI kit:** `packages/ui` (Warm Studio tokens and primitives in `packages/ui/src/styles.css`).

## Front-end MVP

The four Next.js 15 apps (`apps/pos`, `apps/parent`, `apps/kiosk`, `apps/admin`) share
`packages/{types,api-client,mock-data,ui,config}` and run without the Express API by default.

```bash
pnpm dev:pos       # POS on http://localhost:3001
pnpm dev:parent    # Parent PWA on http://localhost:3002
pnpm dev:kiosk     # Kiosk on http://localhost:3003
pnpm dev:admin     # Admin on http://localhost:3004
pnpm dev:demo      # all four apps + one shared mock API on http://localhost:4010
```

`pnpm dev` gives each origin its own in-browser mock database. Use `pnpm dev:demo` for the SRS
§B13 cross-app demo so requests at the kiosk reach the parent app. Reset it with
`curl -X POST localhost:4010/api/v1/dev/reset` or by deleting `apps/mock-api/.data/`.

Demo logins (password `demo1234`): POS `thungan1`, Parent `lan.nguyen@gmail.com`, Admin
`admin@schoolcoin.vn`. At the kiosk, tap a demo card and enter PIN `1234`; the device key comes
from Admin → Thiết bị kiosk.

To plug in the real API, set `NEXT_PUBLIC_API_MODE=http`,
`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_DEMO_TOOLS=0` and
`NEXT_PUBLIC_KIOSK_DEVICE_KEY=<key>` in each app's `.env.local`. The error-code spellings and
extra demo routes are documented in [API notes](docs/frontend/API-NOTES.md); contributor rules
are in [front-end conventions](docs/frontend/CONVENTIONS.md).

```bash
pnpm verify                                   # SRS §B13 walkthrough on the mock engine
pnpm smoke:http                               # real HttpApi ↔ mock API (start it on :4010 first)
pnpm test:ui                                  # one Playwright happy path per app
node scripts/lint-copy.mjs apps/admin/src apps/pos/src apps/kiosk/src apps/parent/src packages/ui/src
```

Install browsers once with `pnpm exec playwright install chromium` if `pnpm test:ui` needs them.

## Conventions

- **Branches:** `feat/FR-POS-06-daily-limit`, `fix/…`, `chore/…`; PRs into `main` only.
- **Commits:** Conventional Commits (`feat(pos): decline order over daily limit`).
- **Money:** always integer credits in code and DB; convert to VND only for display and SePay.
- **Time:** store UTC; compute "today" with `apps/api/src/common/utils/vn-day.ts` only (BR-03).
- **Money changes** only through `WalletService` ([ADR 0002](docs/adr/0002-ledger-with-row-locking.md)).
- **API changes:** update DTOs → run `pnpm api:generate` → commit the regenerated client in the same PR.
- **Migrations:** one migration per PR that changes the schema; never edit an applied migration.
- **UI language:** Vietnamese (NFR-USE-01); code, comments and docs in English.

## Docs

- [Front-end conventions](docs/frontend/CONVENTIONS.md)
- [API notes for the backend team](docs/frontend/API-NOTES.md)
- [Architecture decisions](docs/adr/) (API on Express: [ADR 0005](docs/adr/0005-express-instead-of-nestjs.md))
- [SePay setup](docs/sepay-setup.md)
- [Demo script](docs/demo-script.md)
- [Diagrams](docs/diagrams/) (Mermaid, from the SRS)
