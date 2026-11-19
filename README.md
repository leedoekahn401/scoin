# SchoolCoin

Cashless school canteen: parents top up by bank transfer, students pay with a card at the POS,
and the school sees every credit in one ledger.

| App | Path | Port |
|---|---|---|
| API (NestJS) | `apps/api` | 4000 — Swagger at `/docs` |
| POS | `apps/pos` | 3001 |
| Parent PWA | `apps/parent` | 3002 |
| Kiosk | `apps/kiosk` | 3003 |
| Admin | `apps/admin` | 3004 |

## Setup in 5 commands

Requires Node 22 (`.nvmrc`), pnpm 10 and Docker.

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm dev
```

Then `pnpm db:seed` for demo data. Dev mail lands in Mailpit at http://localhost:8025.

## Scripts

| Script | Does |
|---|---|
| `pnpm dev` | runs API + 4 apps in parallel (Turbo) |
| `pnpm build` | builds everything |
| `pnpm lint` / `pnpm typecheck` | across all workspaces |
| `pnpm test` | unit tests |
| `pnpm test:e2e` | API end-to-end tests (needs `DATABASE_URL` pointing at `schoolcoin_test`) |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | loads demo data |
| `pnpm db:reset` | drop, migrate, seed |
| `pnpm api:generate` | refreshes `packages/api-client` from the running API |

## Conventions

- **Branches:** `feat/FR-POS-06-daily-limit`, `fix/…`, `chore/…`; PRs into `main` only.
- **Commits:** Conventional Commits (`feat(pos): decline order over daily limit`).
- **Money:** always integer credits in code and DB; convert to VND only for display and SePay.
- **Time:** store UTC; compute "today" with `apps/api/src/common/utils/vn-day.ts` only.
- **API changes:** update DTOs → run `pnpm api:generate` → commit the regenerated client in the same PR.
- **Migrations:** one migration per PR that changes the schema; never edit an applied migration.

## Docs

- [Architecture decisions](docs/adr/)
- [SePay setup](docs/sepay-setup.md)
- [Demo script](docs/demo-script.md)
- SRS exports in [docs/srs](docs/srs/), diagrams in [docs/diagrams](docs/diagrams/)
