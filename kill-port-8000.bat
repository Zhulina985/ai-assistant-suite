@echo off
echo Killing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo Killing PID %%a
    taskkill /F /PID %%a
)
echo Done. Port 8000 should be free now.
pause
