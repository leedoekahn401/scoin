# SePay setup (SRS B6)

Development and the course demo use **SePay Test mode** with simulated transfers (C-02).

1. In SePay Test mode, link a test bank account.
2. Company → General Settings → **Payment Code Structure**: prefix `SC`, followed by 8 digits.
3. Create a webhook:
   - URL: `https://<api-host>/api/v1/webhooks/sepay`
   - Events: money in
   - Authentication: **API Key** — put the key in `SEPAY_WEBHOOK_KEY` in `apps/api/.env`
   - Leave "only send when a payment code is present" **off**, so transfers without a code still
     arrive and become unmatched payments (UC-15).
4. In `apps/api/.env` set `SCHOOL_BANK_NAME` (SePay bank code, e.g. `MBBank`),
   `SCHOOL_BANK_ACCOUNT` and `SCHOOL_BANK_HOLDER`. The QR image is
   `https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={amountVnd}&des={paymentCode}`.

## Local development

SePay cannot reach `localhost`, so run a tunnel and point the webhook at it:

```bash
./infra/scripts/tunnel.sh
```

Use the printed `https://…` URL + `/api/v1/webhooks/sepay` as the webhook URL.

## Simulating without SePay

```bash
curl -X POST http://localhost:4000/api/v1/webhooks/sepay \
  -H "Authorization: Apikey $SEPAY_WEBHOOK_KEY" -H "Content-Type: application/json" \
  -d '{"id":900001,"gateway":"MBBank","transactionDate":"2026-11-19 10:00:00","accountNumber":"0000000000","code":"SC12345678","content":"SC12345678 nap tien","transferType":"in","transferAmount":100000,"accumulated":100000,"subAccount":null,"referenceCode":"FT0001","description":""}'
```

Sending the same `id` twice must change nothing the second time (NFR-REL-03).
