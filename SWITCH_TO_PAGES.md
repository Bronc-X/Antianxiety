# 切换到 Cloudflare Pages（推荐）

## 为什么应该使用 Pages 而不是 Workers？

- **Workers**：用于运行服务器端代码和 API，环境变量只在运行时可用
- **Pages**：专为静态网站和 Next.js 应用设计，环境变量在构建时和运行时都可用

## 切换到 Pages 的步骤

### 1. 创建新的 Pages 项目

1. 在 Cloudflare Dashboard 中，进入 **Workers & Pages**
2. 点击 **Create** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库：`Bronc-X/project-Nomoreanxious`

### 2. 配置构建设置

- **Framework preset**: `None`
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/`
- **Node.js version**: `20.x`

### 3. 配置环境变量

在 Pages 项目中，环境变量在构建时和运行时都可用：

1. 进入项目 Settings → **Environment variables**
2. 添加以下变量（为 Production、Preview、Development 都配置）：
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`

### 4. 部署

配置完成后，点击 **Save and Deploy**，构建应该会成功。

## 优势

- ✅ 环境变量在构建时和运行时都可用
- ✅ 专为 Next.js 优化
- ✅ 自动部署（每次推送到 GitHub 自动触发）
- ✅ 更好的静态资源处理

