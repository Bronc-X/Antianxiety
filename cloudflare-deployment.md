# Cloudflare Pages 部署指南

## 前置要求

1. Cloudflare 账户
2. GitHub 仓库已连接
3. 环境变量已配置

## 部署步骤

### 1. 安装 Cloudflare Next.js 适配器

Cloudflare Pages 需要特殊适配器来支持 Next.js。由于 Next.js 16 使用 App Router，我们需要使用 `@cloudflare/next-on-pages`。

**注意**: 由于我们使用 `npx` 直接运行，不需要全局安装。构建脚本已配置在 `package.json` 中。

如果需要本地测试，可以安装：
```bash
npm install -D @cloudflare/next-on-pages
```

### 2. 验证构建脚本

`package.json` 中已包含以下构建脚本：
- `pages:build`: 运行 Cloudflare 适配器
- `pages:deploy`: 完整构建流程（先 Next.js build，再 Cloudflare 适配）

### 3. wrangler.toml 配置文件

项目根目录已包含 `wrangler.toml` 配置文件，用于 Cloudflare Pages 部署设置。

### 4. 在 Cloudflare Dashboard 中配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → **Create a project**
3. 选择 **Connect to Git**
4. 选择你的 GitHub 仓库：`Bronc-X/project-Nomoreanxious`
5. 配置构建设置：
   - **Framework preset**: `None` 或 `Next.js (Static HTML Export)`
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (项目根目录)
   - **Node.js version**: `20.x` (推荐) 或 `18.x`
   - **Environment variables**: 稍后配置（见步骤 5）

### 5. 配置环境变量

在 Cloudflare Pages 项目设置中，添加以下环境变量：

**必需的环境变量：**
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥（用于 AI 功能）
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥

**配置步骤：**
1. 进入项目设置 → **Environment variables**
2. 为 **Production**、**Preview** 和 **Development** 环境分别添加变量
3. 点击 **Save**

### 6. 部署

- **自动部署**：每次推送到 `main` 分支会自动触发部署
- **手动部署**：在 Cloudflare Dashboard 中点击 **Retry deployment**

### 7. 验证部署

部署完成后：

1. **检查部署状态**
   - 在 Cloudflare Dashboard 中查看构建日志
   - 确认构建成功（绿色状态）

2. **测试网站功能**
   - 访问部署后的网站 URL
   - 测试登录功能
   - 测试 AI 聊天功能（访问 `/assistant` 页面）

3. **检查环境变量**
   - 确认所有环境变量已正确设置
   - 如果 AI 功能不工作，检查 `DEEPSEEK_API_KEY` 是否配置

## 注意事项

### Next.js 16 与 Cloudflare Pages

Next.js 16 使用 App Router，Cloudflare Pages 需要特殊处理：

1. **服务器端功能限制**：
   - Cloudflare Pages 主要支持静态导出
   - 动态 API 路由需要使用 Cloudflare Workers
   - 某些 Next.js 功能可能不完全支持

2. **替代方案**：
   - 如果遇到兼容性问题，考虑使用 Vercel（Next.js 官方推荐）
   - 或使用 Cloudflare Workers 处理 API 路由

### AI 功能配置

确保 `DEEPSEEK_API_KEY` 已正确配置，否则 AI 聊天功能将无法使用。

### Supabase 配置

确保 Supabase URL 和 Key 已配置，否则认证和数据库功能将无法使用。

## 故障排查

### 问题：构建失败

**可能原因：**
- Node.js 版本不兼容
- 缺少依赖
- `@cloudflare/next-on-pages` 安装失败
- 构建命令错误

**解决：**
1. 检查 Cloudflare Pages 构建日志，查看具体错误信息
2. 确保 Node.js 版本为 18.x 或 20.x
3. 检查 `package.json` 中的依赖是否完整
4. 尝试在本地运行 `npm run pages:build` 测试构建
5. 如果 `@cloudflare/next-on-pages` 安装失败，检查网络连接或使用代理

### 问题：AI 功能不工作

**可能原因：**
- `DEEPSEEK_API_KEY` 未设置或无效
- API 路由未正确部署

**解决：**
1. 检查环境变量是否已配置
2. 查看浏览器控制台错误
3. 检查 API 路由是否可访问

### 问题：认证功能不工作

**可能原因：**
- Supabase 环境变量未配置
- CORS 配置问题

**解决：**
1. 检查 Supabase 环境变量
2. 在 Supabase Dashboard 中配置允许的域名

## 参考链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)

