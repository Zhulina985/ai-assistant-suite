# 启动前端 (PowerShell)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ProjectRoot "frontend")

if (-not (Test-Path ".\node_modules")) {
    Write-Host "正在安装前端依赖..."
    npm install
}

Write-Host "前端启动中: http://localhost:5173"
npm run dev
