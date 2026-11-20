# Restart `next start` for the given apps after a build. Kills whatever owns the port.
#   powershell -File scripts/serve.ps1 kiosk pos
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Apps)
$ports = @{ pos = 3001; parent = 3002; kiosk = 3003; admin = 3004 }
$root = Split-Path -Parent $PSScriptRoot
foreach ($a in $Apps) {
  $port = $ports[$a]
  Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep 1
foreach ($a in $Apps) {
  $port = $ports[$a]
  Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd '$root\apps\$a'; npx next start -p $port *> '$root\.workers\$a-serve.log'" -WindowStyle Hidden
}
foreach ($a in $Apps) {
  $url = "http://localhost:$($ports[$a])/login"
  for ($i = 0; $i -lt 40; $i++) {
    try { $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5; "$a :$($ports[$a]) up ($($r.StatusCode))"; break } catch { Start-Sleep 1 }
  }
}
