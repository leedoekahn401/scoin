# Backlog — requirements by sprint

Generated from the functional requirements in [the SRS](srs/schoolcoin-srs-v1.0.md) (section 4),
with owners from B12 and sprints from B13. Priority: **M** must, **S** should, **C** could.
"Apps" is where the requirement shows up in the UI; the backend owner builds the endpoint and the
front-end owner builds the screen. Use one GitHub issue per row (template: `.github/ISSUE_TEMPLATE/feature.md`).

Non-functional requirements and business rules (BR-xx) apply across these rows; the ones with
their own work items are listed at the end.

## Sprint 1 — Foundation (weeks 1–2)

| ID         | Requirement                                                                                                             | Pri | Backend | Apps  | Front-end  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- | --- | ------- | ----- | ---------- |
| FR-AUTH-01 | Parents and staff sign in with email (cashiers: username) and password.                                                 | M   | BE-1    | all   | FE-1, FE-2 |
| FR-AUTH-02 | A parent registers with an invite code from the school; the code links the new account to a student.                    | M   | BE-1    | all   | FE-1, FE-2 |
| FR-AUTH-03 | Users can reset a forgotten password through an emailed link that expires after 30 minutes.                             | S   | BE-1    | all   | FE-1, FE-2 |
| FR-AUTH-04 | Role-based access: each endpoint and admin screen is available only to the roles in the permission matrix (4.12).       | M   | BE-1    | all   | FE-1, FE-2 |
| FR-AUTH-05 | Sessions expire after inactivity: 30 minutes for admin roles, 12 hours for cashiers (one shift), 30 days for parents.   | S   | BE-1    | all   | FE-1, FE-2 |
| FR-AUTH-06 | After 5 failed sign-in attempts the account locks for 15 minutes.                                                       | S   | BE-1    | all   | FE-1, FE-2 |
| FR-ADM-04  | A council admin creates staff users with one role each; a cafeteria manager can create and deactivate cashier accounts. | M   | BE-1    | admin | FE-2       |

## Sprint 2 — Pay at the counter (weeks 3–4)

