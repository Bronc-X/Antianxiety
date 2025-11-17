# Cloudflare 构建时环境变量问题解决方案

## 问题分析

你已经配置了环境变量，但构建时仍然报错，原因是：

**Cloudflare Workers 的环境变量默认只在运行时可用，构建时不可用。**

但是 Next.js 在构建时需要这些环境变量（特别是 `NEXT_PUBLIC_*` 变量）来预渲染页面。

## 解决方案

### 方案 1: 在构建配置中添加环境变量（推荐）

1. 在 Cloudflare Dashboard 中，进入项目 Settings
2. 找到 **Builds & deployments** 部分
3. 点击 **Configure build** 或 **Edit build configuration**
4. 在构建配置中，找到 **Environment variables** 或 **Build environment variables** 部分
5. 添加以下变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`

### 方案 2: 使用 Cloudflare Pages 而不是 Workers

如果你要部署 Next.js 应用，应该使用 **Cloudflare Pages** 而不是 Workers：

1. 在 Cloudflare Dashboard 中，进入 **Workers & Pages**
2. 点击 **Create** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建命令：`npm run pages:build`
5. 在 Pages 项目中，环境变量在构建时和运行时都可用

### 方案 3: 在 wrangler.toml 中配置（如果支持）

如果 Cloudflare 支持在 `wrangler.toml` 中配置构建时变量，可以尝试添加。

## 检查步骤

1. **确认项目类型**：
   - 如果是 Workers，环境变量只在运行时可用
   - 如果是 Pages，环境变量在构建时和运行时都可用

2. **检查构建配置**：
   - 在 Settings → Builds & deployments 中
   - 查看是否有单独的"构建时环境变量"配置

3. **查看构建日志**：
   - 检查构建日志，确认环境变量是否在构建时可用
   - 如果看到 "NEXT_PUBLIC_*" 变量未定义，说明需要在构建配置中添加

## 推荐操作

**最佳方案**：使用 Cloudflare Pages 而不是 Workers 来部署 Next.js 应用。

Pages 专为静态网站和 Next.js 应用设计，环境变量在构建时和运行时都可用。

