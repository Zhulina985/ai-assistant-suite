@echo off
chcp 65001 >nul
cd /d "D:\ai-assistant-suite\frontend"

echo.
echo 英语口语陪练 - 静态前端
echo 技术栈: HTML + CSS + JavaScript（无需 npm）
echo.
echo 前端地址: http://127.0.0.1:5173
echo 请确保后端已启动: start-backend-java.bat
echo 按 Ctrl+C 停止
echo.

python -m http.server 5173
