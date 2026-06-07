@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%backend-java"

REM ---- Java 17+ ----
if exist "C:\Program Files\Java\jdk-24" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-24"
) else if exist "C:\Program Files\Java\jdk-21" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
) else if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

java -version >nul 2>&1
if errorlevel 1 (
    echo [X] 未检测到 Java，请安装 JDK 17 或更高版本
    echo     下载: https://adoptium.net/
    pause
    exit /b 1
)

REM ---- Maven：优先用项目自带的 mvnw ----
if exist "mvnw.cmd" (
    set "MVN=mvnw.cmd"
) else (
    where mvn >nul 2>&1
    if errorlevel 1 (
        echo [X] 未找到 Maven。请安装 Maven 或运行 setup-tools.bat
        pause
        exit /b 1
    )
    set "MVN=mvn"
)

if not exist ".env" (
    echo [!] 未找到 .env，正在从 .env.example 复制...
    copy /Y .env.example .env >nul
    echo.
    echo 请编辑 backend-java\.env，填写 MYSQL_PASSWORD 后重新运行本脚本。
    echo API Key 可选，不填则使用演示模式。
    pause
    exit /b 1
)

echo Loading env from backend-java\.env
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" set %%a=%%b
)

if "%MYSQL_PASSWORD%"=="" (
    echo [X] MYSQL_PASSWORD 为空，请编辑 backend-java\.env
    pause
    exit /b 1
)

if "%MYSQL_PASSWORD%"=="your-mysql-password-here" (
    echo [X] 请将 backend-java\.env 中的 MYSQL_PASSWORD 改为你的 MySQL 密码
    pause
    exit /b 1
)

echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo Killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    ping 127.0.0.1 -n 3 >nul
)

echo Building Java backend...
call "%MVN%" -q -DskipTests package
if errorlevel 1 (
    echo [X] 构建失败。请确认已安装 JDK 17+，且网络可下载 Maven 依赖。
    pause
    exit /b 1
)

echo.
echo Java Backend: http://127.0.0.1:8000/api/health
echo MySQL DB: %MYSQL_DATABASE%
echo Press Ctrl+C to stop
echo.
java -jar target\ai-assistant-suite-1.0.0.jar
