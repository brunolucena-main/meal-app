# Creates "Meal App" and "Stop Meal App" shortcuts on the desktop and in the Start menu.
#   powershell -ExecutionPolicy Bypass -File scripts\install-shortcuts.ps1
$root = Split-Path -Parent $PSScriptRoot
$icon = Join-Path $root "src\app\favicon.ico"
$shell = New-Object -ComObject WScript.Shell

function New-Shortcut($folder, $name, $script, $description) {
  $link = $shell.CreateShortcut((Join-Path $folder "$name.lnk"))
  $link.TargetPath = "powershell.exe"
  $link.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $root "scripts\$script")`""
  $link.WorkingDirectory = $root
  $link.IconLocation = $icon
  $link.Description = $description
  $link.WindowStyle = 1  # normal: shows progress on the first start, closes once the app opens
  $link.Save()
  Write-Host "Created $(Join-Path $folder "$name.lnk")"
}

foreach ($folder in @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("Programs"))) {
  New-Shortcut $folder "Meal App" "launch.ps1" "Open Meal App"
  New-Shortcut $folder "Stop Meal App" "stop.ps1" "Stop the Meal App server"
}
