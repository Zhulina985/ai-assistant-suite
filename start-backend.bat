@echo off
cd /d "%~dp0backend"
set PORT=8000

echo Checking port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo Port in use by PID %%a, killing...
    taskkill /F /PID %%a >nul 2>&1
    ping 127.0.0.1 -n 3 >nul
)

if not exist "venv\Scripts\python.exe" (
    echo Creating venv...
    python -m venv venv
    call venv\Scripts\pip.exe install -r requirements.txt
)

if not exist ".env" copy .env.example .env

echo.
echo Backend: http://127.0.0.1:%PORT%/docs
echo Press Ctrl+C to stop
echo.
call venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port %PORT%
