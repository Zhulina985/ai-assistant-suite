@echo off
chcp 65001 >nul
echo === 连接测试 ===
echo.

powershell -Command "try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 5; Write-Host '[OK] 后端: http://127.0.0.1:8000/api/health' -ForegroundColor Green; $r | ConvertTo-Json -Compress } catch { Write-Host '[FAIL] 后端未启动，请先运行 start-backend-java.bat' -ForegroundColor Red }"

echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/login.html' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '[OK] 前端: http://127.0.0.1:5173/login.html' -ForegroundColor Green } } catch { Write-Host '[FAIL] 前端未启动，请先运行 start-frontend.bat' -ForegroundColor Red }"

echo.
echo === 完成 ===
pause
