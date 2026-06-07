@echo off
chcp 65001 >nul
cd /d "D:\ai-assistant-suite\frontend"

if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
)

echo.
echo Frontend: http://127.0.0.1:5173
echo Press Ctrl+C to stop
echo.
call npm run dev
