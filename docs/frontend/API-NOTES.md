# API notes for the backend team

The front-ends call the backend only through `packages/api-client/src/contract.ts`. Every method is annotated with its HTTP route. `packages/api-client/src/http/client.ts` is the exact fetch implementation, so matching the paths, bodies and the error envelope below means the apps work against Express without code changes.

`packages/api-client/src/mock/engine.ts` implements every business rule from the SRS (B5 money safety, BR-01…BR-14, PIN lockout, idempotency, webhook dedup, low-balance re-arm). Treat it as an executable reference for the Express services. `pnpm verify` runs the §B13 demo script against it.

## Conventions the client relies on

- Base URL `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:4000/api/v1` for the Express API). The bundled mock API runs on `http://localhost:4010/api/v1` and `pnpm dev:demo` points all apps at it. JSON in, JSON out. Credits are integers; `…Vnd` fields are VND.
- Errors: non-2xx with `{ "error": { "code": ErrorCode, "message": string, "details"?: object } }`. The UI switches on `code` (see `packages/types/src/errors.ts`) and reads numbers from `details`. The TARGET API spelling is authoritative: `UNAUTHENTICATED`, `INTERNAL_ERROR`, `INVITE_CODE_INVALID`, `PARENT_LIMIT_REACHED`, `KIOSK_UNKNOWN`, `KIOSK_SESSION_EXPIRED`; notification type `NEW_REQUEST`. Codes that carry numbers:
  - `INSUFFICIENT_BALANCE {balance,total}`, `DAILY_LIMIT_REACHED {remainingToday,total,dailyLimit}`, `PIN_INVALID {attemptsLeft}`, `PIN_LOCKED {lockedUntil}`, `TOPUP_AMOUNT_OUT_OF_RANGE {min,max}`, `REFUND_EXCEEDS_BALANCE {balance}`, `STUDENT_HAS_BALANCE {balance}`, `ITEM_UNAVAILABLE {menuItemIds}`.
- Auth: `POST /auth/login` returns `{ accessToken, expiresIn, user: Me }`. The client sends `Authorization: Bearer <accessToken>`. On 401 it calls `POST /auth/refresh` once (with `credentials: "include"`, so the refresh cookie is sent) and expects `{ accessToken }`.
- Kiosk: every `/kiosk/*` request carries `X-Kiosk-Key` (device key) and, after sign-in, `X-Kiosk-Session` (the `sessionToken` from `POST /kiosk/sessions`).
- SSE `GET /parent/topups/:id/events`: the client reads it with fetch (so the bearer header works) and expects one `data: {"type":"PAID","topUpId","creditedCredits","balanceAfter"}` or `{"type":"EXPIRED","topUpId"}` event. If the stream fails it polls `GET /parent/topups/:id` every 3 s.
- CORS: allow the four app origins with credentials and the headers `Authorization, Content-Type, X-Kiosk-Key, X-Kiosk-Session`.

## Endpoints added beyond SRS §B7

The screens needed a few routes the SRS did not list. All are implemented in `apps/mock-api` on port `4010`.

| Route                                                                                                  | Why                                                                                                |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `GET /settings/public` → `{pinThresholdCredits, topUpMinCredits, topUpMaxCredits, topUpExpiryMinutes}` | Parent top-up range and POS PIN hint, without admin rights                                         |
| `PATCH /me`, `POST /me/password`                                                                       | Parent account screen (profile, email prefs FR-NOT-04, password)                                   |
| `POST /kiosk/cards/identify {cardCode}` → `{fullName, className, photoUrl, pinLockedUntil, hasPin}`    | The kiosk greets the student before the PIN pad                                                    |
| `GET /admin/students/:id/transactions?page&pageSize`                                                   | Wallet history on the student page                                                                 |
| `POST /admin/topups/:id/reviewed`                                                                      | Clear `needsReview` after the accountant checks it                                                 |
| `GET /admin/refunds`, `GET /admin/adjustments`                                                         | History lists next to the forms                                                                    |
| `DELETE /admin/menu/items/:id/sold-out`                                                                | Undo "sold out today"                                                                              |
| `GET /admin/topups/review` returns `TopUpReviewItem` (adds `transferAmountVnd`, `remainderVnd`)        | Show requested vs received                                                                         |
| `/dev/*` (simulate-transfer, demo-cards, reset)                                                        | Demo only. The API serves `simulate-transfer` while the mock payment provider is active (ADR 0007) |

## Shapes

Request/response types are in `packages/types/src/dto.ts` and `entities.ts`. Paginated lists return `{ items, page, pageSize, total }`.
