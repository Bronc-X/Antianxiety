# GitHub 手动添加文件步骤

## 📋 需要添加的文件

1. `Dockerfile` - Docker 镜像构建文件
2. `.dockerignore` - Docker 构建忽略文件
3. `.github/workflows/deploy-aliyun.yml` - GitHub Actions 工作流

## 🚀 操作步骤

### 步骤 1: 打开 GitHub 仓库

1. 访问：`https://github.com/Bronc-X/project-Nomoreanxious`
2. 确保你在 `main` 分支

### 步骤 2: 添加 Dockerfile

#### 2.1 创建文件

1. 点击仓库页面右上角的 **"Add file"** 按钮
2. 选择 **"Create new file"**

#### 2.2 输入文件路径和内容

**文件名**：输入 `Dockerfile`（注意大小写）

**文件内容**：复制以下内容

```dockerfile
# 多阶段构建，优化镜像大小
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置环境变量（构建时需要的）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# 构建应用
RUN npm run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
```

#### 2.3 提交文件

1. 滚动到页面底部
2. 在 **"Commit new file"** 部分：
   - 输入提交信息：`Add Dockerfile`
   - 选择 **"Commit directly to the main branch"**
3. 点击 **"Commit new file"** 按钮

### 步骤 3: 添加 .dockerignore

#### 3.1 创建文件

1. 点击 **"Add file"** → **"Create new file"**

#### 3.2 输入文件路径和内容

**文件名**：输入 `.dockerignore`（注意前面的点）

**文件内容**：复制以下内容

```
# 依赖
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 构建输出
.next
out
dist
build

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 测试
coverage
.nyc_output

# 版本控制
.git
.gitignore
.gitattributes

# IDE
.vscode
.idea
*.swp
*.swo
*~

# 文档
*.md
!README.md

# 其他
.DS_Store
*.log
.cache

# Cloudflare 相关
.vercel
wrangler.toml

# 部署脚本
scripts
```

#### 3.3 提交文件

1. 滚动到页面底部
2. 提交信息：`Add .dockerignore`
3. 选择 **"Commit directly to the main branch"**
4. 点击 **"Commit new file"**

### 步骤 4: 添加 GitHub Actions 工作流文件

#### 4.1 创建目录和文件

1. 点击 **"Add file"** → **"Create new file"**

#### 4.2 输入文件路径和内容

**重要**：文件名必须完整输入，包括路径：

**文件名**：输入 `.github/workflows/deploy-aliyun.yml`

（GitHub 会自动创建 `.github` 和 `workflows` 目录）

**文件内容**：复制以下内容

```yaml
name: Build and Push to Aliyun ACR

on:
  push:
    branches:
      - main
  workflow_dispatch:  # 允许手动触发

env:
  REGISTRY: crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
  NAMESPACE: nomoreanxious
  IMAGE_NAME: nomoreanxious

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Aliyun ACR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.ALIYUN_ACR_USERNAME }}
          password: ${{ secrets.ALIYUN_ACR_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Output image address
        run: |
          echo "Image pushed successfully!"
          echo "Image address: ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:latest"
          echo "Image address (with SHA): ${{ env.REGISTRY }}/${{ env.NAMESPACE }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
```

#### 4.3 提交文件

1. 滚动到页面底部
2. 提交信息：`Add GitHub Actions workflow for Aliyun deployment`
3. 选择 **"Commit directly to the main branch"**
4. 点击 **"Commit new file"**

## ✅ 完成后的检查

### 检查文件是否已添加

1. 在仓库页面，确认能看到以下文件：
   - `Dockerfile`（在根目录）
   - `.dockerignore`（在根目录）
   - `.github/workflows/deploy-aliyun.yml`（在 `.github/workflows/` 目录）

### 检查 GitHub Actions

1. 点击仓库顶部的 **"Actions"** 标签
2. 应该能看到 "Build and Push to Aliyun ACR" 工作流
3. 如果文件添加成功，工作流应该会自动触发

## ⚠️ 重要提示

### 1. 文件名必须正确

- `Dockerfile`（注意大小写，没有扩展名）
- `.dockerignore`（注意前面的点）
- `.github/workflows/deploy-aliyun.yml`（注意路径）

### 2. 文件内容必须完整

- 复制时确保内容完整
- 不要遗漏任何行

### 3. 提交到 main 分支

- 确保选择 **"Commit directly to the main branch"**
- 不要创建新分支

## 🎯 快速操作清单

- [ ] 添加 `Dockerfile` 文件
- [ ] 添加 `.dockerignore` 文件
- [ ] 添加 `.github/workflows/deploy-aliyun.yml` 文件
- [ ] 检查文件是否已存在
- [ ] 检查 GitHub Actions 是否已触发

## 🆘 如果遇到问题

### Q1: 无法创建以点开头的文件（.dockerignore）

**解决方法**：
- 在文件名输入框中直接输入 `.dockerignore`
- GitHub 会自动识别

### Q2: 无法创建 .github 目录

**解决方法**：
- 直接输入完整路径：`.github/workflows/deploy-aliyun.yml`
- GitHub 会自动创建目录

### Q3: 文件添加后 GitHub Actions 没有触发

**解决方法**：
1. 检查文件路径是否正确
2. 检查文件内容是否正确（YAML 格式）
3. 手动触发：Actions → 选择工作流 → Run workflow

---

**现在可以开始操作了！按照步骤依次添加这三个文件。**

