# Supabase Migration Guide - Adaptive Interaction System

## 📋 执行清单

在 Supabase Dashboard → SQL Editor 中执行以下 SQL 文件：

### 必须执行的迁移

```
supabase/migrations/20251216_adaptive_interaction_system.sql
```

这个迁移会创建：

| 表名 | 用途 |
|-----|------|
| `phase_goals` | 用户阶段性目标 |
| `onboarding_answers` | 注册问卷答案 |
| `inquiry_history` | AI 主动问询历史 |
| `user_activity_patterns` | 用户活动模式 |
| `curated_feed_queue` | 个性化内容队列 |

以及：
- RLS 策略（行级安全）
- 索引优化
- Helper 函数

---

## 🚀 执行步骤

### 1. 打开 Supabase Dashboard
- 登录 https://supabase.com/dashboard
- 选择你的项目

### 2. 进入 SQL Editor
- 左侧菜单点击 "SQL Editor"
- 点击 "New query"

### 3. 复制并执行 SQL
- 打开 `supabase/migrations/20251216_adaptive_interaction_system.sql`
- 复制全部内容
- 粘贴到 SQL Editor
- 点击 "Run" 执行

### 4. 验证表创建成功
执行以下查询验证：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'phase_goals', 
  'onboarding_answers', 
  'inquiry_history', 
  'user_activity_patterns', 
  'curated_feed_queue'
);
```

应该返回 5 行。

---

## ⚠️ 注意事项

1. **daily_calibrations 表必须已存在** - 迁移会尝试添加列到这个表
2. **如果表已存在** - 使用 `IF NOT EXISTS` 所以不会报错
3. **RLS 策略** - 会自动启用，确保用户只能访问自己的数据

---

## 🔧 环境变量

确保 `.env.local` 中有以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_random_secret  # 可选，用于手动触发 cron
```

---

## 📅 Vercel Cron 配置

已在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/curate-content",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- 每天 UTC 3:00 AM 执行
- 自动为活跃用户抓取个性化内容
- 跳过 7 天不活跃的用户

---

## 🧪 手动测试 Cron

部署后可以手动触发测试：

```bash
curl -X POST https://your-domain.vercel.app/api/cron/curate-content \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

或者直接访问（Vercel Cron 会自动调用）：
```
GET https://your-domain.vercel.app/api/cron/curate-content
```
