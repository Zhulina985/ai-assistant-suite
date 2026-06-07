# 测试前后端连接
Write-Host "=== 连接测试 ===" -ForegroundColor Cyan

# 测试后端
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -TimeoutSec 5
    Write-Host "[OK] 后端 http://127.0.0.1:8000/api/health -> status=$($health.status)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] 后端未启动，请先运行 .\start-backend.ps1" -ForegroundColor Red
    Write-Host "       错误: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 测试前端代理
try {
    $proxy = Invoke-RestMethod -Uri "http://127.0.0.1:5173/api/health" -TimeoutSec 5
    Write-Host "[OK] 前端代理 http://127.0.0.1:5173/api/health -> status=$($proxy.status)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] 前端未启动，请先运行 .\start-frontend.ps1" -ForegroundColor Red
    Write-Host "       错误: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
