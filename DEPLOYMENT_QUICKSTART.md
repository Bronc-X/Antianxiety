# 快速部署指南

## 今天要完成的两个任务

1. ✅ 使用 Cloudflare 部署网站
2. ✅ 确保网页 AI 功能可以正常使用

## 快速检查清单

### 任务 1: Cloudflare 部署准备

- [x] 项目已配置 Cloudflare 构建脚本
- [x] `wrangler.toml` 配置文件已创建
- [ ] 在 Cloudflare Dashboard 中创建 Pages 项目
- [ ] 配置环境变量（见下方）
- [ ] 首次部署成功

### 任务 2: AI 功能配置

- [x] AI 聊天 API 路由已实现 (`/api/ai/chat`)
- [x] 环境变量检查脚本已创建
- [ ] `DEEPSEEK_API_KEY` 已配置
- [ ] 本地测试 AI 功能正常
- [ ] 生产环境 AI 功能正常

## 立即开始

### 步骤 1: 检查环境变量

```bash
npm run check-env
```

如果显示缺失环境变量，需要配置：

**本地开发**（创建 `.env.local` 文件）:
```env
DEEPSEEK_API_KEY=你的_DeepSeek_API_Key
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key
```

**Cloudflare Pages**（在 Dashboard 中配置）:
- 进入项目设置 → Environment variables
- 添加上述三个环境变量

### 步骤 2: 本地测试 AI 功能

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 AI 助理页面：
   - 打开 `http://localhost:3000/assistant`
   - 登录账户
   - 发送测试消息："你好，我想了解如何缓解焦虑"

3. 检查是否收到 AI 回复

### 步骤 3: 部署到 Cloudflare Pages

1. **在 Cloudflare Dashboard 中**:
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Pages** → **Create a project**
   - 选择 **Connect to Git**
   - 选择仓库：`Bronc-X/project-Nomoreanxious`

2. **配置构建设置**:
   - Framework preset: `None`
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`
   - Node.js version: `20.x`

3. **配置环境变量**:
   - 在项目设置中添加：
     - `DEEPSEEK_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **部署**:
   - 点击 **Save and Deploy**
   - 等待构建完成

5. **验证部署**:
   - 访问部署后的网站
   - 测试登录功能
   - 测试 AI 聊天功能

## 详细文档

- **Cloudflare 部署**: 查看 `cloudflare-deployment.md`
- **AI 功能测试**: 查看 `AI_TESTING.md`
- **环境变量配置**: 查看 `ENV_SETUP.md`
- **DeepSeek API 配置**: 查看 `DEEPSEEK_SETUP.md`

## 常见问题

### Q: 如何获取 DeepSeek API Key？

A: 查看 `DEEPSEEK_SETUP.md` 文档，或访问 [DeepSeek 官网](https://www.deepseek.com/)

### Q: 如何获取 Supabase 配置？

A: 查看 `ENV_SETUP.md` 文档，或访问 [Supabase Dashboard](https://app.supabase.com/)

### Q: 构建失败怎么办？

A: 
1. 检查构建日志中的错误信息
2. 确认 Node.js 版本为 18.x 或 20.x
3. 检查环境变量是否已配置
4. 查看 `cloudflare-deployment.md` 中的故障排查部分

### Q: AI 功能不工作？

A:
1. 检查 `DEEPSEEK_API_KEY` 是否已配置
2. 查看浏览器控制台错误
3. 确认用户已登录
4. 查看 `AI_TESTING.md` 中的故障排查部分

## 下一步

部署成功后，建议：

1. **监控 API 使用量**
   - 定期检查 DeepSeek API 使用情况
   - 设置使用量告警

2. **性能优化**
   - 监控网站加载速度
   - 优化图片和资源

3. **功能测试**
   - 全面测试所有功能
   - 收集用户反馈

