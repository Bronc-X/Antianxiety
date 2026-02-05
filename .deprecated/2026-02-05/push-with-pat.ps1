# GitHub 推送脚本 (使用 Personal Access Token)
# 
# 使用说明:
# 1. 在 GitHub 创建 Personal Access Token (Settings > Developer settings > Personal access tokens)
# 2. 运行此脚本并按提示输入信息

Write-Host "=== GitHub 推送工具 (PAT 认证) ===" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: 未找到 Git" -ForegroundColor Red
    Write-Host "请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "或使用桌面上的 PortableGit" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 检查 Git 用户配置
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName -or -not $userEmail) {
    Write-Host "需要配置 Git 用户信息" -ForegroundColor Yellow
    Write-Host ""
    
    $userName = Read-Host "请输入你的 GitHub 用户名"
    $userEmail = Read-Host "请输入你的 GitHub 邮箱"
    
    git config --global user.name "$userName"
    git config --global user.email "$userEmail"
    
    Write-Host "✓ Git 用户信息已配置" -ForegroundColor Green
} else {
    Write-Host "✓ Git 用户信息: $userName <$userEmail>" -ForegroundColor Green
}

Write-Host ""

# 获取 GitHub 信息
Write-Host "请输入 GitHub 仓库信息:" -ForegroundColor Yellow
$githubUsername = Read-Host "GitHub 用户名"
$repoName = Read-Host "仓库名称 (默认: antianxiety)"

if (-not $repoName) {
    $repoName = "antianxiety"
}

Write-Host ""
Write-Host "请输入你的 GitHub Personal Access Token:" -ForegroundColor Yellow
Write-Host "(Token 需要 'repo' 权限)" -ForegroundColor Gray
$pat = Read-Host "PAT" -AsSecureString
$patPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
)

Write-Host ""

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-Host "发现未提交的更改，正在添加..." -ForegroundColor Yellow
    git add .
    
    $commitMsg = Read-Host "请输入提交信息 (默认: Update project)"
    if (-not $commitMsg) {
        $commitMsg = "Update project"
    }
    
    git commit -m "$commitMsg"
    Write-Host "✓ 更改已提交" -ForegroundColor Green
} else {
    Write-Host "没有未提交的更改" -ForegroundColor Gray
}

Write-Host ""

# 设置主分支
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "正在切换到 main 分支..." -ForegroundColor Yellow
    git branch -M main
}

# 配置远程仓库 (使用 PAT)
$remoteUrl = "https://${githubUsername}:${patPlain}@github.com/${githubUsername}/${repoName}.git"

$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "更新远程仓库 URL..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
} else {
    Write-Host "添加远程仓库..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

Write-Host "✓ 远程仓库已配置" -ForegroundColor Green
Write-Host ""

# 推送到 GitHub
Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
Write-Host "仓库: https://github.com/${githubUsername}/${repoName}" -ForegroundColor Cyan
Write-Host ""

$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 成功推送到 GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "仓库地址: https://github.com/${githubUsername}/${repoName}" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息:" -ForegroundColor Yellow
    Write-Host $pushResult
    Write-Host ""
    Write-Host "常见问题:" -ForegroundColor Yellow
    Write-Host "1. 确保 PAT 有 'repo' 权限" -ForegroundColor Gray
    Write-Host "2. 确保仓库已在 GitHub 上创建" -ForegroundColor Gray
    Write-Host "3. 检查网络连接" -ForegroundColor Gray
}

# 清理敏感信息 (移除 URL 中的 PAT)
Write-Host ""
Write-Host "正在清理敏感信息..." -ForegroundColor Yellow
$cleanUrl = "https://github.com/${githubUsername}/${repoName}.git"
git remote set-url origin $cleanUrl
Write-Host "✓ 已移除 URL 中的 PAT" -ForegroundColor Green

Write-Host ""
Write-Host "提示: 下次推送时可以使用 Git Credential Manager 或再次运行此脚本" -ForegroundColor Gray
