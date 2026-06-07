# 启动后端 (PowerShell)
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ProjectRoot "backend")

$Port = 8000

# 检查端口是否被占用
$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pidOnPort = $conn.OwningProcess | Select-Object -First 1
    Write-Host "端口 $Port 已被进程 $pidOnPort 占用，正在释放..."
    Stop-Process -Id $pidOnPort -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "正在创建虚拟环境并安装依赖..."
    python -m venv venv
    .\venv\Scripts\pip.exe install -r requirements.txt
}

if (-not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "已创建 .env，请按需填入 OPENAI_API_KEY"
}

Write-Host "后端启动中: http://127.0.0.1:$Port/docs"
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port $Port
