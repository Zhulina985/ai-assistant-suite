@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
cd /d "%ROOT%frontend"

where python >nul 2>&1
if errorlevel 1 (
    echo [X] 未检测到 Python，请安装 Python 3 并勾选 "Add to PATH"
    echo     下载: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo 英语口语陪练 - 静态前端
echo 技术栈: HTML + CSS + JavaScript（无需 npm）
echo.
echo 前端地址: http://127.0.0.1:5173/login.html
echo 请确保后端已启动: start-backend-java.bat
echo 按 Ctrl+C 停止
echo.

python -m http.server 5173
