# GitHub 推送脚本
# 请先配置 Git 用户信息（如果尚未配置）：
# git config --global user.name "你的名字"
# git config --global user.email "你的邮箱@example.com"

Write-Host "正在检查 Git 配置..." -ForegroundColor Yellow

# 检查 Git 用户信息
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName -or -not $userEmail) {
    Write-Host "错误: Git 用户信息未配置" -ForegroundColor Red
    Write-Host "请先运行以下命令配置 Git 用户信息：" -ForegroundColor Yellow
    Write-Host "  git config --global user.name `"你的名字`"" -ForegroundColor Cyan
    Write-Host "  git config --global user.email `"你的邮箱@example.com`"" -ForegroundColor Cyan
    exit 1
}

Write-Host "Git 用户信息已配置: $userName <$userEmail>" -ForegroundColor Green

# 创建提交
Write-Host "`n正在创建提交..." -ForegroundColor Yellow
git commit -m "Initial commit: Metabasis MVP - Health habit tracking app with Supabase"

if ($LASTEXITCODE -ne 0) {
    Write-Host "提交失败，请检查错误信息" -ForegroundColor Red
    exit 1
}

Write-Host "提交成功！" -ForegroundColor Green

# 设置主分支
Write-Host "`n正在设置主分支..." -ForegroundColor Yellow
git branch -M main

# 添加远程仓库
Write-Host "`n请提供你的 GitHub 用户名：" -ForegroundColor Yellow
$githubUsername = Read-Host

if (-not $githubUsername) {
    Write-Host "错误: 未提供 GitHub 用户名" -ForegroundColor Red
    exit 1
}

$repoName = "antianxiety"
Write-Host "`n正在添加远程仓库..." -ForegroundColor Yellow
git remote add origin "https://github.com/$githubUsername/$repoName.git"

# 检查是否已存在远程仓库
if ($LASTEXITCODE -ne 0) {
    Write-Host "远程仓库可能已存在，尝试更新..." -ForegroundColor Yellow
    git remote set-url origin "https://github.com/$githubUsername/$repoName.git"
}

Write-Host "远程仓库已添加: https://github.com/$githubUsername/$repoName.git" -ForegroundColor Green

# 推送到 GitHub
Write-Host "`n正在推送到 GitHub..." -ForegroundColor Yellow
Write-Host "如果提示输入凭据，请使用 GitHub Personal Access Token 作为密码" -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 代码已成功推送到 GitHub！" -ForegroundColor Green
    Write-Host "仓库地址: https://github.com/$githubUsername/$repoName" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 推送失败，请检查错误信息" -ForegroundColor Red
    Write-Host "如果遇到认证问题，请使用 GitHub Personal Access Token" -ForegroundColor Yellow
}

