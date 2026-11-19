# Demo script (about 8 minutes, SRS B13)

Accounts, card codes and PINs: `apps/api/prisma/seed/README.md`. Run `pnpm db:reset` before.
Khang (7A1) starts with a daily limit of 40 and a low-balance alert at 20.

1. **Admin** — sign in as `admin@schoolcoin.local`; show the students and print Khang's card.
2. **Parent** — sign in as `parent.an@schoolcoin.local`; set Khang's daily limit to 40 credits and
   a low-balance alert at 20.
3. **Parent** — top up 100 credits → open the same QR in SePay Test mode → _Simulate transfer_ →
   the screen flips to Success; the receipt arrives in Mailpit (http://localhost:8025).
4. **POS** — sign in as `cashier1`; scan Khang's card, buy Cơm gà (30) + Nước suối (5) → paid;
   try another Cơm gà (30) → declined, "Daily limit reached".
5. **Kiosk** — scan Khang's card + PIN → balance and purchases → ask for 50 credits.
6. **Parent** — notification → approve → pay → the kiosk shows the new balance.
7. **Accountant** — sign in as `accountant@schoolcoin.local`; simulate a transfer with no code →
   it appears under unmatched payments → assign it to a student.
8. **Admin** — reports and the audit log showing every action above.
