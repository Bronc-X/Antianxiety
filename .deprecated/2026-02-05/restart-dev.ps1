# restart-dev.ps1 - 一键重启 Next.js 开发服务器
# 用法: .\restart-dev.ps1

Write-Host "🔄 正在清理开发环境..." -ForegroundColor Cyan

# 1. 终止占用 3000 和 3001 端口的进程
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  ⏹ 终止端口 $port 上的进程: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 2. 删除 .next/dev/lock 文件
$lockFile = ".next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "  🗑 已删除锁文件: $lockFile" -ForegroundColor Yellow
}

# 3. 短暂等待确保进程完全终止
Start-Sleep -Milliseconds 500

Write-Host "✅ 清理完成，正在启动开发服务器..." -ForegroundColor Green
Write-Host ""

# 4. 启动开发服务器
npm run dev
