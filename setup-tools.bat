@echo off
chcp 65001 >nul
echo ========================================
echo  AI Assistant Suite - 环境配置向导
echo  项目位置: D:\ai-assistant-suite
echo ========================================
echo.

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
    echo [X] 未检测到 Java，请安装 JDK 17+
    echo     下载: https://adoptium.net/
    pause
    exit /b 1
) else (
    echo [OK] Java 已安装
    java -version 2>&1 | findstr version
)

REM ---- Maven ----
set "MAVEN_HOME=D:\tools\apache-maven-3.9.6"
set "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"

if exist "%MVN_CMD%" (
    echo [OK] Maven 已安装: %MAVEN_HOME%
    goto :maven_done
)

echo [*] 正在下载 Maven 到 D:\tools ...
if not exist "D:\tools" mkdir "D:\tools"

curl -L -C - -o "D:\tools\maven.zip" "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip" --connect-timeout 30 --max-time 600
if not exist "D:\tools\maven.zip" (
    echo [X] Maven 下载失败，请手动下载:
    echo     https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip
    echo     解压到 D:\tools\apache-maven-3.9.6
    pause
    exit /b 1
)

powershell -Command "Expand-Archive -Path 'D:\tools\maven.zip' -DestinationPath 'D:\tools' -Force"
del "D:\tools\maven.zip"
echo [OK] Maven 安装完成

:maven_done
"%MVN_CMD%" -version
echo.

REM ---- Node.js ----
node -v >nul 2>&1
if errorlevel 1 (
    echo [!] 未检测到 Node.js，前端需要 Node 18+
) else (
    echo [OK] Node.js 已安装
    node -v
)

REM ---- API Key ----
if exist "D:\ai-assistant-suite\backend\.env" (
    echo [OK] API Key 配置: backend\.env
) else (
    echo [!] 请复制 backend\.env.example 为 backend\.env 并填入 Key
)

echo.
echo ========================================
echo  配置完成！启动方式:
echo  1. start-backend-java.bat  (后端)
echo  2. start-frontend.bat      (前端)
echo  3. 浏览器打开 http://127.0.0.1:5173
echo ========================================
pause
