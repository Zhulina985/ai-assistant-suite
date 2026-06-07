@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%backend-java"

if not exist ".env" (
    echo [!] 正在创建 .env ...
    copy /Y .env.example .env >nul
    echo 请先编辑 backend-java\.env 填写 MYSQL_PASSWORD，然后重新运行 init-db.bat
    pause
    exit /b 1
)

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

set "MYSQL_EXE=mysql"
where mysql >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    ) else if exist "D:\MySQL\mysql-8.0.45-winx64\bin\mysql.exe" (
        set "MYSQL_EXE=D:\MySQL\mysql-8.0.45-winx64\bin\mysql.exe"
    ) else (
        echo [X] 找不到 mysql 命令。请手动执行 docs\init-mysql.sql
        echo     或在 MySQL Workbench 中运行:
        echo     CREATE DATABASE speaking_coach DEFAULT CHARACTER SET utf8mb4;
        pause
        exit /b 1
    )
)

echo Creating database %MYSQL_DATABASE% ...
"%MYSQL_EXE%" -h%MYSQL_HOST% -P%MYSQL_PORT% -u%MYSQL_USER% -p%MYSQL_PASSWORD% < "%ROOT%docs\init-mysql.sql"
if errorlevel 1 (
    echo [X] 建库失败。请确认 MySQL 服务已启动，用户名密码正确。
    pause
    exit /b 1
)

echo [OK] 数据库 %MYSQL_DATABASE% 已就绪（表由 Spring Boot 自动创建）
pause
