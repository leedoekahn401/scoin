# Demo script

All demo accounts use the password from `apps/api/prisma/seed/users.seed.ts`; student PINs are in
`students.seed.ts`.

1. **Parent top-up (UC-04, UC-23)** — sign in to the parent app, pick a child, top up, show the QR,
   simulate the SePay webhook, watch the screen switch to success.
2. **POS charge (UC-08)** — sign in to POS as a cashier, scan a card, add items, charge.
3. **Daily limit** — charge again past the limit and show the decline reason.
4. **Kiosk request (UC-11, UC-06)** — scan a card at the kiosk, enter the PIN, ask for credits;
   approve it in the parent app.
5. **Unmatched payment (UC-15)** — send a webhook with no code; assign it in admin.
6. **Reports** — show the dashboard and the reconciliation report.
