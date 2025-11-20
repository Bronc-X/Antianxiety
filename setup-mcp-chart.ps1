# MCP Chart Server 自动配置脚本
# 此脚本会自动创建或更新 Cursor 的 MCP 配置文件

Write-Host "开始配置 MCP Chart Server..." -ForegroundColor Green

# 可能的配置文件位置
$configPaths = @(
    "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json",
    "$env:USERPROFILE\.cursor\mcp.json",
    "$env:APPDATA\Cursor\mcp.json"
)

$configPath = $null
$configDir = $null

# 查找现有配置文件
foreach ($path in $configPaths) {
    $dir = Split-Path -Parent $path
    if (Test-Path $path) {
        $configPath = $path
        $configDir = $dir
        Write-Host "找到现有配置文件: $configPath" -ForegroundColor Green
        break
    } elseif (Test-Path $dir) {
        $configPath = $path
        $configDir = $dir
        Write-Host "找到配置目录，将创建新文件: $configPath" -ForegroundColor Yellow
        break
    }
}

# 如果都没找到，使用第一个路径并创建目录
if (-not $configPath) {
    $configPath = $configPaths[0]
    $configDir = Split-Path -Parent $configPath
    Write-Host "将创建新配置文件: $configPath" -ForegroundColor Yellow
    
    # 创建目录
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        Write-Host "已创建配置目录" -ForegroundColor Green
    }
}

# 读取现有配置或创建新配置
$config = @{}
if (Test-Path $configPath) {
    try {
        $content = Get-Content $configPath -Raw -ErrorAction Stop
        $config = $content | ConvertFrom-Json -AsHashtable
        Write-Host "已读取现有配置" -ForegroundColor Green
    } catch {
        Write-Host "配置文件格式错误，将创建新配置" -ForegroundColor Yellow
        $config = @{}
    }
}

# 确保 mcpServers 对象存在
if (-not $config.ContainsKey("mcpServers")) {
    $config["mcpServers"] = @{}
}

# 添加或更新 mcp-server-chart 配置
$config["mcpServers"]["mcp-server-chart"] = @{
    command = "cmd"
    args = @("/c", "npx", "-y", "@antv/mcp-server-chart")
}

# 保存配置
try {
    $json = $config | ConvertTo-Json -Depth 10
    $json | Set-Content $configPath -Encoding UTF8
    Write-Host "配置已保存到: $configPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "配置内容:" -ForegroundColor Cyan
    Write-Host $json
    Write-Host ""
    Write-Host "配置完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步:" -ForegroundColor Yellow
    Write-Host "1. 完全关闭 Cursor"
    Write-Host "2. 重新打开 Cursor"
    Write-Host "3. MCP 服务器会自动连接"
    Write-Host ""
    Write-Host "提示: 首次使用时会自动下载 @antv/mcp-server-chart 包" -ForegroundColor Cyan
} catch {
    Write-Host "保存配置失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动创建配置文件: $configPath" -ForegroundColor Yellow
    Write-Host "内容如下:" -ForegroundColor Yellow
    $manualConfig = "{`"mcpServers`":{`"mcp-server-chart`":{`"command`":`"cmd`",`"args`":[`"/c`",`"npx`",`"-y`",`"@antv/mcp-server-chart`"]}}}"
    Write-Host $manualConfig
    exit 1
}
