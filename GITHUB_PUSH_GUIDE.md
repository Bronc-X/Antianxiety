# GitHub 推送指南 (使用 PAT)

## 前提条件

### 1. 安装 Git

如果还没有安装 Git，可以使用桌面上的 `PortableGit-64bit.7z.exe` 或从官网下载：
- 官网: https://git-scm.com/download/win

### 2. 创建 GitHub Personal Access Token (PAT)

1. 登录 GitHub
2. 进入 Settings (右上角头像 > Settings)
3. 左侧菜单选择 "Developer settings"
4. 选择 "Personal access tokens" > "Tokens (classic)"
5. 点击 "Generate new token" > "Generate new token (classic)"
6. 设置:
   - Note: `Antianxiety Project`
   - Expiration: 选择过期时间 (建议 90 days 或 No expiration)
   - 勾选权限: **repo** (完整的仓库访问权限)
7. 点击 "Generate token"
8. **重要**: 复制生成的 token (只显示一次!)

### 3. 在 GitHub 创建仓库

1. 登录 GitHub
2. 点击右上角 "+" > "New repository"
3. 设置:
   - Repository name: `antianxiety` (或其他名称)
   - Description: `Health habit tracking app`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

## 使用推送脚本

### 方法 1: 使用自动化脚本 (推荐)

在 PowerShell 中运行:

```powershell
cd Antianxiety-main
.\push-with-pat.ps1
```

按提示输入:
1. GitHub 用户名
2. 仓库名称 (默认: antianxiety)
3. Personal Access Token
4. 提交信息 (如果有未提交的更改)

### 方法 2: 手动推送

```powershell
# 1. 配置 Git 用户信息
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的邮箱@example.com"

# 2. 初始化仓库 (如果还没有)
git init

# 3. 添加所有文件
git add .

# 4. 创建提交
git commit -m "Initial commit: Antianxiety MVP"

# 5. 设置主分支
git branch -M main

# 6. 添加远程仓库 (使用 PAT)
git remote add origin https://你的用户名:你的PAT@github.com/你的用户名/antianxiety.git

# 7. 推送到 GitHub
git push -u origin main

# 8. 清理 URL 中的 PAT (安全考虑)
git remote set-url origin https://github.com/你的用户名/antianxiety.git
```

## 后续推送

第一次推送成功后，后续推送可以使用:

```powershell
# 添加更改
git add .

# 提交
git commit -m "你的提交信息"

# 推送 (会提示输入 PAT)
git push
```

## 常见问题

### Q: 推送时提示 "Authentication failed"
A: 检查 PAT 是否正确，是否有 `repo` 权限

### Q: 推送时提示 "Repository not found"
A: 确保仓库已在 GitHub 上创建，且名称正确

### Q: 如何避免每次都输入 PAT?
A: 可以使用 Git Credential Manager:
```powershell
git config --global credential.helper manager-core
```

### Q: 如何查看当前远程仓库?
A:
```powershell
git remote -v
```

### Q: 如何更改远程仓库 URL?
A:
```powershell
git remote set-url origin https://github.com/用户名/仓库名.git
```

## 安全提示

1. **不要**将 PAT 提交到代码仓库
2. **不要**在公共场合分享 PAT
3. 定期更新 PAT
4. 推送后记得从远程 URL 中移除 PAT
5. 如果 PAT 泄露，立即在 GitHub 上撤销并重新生成

## 参考资源

- [GitHub PAT 文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git 基础教程](https://git-scm.com/book/zh/v2)
