# 部署指南

## 环境变量配置

### 本地开发

1. 复制 `.env.example` 为 `.env.local`
2. 填入真实的环境变量值
3. **永远不要提交 `.env.local` 到 Git**

### Vercel/Netlify 部署

在部署平台的环境变量设置中添加：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Supabase 配置

1. 登录 Supabase Dashboard
2. 进入 Project Settings → API
3. 复制 `URL` 和 `anon public` key
4. 在部署平台设置环境变量

### SQL 脚本执行

在 Supabase Dashboard → SQL Editor 依次执行：

1. `supabase_schema.sql` - 基础表结构
2. `ADD_HEALTH_FIELDS.sql` - 健康参数字段
3. `ADD_LIFESTYLE_FIELDS.sql` - 生活习惯字段
4. `FIX_RLS_FINAL.sql` - RLS 策略修复

### OAuth 配置

#### GitHub OAuth
1. 访问 https://github.com/settings/developers
2. 创建 OAuth App
3. Authorization callback URL: `https://your-domain.com/auth/callback`
4. 复制 Client ID 和 Client Secret

## 安全检查清单

- [ ] `.env.local` 在 `.gitignore` 中
- [ ] 生产环境使用环境变量，不硬编码
- [ ] API keys 不暴露在客户端代码
- [ ] Supabase RLS 策略已启用
- [ ] OAuth redirect URLs 配置正确

## 故障排查

### AI 对话不可用
- 检查 `DEEPSEEK_API_KEY` 是否设置
- 查看服务端日志

### RLS 策略错误
- 执行 `FIX_RLS_FINAL.sql`
- 确认用户已登录

### OAuth 登录失败
- 检查 callback URL 配置
- 验证 Client ID/Secret
