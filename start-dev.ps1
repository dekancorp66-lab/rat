$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$designStudio = Join-Path $root "design-studio"

Write-Host "Starting JengaAI backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backend'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
) -PassThru

Write-Host "Starting Design feature (Wadi) on http://localhost:8082 ..." -ForegroundColor Cyan
$designProcess = Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$designStudio'; npm run dev -- --port 8082"
) -PassThru

Write-Host "Starting JengaAI frontend on http://localhost:8080 ..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontend'; npm run dev"
) -PassThru

Write-Host "JengaAI is running." -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080"
Write-Host "Backend:  http://localhost:8000/docs"
Write-Host "Design:   http://localhost:8082"
Write-Host "Press Ctrl+C in this window to stop all services."

try {
  while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited -and -not $designProcess.HasExited) {
    Start-Sleep -Seconds 2
  }
}
finally {
  if (-not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id -Force }
  if (-not $frontendProcess.HasExited) { Stop-Process -Id $frontendProcess.Id -Force }
  if (-not $designProcess.HasExited) { Stop-Process -Id $designProcess.Id -Force }
}
