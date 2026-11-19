# SePay setup

1. Create a SePay account and link the school's bank account.
2. In SePay, add a webhook:
   - URL: `https://<api-host>/webhooks/sepay`
   - Auth: API Key — copy the key into `SEPAY_API_KEY` in `apps/api/.env`.
   - Events: incoming transfers only.
3. Set `SEPAY_BANK_ACCOUNT` and `SEPAY_BANK_CODE` to match the linked account
   (used to build the `qr.sepay.vn` QR image).

## Local development

SePay cannot reach `localhost`, so run a tunnel and point the webhook at it:

```bash
./infra/scripts/tunnel.sh
```

Use the printed `https://…` URL + `/webhooks/sepay` as the webhook URL in SePay.
