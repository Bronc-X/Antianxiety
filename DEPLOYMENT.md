# 部署指南

> 📖 **详细部署指南**: 请参阅 [docs/VERCEL_DEPLOYMENT_GUIDE.md](./docs/VERCEL_DEPLOYMENT_GUIDE.md)

## 1) 环境变量

### 本地开发

1. 复制 `.env.example` → `.env.local`
2. 填入真实值（不要提交 `.env.local`）

### Vercel / Netlify / Cloudflare Pages

在部署平台的环境变量设置中添加（按需）：

```env
# Supabase（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI（启用 AI 功能时需要）
OPENAI_API_KEY=your_openai_compatible_api_key
OPENAI_API_BASE=https://aicanapi.com/v1

# Server-only（按需，用于 cron/后台写入）
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CRON_SECRET=your_random_secret
CONTENT_INGEST_API_KEY=your_random_secret

# Optional
SEMANTIC_SCHOLAR_API_KEY=
RESEND_API_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 2) Supabase SQL 脚本

SQL 脚本在 `supabase/migrations/`。按你启用的功能选择对应迁移执行。

参考：
- `docs/QUICK_START_DEPLOYMENT.md`
- `docs/SUPABASE_MIGRATION_GUIDE.md`

## 3) 故障排查

### 环境变量缺失

```bash
npm run check-env
```

### RLS / 权限错误

- 确认用户已登录
- 确认对应表的 RLS 策略与函数已按迁移执行