| ID         | Requirement                                                                                                                                                                                                   | Pri | Backend | Apps          | Front-end  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------- | ------------- | ---------- |
| FR-FAM-01  | A council admin can create a one-time invite code for a student, valid for 14 days.                                                                                                                           | M   | BE-1    | parent, admin | FE-2       |
| FR-FAM-02  | A signed-in parent can enter another invite code to link an additional child.                                                                                                                                 | M   | BE-1    | parent, admin | FE-2       |
| FR-FAM-03  | A student can be linked to at most two parent accounts.                                                                                                                                                       | M   | BE-1    | parent, admin | FE-2       |
| FR-FAM-04  | A parent sees and manages only the students linked to their account.                                                                                                                                          | M   | BE-1    | parent, admin | FE-2       |
| FR-FAM-05  | A council admin can unlink a parent from a student.                                                                                                                                                           | S   | BE-1    | parent, admin | FE-2       |
| FR-WAL-01  | Each student has exactly one wallet, created with 0 credits when the student is created.                                                                                                                      | M   | BE-2    | —             | —          |
| FR-WAL-02  | Every balance change is an append-only ledger entry with type, signed amount, resulting balance, source reference, actor and time.                                                                            | M   | BE-2    | —             | —          |
| FR-WAL-03  | A wallet balance can never go below 0.                                                                                                                                                                        | M   | BE-2    | —             | —          |
| FR-WAL-04  | Ledger entries are never edited or deleted; mistakes are corrected with new entries (reversal or adjustment).                                                                                                 | M   | BE-2    | —             | —          |
| FR-WAL-05  | The system can verify that each balance equals the sum of its ledger entries.                                                                                                                                 | S   | BE-2    | —             | —          |
| FR-TOP-08  | An accountant can record a cash top-up (student, amount, note); a printable receipt number is shown.                                                                                                          | M   | BE-3    | admin         | FE-2       |
| FR-POS-01  | The POS shows the menu by category with prices in credits; unavailable items are hidden.                                                                                                                      | M   | BE-2    | pos           | FE-1       |
| FR-POS-02  | The cashier builds a cart (add, remove, change quantity) and sees the total.                                                                                                                                  | M   | BE-2    | pos           | FE-1       |
| FR-POS-03  | The POS accepts a card code from a USB scanner (keyboard input) or the webcam.                                                                                                                                | M   | BE-2    | pos           | FE-1       |
| FR-POS-04  | After a scan the POS shows the student's photo, name, class, balance and remaining daily allowance.                                                                                                           | M   | BE-2    | pos           | FE-1       |
| FR-POS-05  | Orders whose total exceeds the PIN threshold require the student's PIN.                                                                                                                                       | M   | BE-2    | pos           | FE-1       |
| FR-POS-06  | A charge succeeds only if the card is active, the PIN (if needed) is correct, the balance is enough and the daily limit is not exceeded; otherwise it is declined with a specific reason and nothing changes. | M   | BE-2    | pos           | FE-1       |
| FR-POS-07  | A cashier can void their own order on the same day with a reason; a cafeteria manager can void any same-day order. Voiding writes a reversal ledger entry and returns the credits.                            | M   | BE-2    | pos           | FE-1       |
| FR-POS-08  | The POS lists today's orders for the signed-in cashier.                                                                                                                                                       | S   | BE-2    | pos           | FE-1       |
| FR-POS-09  | The POS works by keyboard and touch alone, and the card-scan field keeps focus automatically.                                                                                                                 | S   | BE-2    | pos           | FE-1       |
| FR-MENU-01 | A cafeteria manager can create, edit and archive categories and items (name, category, price in credits, image, available).                                                                                   | M   | BE-4    | admin, pos    | FE-2, FE-1 |
| FR-MENU-02 | Price changes apply to new orders only; orders keep the name and price at the time of sale.                                                                                                                   | M   | BE-4    | admin, pos    | FE-2, FE-1 |
| FR-MENU-03 | A manager can mark an item sold out for the day with one tap.                                                                                                                                                 | S   | BE-4    | admin, pos    | FE-2, FE-1 |
| FR-ADM-01  | A council admin can create, edit, deactivate and import (CSV) students.                                                                                                                                       | M   | BE-2    | admin         | FE-2       |
| FR-ADM-02  | A council admin can issue, lock and replace cards, and print cards in a printable layout.                                                                                                                     | M   | BE-2    | admin         | FE-2       |
| FR-ADM-03  | A council admin can set and reset a student's PIN.                                                                                                                                                            | M   | BE-2    | admin         | FE-2       |

## Sprint 3 — Money in (weeks 5–6)

