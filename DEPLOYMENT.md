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

### 新建 Supabase 项目（全模块、无 Demo 数据）

如果你要重建全新项目（antianxiety / antianxiety-en），建议按顺序执行以下脚本：

1. `supabase/migrations/supabase_init_complete.sql`
2. `supabase/migrations/20241124_add_settings_columns.sql`
3. `supabase/migrations/20251124_add_missing_columns.sql`
4. `supabase/migrations/supabase_profiles_extension.sql`
5. `supabase/migrations/supabase_metabolic_profile.sql`
6. `supabase/migrations/supabase_ai_assistant.sql`
7. `supabase/migrations/supabase_ai_settings_v2.sql`
8. `supabase/migrations/supabase_daily_questionnaire.sql`
9. `supabase/migrations/20251204_assessment_engine.sql`
10. `supabase/migrations/20251222_adaptive_assessment_system.sql`
11. `supabase/migrations/supabase_user_plans.sql`
12. `supabase/migrations/20251217_adaptive_plan_followup.sql`
13. `supabase/migrations/supabase_antianxiety_upgrade.sql`
14. `supabase/migrations/supabase_ai_memory_upgrade.sql`
15. `supabase/migrations/20251202_bayesian_belief_loop.sql`
16. `supabase/migrations/CONTENT_FEED_SQL_COMPLETE.sql`
17. `supabase/migrations/20251225_user_feed_feedback.sql`
18. `supabase/migrations/20251225_unified_user_profiles.sql`
19. `supabase/migrations/20251223_beta_signups.sql`
20. `supabase/migrations/20251222_wearable_integration.sql`
21. `supabase/migrations/20251230_update_user_health_data_types.sql`
22. `supabase/migrations/20251231_bootstrap_missing_tables.sql`
23. `supabase/migrations/supabase_enable_realtime.sql`
24. `supabase/migrations/supabase_cron_jobs.sql`

说明：
- 已移除 Demo 数据插入；不要执行 `supabase_healthline_knowledge.sql`、`supabase_vector_knowledge_base_FIXED.sql`、`20251225_invite_codes.sql`。
- `20251231_bootstrap_missing_tables.sql` 新增了 `daily_calibrations`、`knowledge_base`、`user_profiles`、`chat_feedback`、`invite_codes`、`belief_sessions` view 与 `search_user_memories` RPC，并做了 `phase_goals` 兼容字段同步。
- 如果 English 项目需要默认语言为 `en`，可在 `profiles.language` 上手动改默认值，或在应用层写入。

Cron 相关：
- 需要在 Supabase 里启用 `pg_cron`（以及 `pg_net` / `net.http_post` 可用）。
- `supabase_cron_jobs.sql` 里的 URL 请改成你的线上域名，并在 DB Settings 或 secrets 里设置 `app.content_ingest_api_key`。

## 3) 故障排查

### 环境变量缺失

```bash
npm run check-env
```

### RLS / 权限错误

- 确认用户已登录
- 确认对应表的 RLS 策略与函数已按迁移执行
