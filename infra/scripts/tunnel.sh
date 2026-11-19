#!/usr/bin/env bash
# Exposes the local API so SePay can reach POST /webhooks/sepay in dev.
# Uses cloudflared if installed, otherwise ngrok. See docs/sepay-setup.md.
set -euo pipefail
PORT="${PORT:-4000}"

if command -v cloudflared >/dev/null 2>&1; then
  exec cloudflared tunnel --url "http://localhost:$PORT"
elif command -v ngrok >/dev/null 2>&1; then
  exec ngrok http "$PORT"
else
  echo "Install cloudflared or ngrok first." >&2
  exit 1
fi
