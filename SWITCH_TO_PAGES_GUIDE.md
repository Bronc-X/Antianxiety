# 切换到 Cloudflare Pages 部署指南

## 问题原因

你当前使用的是 **Cloudflare Workers**，它只显示 "Hello world" 是因为：
- Workers 主要用于运行服务器端代码和 API
- 不适合部署完整的 Next.js 应用
- 你的 Next.js 应用需要 Pages 来正确部署

## 解决方案：创建 Cloudflare Pages 项目

### 步骤 1: 创建新的 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧边栏，点击 **BUILD** → **Compute & AI** → **Workers & Pages**
3. 点击 **Create** 按钮
4. 选择 **Pages**（不是 Workers）
5. 选择 **Connect to Git**

### 步骤 2: 连接 GitHub 仓库

1. 授权 Cloudflare 访问你的 GitHub
2. 选择仓库：`Bronc-X/project-Nomoreanxious`
3. 点击 **Begin setup**

### 步骤 3: 配置构建设置

在配置页面中填写：

- **Project name**: `anxious` 或 `project-metabasis`
- **Production branch**: `main`
- **Framework preset**: `None`（手动配置）
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/`（项目根目录）
- **Node.js version**: `20.x`（推荐）

### 步骤 4: 配置环境变量

在部署前或部署后，进入项目 Settings → **Environment variables**，添加：

**构建时和运行时都需要**（在 Pages 中，环境变量在构建时和运行时都可用）：

1. `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
3. `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`

为 Production、Preview 和 Development 环境都配置。

### 步骤 5: 部署

1. 点击 **Save and Deploy**
2. 等待构建完成（可能需要几分钟）
3. 构建成功后，你会得到一个 `.pages.dev` 域名，例如：`anxious.pages.dev`

## Pages vs Workers 的区别

| 特性 | Workers | Pages |
|------|---------|-------|
| 用途 | 服务器端代码、API | 静态网站、Next.js 应用 |
| 环境变量 | 只在运行时可用 | 构建时和运行时都可用 |
| 输出 | 单个 Worker 脚本 | 完整的静态网站 |
| 域名 | `*.workers.dev` | `*.pages.dev` |
| Next.js 支持 | 需要特殊配置 | 原生支持 |

## 验证部署

部署成功后：

1. 访问 Pages 提供的域名（例如：`anxious.pages.dev`）
2. 应该能看到你的 Next.js 应用，而不是 "Hello world"
3. 测试功能：
   - 访问首页
   - 测试登录
   - 测试 AI 聊天功能

## 如果构建失败

1. 检查构建日志中的错误信息
2. 确认环境变量已正确配置
3. 确认所有路由都已添加 `export const runtime = 'edge';`
4. 检查 Node.js 版本是否为 18.x 或 20.x

## 删除旧的 Workers 项目（可选）

如果不再需要 Workers 项目，可以在 Workers 项目设置中删除它。

