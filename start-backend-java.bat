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

if not exist ".env" (
    echo [!] 请先复制 .env.example 为 .env 并填写 MySQL 密码和 API Key
    copy .env.example .env
    pause
    exit /b 1
)

echo Loading env from backend-java\.env
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
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
echo MySQL DB: %MYSQL_DATABASE%
echo Press Ctrl+C to stop
echo.
java -jar target\ai-assistant-suite-1.0.0.jar
