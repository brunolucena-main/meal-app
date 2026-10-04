# Stops the Meal App server started by launch.ps1.
param([int]$Port = 3001)

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $listeners) {
  Write-Host "Meal App isn't running."
} else {
  foreach ($l in $listeners) { Stop-Process -Id $l.OwningProcess -Force -ErrorAction SilentlyContinue }
  Write-Host "Meal App stopped."
}
Start-Sleep -Seconds 2
