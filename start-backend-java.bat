@echo off
chcp 65001 >nul
cd /d "D:\ai-assistant-suite\backend-java"

if exist "C:\Program Files\Java\jdk-24" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-24"
) else if exist "C:\Program Files\Java\jdk-21" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
) else if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

set "MAVEN_HOME=D:\tools\apache-maven-3.9.6"
set "MVN=%MAVEN_HOME%\bin\mvn.cmd"
if not exist "%MVN%" set "MVN=mvn"

echo Loading env from D:\ai-assistant-suite\backend\.env
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("D:\ai-assistant-suite\backend\.env") do (
    if not "%%a"=="" set %%a=%%b
)

echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo Killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    ping 127.0.0.1 -n 3 >nul
)

if not exist "%MVN%" (
    echo Maven not found. Run setup-tools.bat first.
    pause
    exit /b 1
)

echo Building Java backend...
call "%MVN%" -q -DskipTests package
if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)

echo.
echo Java Backend: http://127.0.0.1:8000/api/health
echo Press Ctrl+C to stop
echo.
java -jar target\ai-assistant-suite-1.0.0.jar
