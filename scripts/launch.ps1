# Starts Meal App and opens it in its own window, like a desktop app.
#
#   - Builds the app the first time, and again whenever the code changed (new git commit).
#   - Runs the server in a minimized "Meal App server" window; close that window to stop it.
#   - If the app is already running, just opens another window.
#
# Used by "Meal App.cmd" and the desktop / Start menu shortcuts (scripts/install-shortcuts.ps1).
param(
  [int]$Port = 3001,
  # For testing: start the server but don't open a window.
  [switch]$NoWindow
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$url = "http://localhost:$Port"
$Host.UI.RawUI.WindowTitle = "Meal App"

function Test-Running {
  try { return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { return $false }
}

function Fail($message) {
  Write-Host ""
  Write-Host $message -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Test-Running)) {
  # Rebuild when the code changed since the last build.
  $stamp = Join-Path $root ".next\launcher-build.txt"
  $head = (git -C $root rev-parse HEAD 2>$null)
  $built = if (Test-Path $stamp) { (Get-Content $stamp -Raw).Trim() } else { "" }
  if (-not (Test-Path (Join-Path $root ".next\BUILD_ID")) -or $built -ne $head) {
    Write-Host "Preparing Meal App. The first start after an update takes about a minute..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { Fail "The build failed. Ask Claude to look at the messages above." }
    Set-Content -Path $stamp -Value $head
  }

  if (-not (Test-Path (Join-Path $root "data\meal-app.db"))) {
    Fail "The food database is missing (data\meal-app.db). See docs\data.md to import it."
  }

  Write-Host "Starting Meal App..." -ForegroundColor Cyan
  Start-Process -FilePath "cmd.exe" -WorkingDirectory $root -WindowStyle Minimized `
    -ArgumentList "/c", "title Meal App server (close to stop) && npm start -- -p $Port"

  $deadline = (Get-Date).AddSeconds(90)
  while (-not (Test-Running)) {
    if ((Get-Date) -gt $deadline) { Fail "Meal App didn't start. Check the 'Meal App server' window in the taskbar." }
    Start-Sleep -Milliseconds 500
  }
}

if ($NoWindow) { Write-Host "Meal App is running at $url"; exit 0 }

# Open as an app window (no address bar) in Edge; fall back to the default browser.
try {
  Start-Process -FilePath "msedge" -ArgumentList "--app=$url"
} catch {
  Start-Process $url
}