| ID        | Requirement                                                                                                                                                                             | Pri | Backend | Apps          | Front-end  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------- | ------------- | ---------- |
| FR-TOP-01 | A parent can start a top-up for a linked child for 10–2,000 credits.                                                                                                                    | M   | BE-3    | parent, admin | FE-2       |
| FR-TOP-02 | The system generates a unique payment code (SC + 8 digits) and a VietQR image with the school's account, the amount in VND and the payment code as transfer content.                    | M   | BE-3    | parent, admin | FE-2       |
| FR-TOP-03 | The system receives SePay webhooks, authenticates them with the API key, and processes each SePay transaction at most once.                                                             | M   | BE-3    | parent, admin | FE-2       |
| FR-TOP-04 | When a webhook's payment code matches a top-up, the wallet is credited and the top-up marked paid.                                                                                      | M   | BE-3    | parent, admin | FE-2       |
| FR-TOP-05 | The parent's top-up screen updates to the result in real time, without a manual refresh.                                                                                                | M   | BE-3    | parent, admin | FE-2       |
| FR-TOP-09 | Pending top-ups not paid within 30 minutes are marked expired (a late payment is still credited, BR-08).                                                                                | S   | BE-3    | parent, admin | FE-2       |
| FR-TOP-10 | The parent app lists the parent's recent top-ups with status.                                                                                                                           | S   | BE-3    | parent, admin | FE-2       |
| FR-KIO-01 | A student signs in at the kiosk by scanning their card and entering their PIN.                                                                                                          | M   | BE-4    | kiosk         | FE-1       |
| FR-KIO-02 | The kiosk shows the balance, today's spending against the daily limit (if set), and the last 10 transactions.                                                                           | M   | BE-4    | kiosk         | FE-1       |
| FR-KIO-03 | The student can send a credit request (UC-11).                                                                                                                                          | M   | BE-4    | kiosk         | FE-1       |
| FR-KIO-04 | The student sees the status of their requests from the last 7 days.                                                                                                                     | S   | BE-4    | kiosk         | FE-1       |
| FR-KIO-05 | The kiosk signs the student out after 30 seconds of inactivity or when they tap "Done".                                                                                                 | M   | BE-4    | kiosk         | FE-1       |
| FR-KIO-06 | Only registered kiosk devices can call kiosk endpoints.                                                                                                                                 | S   | BE-4    | kiosk         | FE-1       |
| FR-REQ-01 | All linked parents are notified when a request is created.                                                                                                                              | M   | BE-4    | kiosk, parent | FE-1, FE-2 |
| FR-REQ-02 | A parent can approve (leading into a top-up) or decline (optional reason) a pending request.                                                                                            | M   | BE-4    | kiosk, parent | FE-1, FE-2 |
| FR-REQ-03 | Once one parent answers, the request is closed for the other.                                                                                                                           | M   | BE-4    | kiosk, parent | FE-1, FE-2 |
| FR-REQ-04 | Pending requests expire after 7 days.                                                                                                                                                   | S   | BE-4    | kiosk, parent | FE-1, FE-2 |
| FR-CTL-01 | A linked parent can set or remove a daily spending limit for a child (1–1,000 credits).                                                                                                 | M   | BE-2    | parent        | FE-2       |
| FR-CTL-02 | A linked parent can set or remove a low-balance threshold for a child.                                                                                                                  | M   | BE-2    | parent        | FE-2       |
| FR-CTL-03 | Both linked parents share the same settings; changes apply from the next purchase.                                                                                                      | M   | BE-2    | parent        | FE-2       |
| FR-CTL-04 | A parent can lock the child's card immediately; only a council admin issues a replacement.                                                                                              | M   | BE-2    | parent        | FE-2       |
| FR-NOT-01 | The parent app has a notification list with an unread count; notifications can be marked read.                                                                                          | M   | BE-4    | parent        | FE-2       |
| FR-NOT-02 | When a purchase takes a balance from at or above the threshold to below it, each linked parent gets one low-balance alert; no more until the balance is back at or above the threshold. | M   | BE-4    | parent        | FE-2       |
| FR-NOT-03 | Parents are notified of: top-up paid, low balance, new credit request, card locked — in the app and by email.                                                                           | M   | BE-4    | parent        | FE-2       |
| FR-ADM-06 | A council admin can register and revoke kiosk devices.                                                                                                                                  | S   | BE-4    | admin         | FE-2       |

## Sprint 4 — Control and polish (weeks 7–8)

