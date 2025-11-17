# 使用 GitHub Actions 自动部署到阿里云

## 🎯 为什么使用 GitHub Actions？

- ✅ **避免本地网络问题**：GitHub Actions 在云端运行，网络更稳定
- ✅ **自动化部署**：代码推送到 GitHub 后自动构建和推送镜像
- ✅ **无需本地 Docker**：不需要在本地安装和运行 Docker
- ✅ **构建缓存**：使用缓存加速后续构建

## 📋 前置条件

1. ✅ 代码已推送到 GitHub 仓库
2. ✅ 已创建 ACR 镜像仓库
3. ✅ 已获取 ACR 登录凭证

## 🚀 配置步骤

### 步骤 1: 在 GitHub 仓库中配置 Secrets

1. **进入 GitHub 仓库**
   - 访问你的仓库：`https://github.com/Bronc-X/project-Nomoreanxious`

2. **添加 Secrets**
   - 点击 **Settings**（设置）
   - 点击左侧菜单 **Secrets and variables** → **Actions**
   - 点击 **New repository secret**

3. **添加以下 Secrets**：

   | Secret 名称 | 值 | 说明 |
   |------------|-----|------|
   | `ALIYUN_ACR_USERNAME` | `a15181013617` | ACR 登录用户名 |
   | `ALIYUN_ACR_PASSWORD` | 你的 ACR 固定密码 | ACR 登录密码 |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | Supabase 匿名密钥 |

   **添加方法**：
   - 点击 **New repository secret**
   - 输入 Name（Secret 名称）
   - 输入 Value（Secret 值）
   - 点击 **Add secret**
   - 重复添加所有 4 个 Secrets

### 步骤 2: 创建工作流文件

我已经创建了工作流文件：`.github/workflows/deploy-aliyun.yml`

**文件内容已配置好**：
- 使用个人版 ACR 地址
- 自动构建 Docker 镜像
- 推送到 ACR
- 使用构建缓存加速

### 步骤 3: 提交并推送代码

```powershell
# 添加工作流文件
git add .github/workflows/deploy-aliyun.yml

# 提交
git commit -m "Add GitHub Actions workflow for Aliyun deployment"

# 推送到 GitHub
git push origin main
```

### 步骤 4: 查看构建结果

1. **在 GitHub 仓库页面**
   - 点击 **Actions** 标签
   - 应该能看到 "Build and Push to Aliyun ACR" 工作流
   - 点击进入查看构建进度

2. **等待构建完成**
   - 首次构建可能需要 5-10 分钟
   - 后续构建会使用缓存，更快

3. **查看构建日志**
   - 点击工作流运行
   - 查看各个步骤的输出
   - 确认镜像已成功推送

### 步骤 5: 在 SAE 中部署

镜像推送成功后：

1. **进入 SAE 控制台**
2. **创建应用**（如果还没有）
   - 使用镜像地址：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest`
3. **配置环境变量**
4. **部署应用**

## 🔄 自动部署流程

```
代码推送到 GitHub (main 分支)
  ↓
GitHub Actions 自动触发
  ↓
构建 Docker 镜像
  ↓
推送到阿里云 ACR
  ↓
在 SAE 中手动部署（或配置自动部署）
```

## 📝 工作流说明

### 触发条件

- **自动触发**：代码推送到 `main` 分支时
- **手动触发**：在 GitHub Actions 页面点击 "Run workflow"

### 构建步骤

1. **Checkout code**：检出代码
2. **Set up Docker Buildx**：设置 Docker 构建环境
3. **Login to Aliyun ACR**：登录阿里云 ACR
4. **Build and push**：构建并推送镜像
5. **Output image address**：输出镜像地址

### 镜像标签

- `latest`：最新版本
- `{commit-sha}`：基于 Git commit SHA 的版本（用于版本追踪）

## ⚙️ 自定义配置

如果需要修改配置，编辑 `.github/workflows/deploy-aliyun.yml`：

```yaml
env:
  REGISTRY: crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com  # 你的 ACR 地址
  NAMESPACE: nomoreanxious  # 你的命名空间
  IMAGE_NAME: nomoreanxious  # 你的仓库名称
```

## 🎯 优势

1. **无需本地 Docker**：不需要在本地安装 Docker Desktop
2. **网络稳定**：GitHub Actions 在云端运行，网络更稳定
3. **自动化**：代码推送后自动构建
4. **构建缓存**：使用缓存加速构建
5. **版本追踪**：每个 commit 都有对应的镜像版本

## 🆘 常见问题

### Q1: 构建失败 - "unauthorized"

**原因**：ACR 登录凭证错误

**解决**：
- 检查 GitHub Secrets 中的 `ALIYUN_ACR_USERNAME` 和 `ALIYUN_ACR_PASSWORD` 是否正确
- 确认 ACR 密码是最新的

### Q2: 构建失败 - "network timeout"

**原因**：网络连接问题

**解决**：
- GitHub Actions 通常网络稳定，如果还是超时，可能是临时问题
- 等待几分钟后重试

### Q3: 如何手动触发构建？

**方法**：
1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 "Build and Push to Aliyun ACR" 工作流
4. 点击 **Run workflow**
5. 选择分支，点击 **Run workflow**

### Q4: 如何查看构建日志？

**方法**：
1. 进入 GitHub 仓库 → **Actions**
2. 点击工作流运行
3. 点击具体的 job
4. 查看各个步骤的日志

## ✅ 完成后的下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 推送代码到 GitHub
3. ✅ 查看构建结果
4. ⏳ 在 SAE 中部署应用

---

**现在可以开始配置了！先添加 GitHub Secrets，然后推送代码。**

