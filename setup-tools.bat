@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
echo ========================================
echo  英语口语陪练 - 环境检测
echo  项目目录: %ROOT%
echo ========================================
echo.

set "OK=1"

REM ---- Java ----
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
    echo [X] Java 未安装 — 需要 JDK 17+
    echo     下载: https://adoptium.net/
    set "OK=0"
) else (
    echo [OK] Java
    java -version 2>&1 | findstr /i "version"
)

REM ---- Maven Wrapper ----
cd /d "%ROOT%backend-java"
if exist "mvnw.cmd" (
    echo [OK] Maven Wrapper ^(mvnw.cmd^) — 首次构建会自动下载 Maven
) else (
    where mvn >nul 2>&1
    if errorlevel 1 (
        echo [X] 未找到 mvnw.cmd 或系统 Maven
        set "OK=0"
    ) else (
        echo [OK] 系统 Maven
        mvn -version 2>&1 | findstr /i "Apache Maven"
    )
)

REM ---- Python ----
where python >nul 2>&1
if errorlevel 1 (
    echo [X] Python 未安装 — 前端静态服务需要 Python 3
    echo     下载: https://www.python.org/downloads/
    set "OK=0"
) else (
    echo [OK] Python
    python --version
)

REM ---- MySQL 客户端（可选）----
where mysql >nul 2>&1
if errorlevel 1 (
    echo [!] MySQL 命令行未加入 PATH — 请用 Navicat / Workbench 手动建库
    echo     或运行 init-db.bat ^(若已配置 mysql.exe 路径^)
) else (
    echo [OK] MySQL 客户端
    mysql --version 2>&1 | findstr /i "mysql"
)

REM ---- .env ----
cd /d "%ROOT%backend-java"
if not exist ".env" (
    echo [*] 正在创建 backend-java\.env ...
    copy /Y .env.example .env >nul
    echo [!] 请编辑 .env 填写 MYSQL_PASSWORD
    set "OK=0"
) else (
    echo [OK] backend-java\.env 已存在
)

echo.
echo ========================================
if "%OK%"=="0" (
    echo  请先完成上述 [X] / [!] 项，再运行:
) else (
    echo  环境就绪，启动方式:
)
echo  1. init-db.bat            ^(首次：创建 MySQL 数据库^)
echo  2. start-backend-java.bat ^(后端^)
echo  3. start-frontend.bat     ^(前端^)
echo  4. 浏览器打开 http://127.0.0.1:5173/login.html
echo ========================================
pause
