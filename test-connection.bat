@echo off
echo === Connection Test ===

powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 3; Write-Host '[OK] Backend: http://127.0.0.1:8000' -ForegroundColor Green; $r | ConvertTo-Json } catch { Write-Host '[FAIL] Backend not running. Run start-backend.bat first.' -ForegroundColor Red }"

echo.

powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:5173/api/health' -TimeoutSec 3; Write-Host '[OK] Frontend: http://127.0.0.1:5173' -ForegroundColor Green } catch { Write-Host '[FAIL] Frontend not running. Run start-frontend.bat first.' -ForegroundColor Red }"

echo === Done ===
pause
