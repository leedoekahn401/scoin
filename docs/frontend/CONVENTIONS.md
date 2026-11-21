# SchoolCoin front-end conventions

Read this before touching any app. It is short on purpose; every rule is enforced in review.

## 1. Stack (do not add to it)

- Next.js 15 App Router, React 19, TypeScript **strict** (`noUncheckedIndexedAccess` on).
- Tailwind CSS 4 with the Warm Studio tokens from `@schoolcoin/ui/styles.css`.
- Data: **TanStack Query v5** over `useApi()` from `@schoolcoin/api-client/react`.
- Forms: React Hook Form + Zod for anything with more than two fields; small inline forms may use `useState`.
- Icons: `lucide-react`. Charts (admin only): `recharts` via `@/components/bar-series-chart`. QR: `qrcode.react`.
- No other UI kit, no CSS files besides `globals.css`, no `styled-jsx`, no inline `style={{ color: "#..." }}`.

## 2. Where things live

```
packages/types       enums, entities, DTOs, ErrorCode, constants, can(role, capability), vnDate()
packages/api-client  SchoolCoinApi contract, mock engine, http client, <SchoolCoinProvider>, useApi(), useSession()
packages/ui          every visual primitive + format/labels/errors helpers  ← import from "@schoolcoin/ui"
packages/mock-data   seed data + DEMO_ACCOUNTS (only login pages import this)
apps/<app>/src/app            routes (App Router). Route groups: (app) = signed-in area
apps/<app>/src/components     app-specific components (one component per file, kebab-case file names)
apps/<app>/src/lib/query-keys.ts   ALL query keys for that app
```

**Workers only edit inside their own `apps/<name>/`.** If a shared primitive is missing, build it locally in `apps/<name>/src/components/` and mention it in your final report.

## 3. Data fetching pattern (copy this)

```tsx
'use client';
const api = useApi();
const queryClient = useQueryClient();

const { data, isPending, error, refetch } = useQuery({
  queryKey: queryKeys.menu,
  queryFn: () => api.admin.listMenu(),
});

const save = useMutation({
  mutationFn: (dto: UpdateMenuItemDto) => api.admin.updateItem(id, dto),
  onSuccess: () => {
    toast.success('Đã lưu món');
    void queryClient.invalidateQueries({ queryKey: queryKeys.menu });
  },
  onError: (err) => toast.error(errorMessage(err)),
});
```

- Render three states every time: `isPending` → `<LoadingBlock/>` or `<Skeleton/>`; `error` → `<Notice tone="danger">{errorMessage(error)}</Notice>` with a retry; data → the screen. Empty data → `<EmptyState title=… />`.
- **Never** show `error.message`. Always `errorMessage(err)` (Vietnamese, fills in numbers).
- Branch on error codes with `isApiError(err, "PIN_INVALID")` and read numbers with `err.detailsOf("PIN_INVALID")?.attemptsLeft`.
- The API contract is `packages/api-client/src/contract.ts`. Read it; do not guess method names.
- Every page that uses hooks starts with `"use client";`.

## 4. Design rules: "The Warm Studio" (from ronansat-platform)

Look at `apps/admin/src/app/(app)/page.tsx` (dashboard) and `packages/ui/src/components/*` before designing anything. A screen is mostly **paper + white + ink**, with **gold for the single primary action** or the active state.

1. **Tokens only.** Colours: `bg-paper-bg`, `bg-surface-white`, `text-ink-fg`, `text-ink-muted`, `border-border`, `border-border-strong`, `bg-brand`, `bg-brand-tint`, `text-brand-deep`, `text-success|danger|info|warning`, `bg-*-tint`. Radii: `rounded-[var(--ui-radius)]`, `rounded-[var(--ui-radius-sm)]`, `rounded-[var(--ui-radius-lg)]`. Shadows: `shadow-[var(--ui-shadow)]` etc. **No raw hex, no `rounded-xl/2xl`, no `shadow-lg`, no `bg-blue-500`, no gradients.**
2. **One gold per region.** `<Button variant="primary">` once per panel/dialog. Everything else `secondary` or `ghost`.
3. **Borders are 1px hairlines** (`border border-border`). Never `border-2` (exception: the PinPad dots and underline tabs already in ui).
4. **Depth is soft.** Use `<Panel>` (white card + hairline + soft shadow). No hard offset shadows, no `backdrop-blur` overlays, no hover `translate`/`scale`. Interactive elements get `workbook-press`.
5. **Sentence case everywhere.** No `uppercase`, no wide `tracking-*`. Headings use `font-display font-semibold tracking-tight`.
6. **Cut, don't add.** One `<PageHeader title description actions/>` per page. No subtitles that restate the title, no decorative badges, no emoji, no illustrations, no "Welcome to…" hero.
7. **Labels are small hairline tags** (`<Badge tone=…>`), never full pills. `rounded-full` only for avatars, dots and count badges.
8. **Explain on screen**, never with `title=` tooltips. Icon-only buttons use `<IconButton label="…">`.
9. **Numbers:** always `tabular` class, always via `formatCredits`, `formatCreditsWithVnd`, `<Money>`, `formatVnd`, `formatDateTime`, `formatTime`, `formatRelative`, `formatWhen`. The unit is **xu** (1 xu = 1,000 ₫). Example: `25 xu (25.000 ₫)`.
10. **Status words** come from `@schoolcoin/ui` label maps (`ORDER_STATUS`, `TOPUP_STATUS`, `REQUEST_STATUS`, `SEPAY_STATUS`, `CARD_STATUS`, `LEDGER_TYPE`, `ROLE_LABEL`, `USER_STATUS`): `<Badge tone={X[s].tone}>{X[s].label}</Badge>`.
11. **Dialogs:** `<Modal>` / `<ConfirmDialog>` only. Destructive confirmations use `destructive` and collect a reason when the SRS requires one.
12. **Toasts** for completed mutations: `toast.success("Đã …")`. Errors: `toast.error(errorMessage(err))`, or inline `<Notice>` when the user must read it.
13. **Touch targets** in POS/kiosk ≥ 48 px (`size="lg"`/`"xl"` buttons). Parent app must work at 360 px wide.
14. **Links that look like buttons** use `<LinkButton href>`, never `<Link><Button/></Link>`.

## 5. Copy

- UI language is **Vietnamese** (NFR-USE-01), natural and polite: "Nạp xu", "Đã lưu", "Không đủ số dư". Address parents as "bạn", students at the kiosk as "bạn"/"em" consistently ("bạn").
- Code, identifiers and comments are **English**.
- Short. A button says the action ("Nạp 100 xu", "Hủy đơn", "Gán cho học sinh"), not "OK"/"Submit".

## 6. Code quality

- TypeScript: no `any`, no `@ts-ignore`, no non-null `!` unless the invariant is obvious on the same screen. Types come from `@schoolcoin/types`.
- Components small and focused; a page file over ~300 lines gets split into `src/components/*`.
- No `useEffect` for derived state; compute it. No fetch in `useEffect`; use `useQuery`.
- Accessible: real `<button>`/`<a>`, labels for inputs (use `<Field>`), `aria-label` on icon buttons, `alt` on images.
- Before finishing: `pnpm --filter @schoolcoin/<app> typecheck`, `lint` and `build` must all pass with **zero errors and zero warnings**.