| ID        | Requirement                                                                                                                                                        | Pri | Backend | Apps          | Front-end |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ------- | ------------- | --------- |
| FR-TOP-06 | Transfers whose code is missing or doesn't match become unmatched payments, listed for accountants.                                                                | M   | BE-3    | parent, admin | FE-2      |
| FR-TOP-07 | An accountant can assign an unmatched payment to a student, or ignore it with a reason.                                                                            | M   | BE-3    | parent, admin | FE-2      |
| FR-NOT-04 | A parent can turn email off per notification type (in-app stays on).                                                                                               | C   | BE-4    | parent        | FE-2      |
| FR-ADM-05 | A council admin can change settings: PIN threshold, top-up min/max, top-up expiry, school bank details.                                                            | S   | BE-4    | admin         | FE-2      |
| FR-RPT-01 | Sales report: totals by day, item and category for a date range; CSV export.                                                                                       | M   | BE-4    | admin         | FE-2      |
| FR-RPT-02 | Top-up report: totals by method (SePay, cash) and by day; CSV export.                                                                                              | M   | BE-4    | admin         | FE-2      |
| FR-RPT-03 | Outstanding balance report: the total of all wallet balances (credits the school owes students).                                                                   | S   | BE-3    | admin         | FE-2      |
| FR-RPT-04 | Reconciliation report: money received through SePay vs credits issued, listing unmatched and ignored payments.                                                     | S   | BE-3    | admin         | FE-2      |
| FR-RPT-05 | Dashboard: today's sales, today's top-ups, unmatched payments waiting, outstanding balance.                                                                        | S   | BE-4    | admin         | FE-2      |
| FR-RFD-01 | An accountant can record a refund of some or all of a balance (method: cash or bank transfer, note). The wallet is debited; the payout happens outside the system. | M   | BE-3    | admin         | FE-2      |
| FR-AUD-01 | Every staff action that changes money, cards, PINs, users, roles, menu prices or settings is written to an audit log (who, what, before/after, when, IP).          | M   | BE-1    | admin         | FE-2      |
| FR-AUD-02 | A council admin can search and filter the audit log.                                                                                                               | S   | BE-1    | admin         | FE-2      |

## Cross-cutting work items

| Item                                                                       | Source         | Owner      | Sprint                                     |
| -------------------------------------------------------------------------- | -------------- | ---------- | ------------------------------------------ |
| Monorepo, Docker Compose, CI                                               | B13 sprint 1   | BE-4       | 1                                          |
| Prisma schema and first migration                                          | B4             | BE-1, BE-2 | 1 — done (`0001_init`)                     |
| Seed data                                                                  | B10            | BE-4       | 1 — done                                   |
| `packages/ui` and sign-in screens in all four apps                         | B13 sprint 1   | FE-1, FE-2 | 1                                          |
| Rate limits: sign-in 10/min/IP, kiosk PIN 5/min/device, webhook 60/min     | NFR-SEC-07     | BE-1       | 1 — `common/http/rate-limit.ts`            |
| Wallet service: lock → ledger entry → balance, one transaction             | NFR-REL-01, B5 | BE-2       | 2                                          |
| Idempotent POS charge                                                      | NFR-REL-02     | BE-2       | 2                                          |
| Idempotent webhook on SePay id                                             | NFR-REL-03     | BE-3       | 3                                          |
| SSE for top-up status within 5 s                                           | NFR-PERF-02    | BE-3, BE-4 | 3                                          |
| Background jobs: expire top-ups / requests, nightly consistency check      | B9             | BE-4       | 3                                          |
| Concurrency test: 20 parallel charges                                      | B11            | BE-2       | 4                                          |
| End-to-end tests UC-04, UC-08, UC-09, UC-11+UC-06, UC-15; permission tests | B11            | all BE     | 4                                          |
| Playwright happy path per app                                              | B11            | FE-1, FE-2 | 4                                          |
| 80% line coverage on wallet, POS, top-ups                                  | NFR-MNT-02     | BE-2, BE-3 | 4                                          |
| Daily backup script                                                        | NFR-REL-04     | BE-4       | 4 — script in `infra/scripts/backup-db.sh` |
| Deployment (VPS compose or Vercel + Railway/Render)                        | B3             | BE-4       | 4                                          |
| Demo rehearsal (8-minute script)                                           | B13            | all        | 4                                          |
