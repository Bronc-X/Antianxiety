# 🚀 自适应交互系统部署步骤

## 📋 总览

你需要完成 3 个步骤：
1. 在 Supabase 执行 SQL（创建数据库表）
2. 添加环境变量
3. 部署到 Vercel

---

## 步骤 1：在 Supabase 执行 SQL

### 1.1 打开 Supabase Dashboard
1. 浏览器打开 https://supabase.com/dashboard
2. 登录你的账号
3. 点击你的项目（nomoreanxious）

### 1.2 进入 SQL Editor
1. 左侧菜单找到 **SQL Editor**（图标是一个数据库符号）
2. 点击进入

### 1.3 执行迁移 SQL
1. 点击 **New query**（新建查询）
2. 打开本地文件：`supabase/migrations/20251216_adaptive_interaction_system.sql`
3. **全选复制**文件内容（Cmd+A, Cmd+C）
4. 粘贴到 Supabase SQL Editor 中
5. 点击右下角的 **Run** 按钮
6. 等待执行完成（应该显示绿色成功提示）

### 1.4 验证表创建成功
在 SQL Editor 中执行以下查询：

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

**预期结果**：应该返回 5 行，每行一个表名。

---

## 步骤 2：添加环境变量

### 2.1 本地环境变量
打开 `.env.local` 文件，确保有以下变量：

```env
# Supabase（应该已经有了）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cron 安全密钥（新增）
CRON_SECRET=nma_cron_2024_secret_key
```

> 💡 `CRON_SECRET` 可以是任意字符串，用于手动触发 cron 时验证身份

### 2.2 Vercel 环境变量
1. 打开 https://vercel.com/dashboard
2. 点击你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加 `CRON_SECRET`（值和本地一样）

---

## 步骤 3：部署到 Vercel

### 3.1 提交代码
打开终端，在项目目录执行：

```bash
git add .
git commit -m "feat: 自适应交互系统 - Vercel Cron 内容策展"
git push
```

### 3.2 等待部署
1. Vercel 会自动检测到 push 并开始部署
2. 打开 https://vercel.com/dashboard 查看部署状态
3. 等待显示 **Ready**（绿色）

### 3.3 验证 Cron 配置
1. 在 Vercel Dashboard 点击你的项目
2. 点击 **Settings** → **Crons**
3. 应该看到：
   - `/api/cron/curate-content` - 每天 3:00 AM UTC

---

## 🧪 手动测试流程

### 测试 1：验证数据库表

在 Supabase SQL Editor 执行：

```sql
-- 检查表是否存在
SELECT * FROM phase_goals LIMIT 1;
SELECT * FROM curated_feed_queue LIMIT 1;
SELECT * FROM inquiry_history LIMIT 1;
```

**预期**：不报错，返回空结果（因为还没有数据）

---

### 测试 2：测试注册问卷流程

1. 打开你的网站
2. 注册一个新账号（或用测试账号）
3. 完成注册问卷（3 道模板题 + AI 决策树题）
4. 查看推荐的 Phase Goals

**验证数据**：在 Supabase SQL Editor 执行：

```sql
-- 查看你的 Phase Goals
SELECT * FROM phase_goals ORDER BY created_at DESC LIMIT 5;

-- 查看问卷答案
SELECT * FROM onboarding_answers ORDER BY created_at DESC LIMIT 10;
```

---

### 测试 3：测试每日校准

1. 在 App 中打开每日校准
2. 输入睡眠时长、压力水平、运动意图
3. 完成校准

**验证数据**：

```sql
-- 查看校准记录
SELECT * FROM daily_calibrations ORDER BY created_at DESC LIMIT 5;
```

---

### 测试 4：手动触发内容策展 Cron

在终端执行（替换 YOUR_DOMAIN）：

```bash
# 方式 1：使用 curl
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/cron/curate-content"

# 方式 2：带认证（如果设置了 CRON_SECRET）
curl -X POST "https://YOUR_DOMAIN.vercel.app/api/cron/curate-content" \
  -H "Authorization: Bearer nma_cron_2024_secret_key"
```

**或者直接在浏览器访问**：
```
https://YOUR_DOMAIN.vercel.app/api/cron/curate-content
```

**预期返回**：
```json
{
  "success": true,
  "totalUsers": 1,
  "processedUsers": 1,
  "skippedInactiveUsers": 0,
  "totalContentCurated": 3,
  "errors": [],
  "executionTimeMs": 2500,
  "executedAt": "2024-12-16T10:00:00.000Z"
}
```

**验证数据**：

```sql
-- 查看策展的内容
SELECT * FROM curated_feed_queue ORDER BY created_at DESC LIMIT 10;
```

---

### 测试 5：测试主动问询

1. 确保你有 Phase Goals（完成注册问卷）
2. 刷新 App 首页
3. 应该看到 ActiveInquiryBanner（如果有待处理问询）

**验证数据**：

```sql
-- 查看问询历史
SELECT * FROM inquiry_history ORDER BY created_at DESC LIMIT 5;
```

---

## ❓ 常见问题

### Q: SQL 执行报错 "relation already exists"
**A**: 没关系，说明表已经存在。迁移使用了 `IF NOT EXISTS`，可以安全重复执行。

### Q: Cron 返回 "Missing Supabase configuration"
**A**: 检查 Vercel 环境变量是否设置了 `SUPABASE_SERVICE_ROLE_KEY`

### Q: 内容策展返回 0 条内容
**A**: 
1. 确保你完成了注册问卷（有 Phase Goals）
2. 确保最近 7 天有活动（校准或更新资料）

### Q: Vercel Cron 没有执行
**A**: 
1. Vercel Hobby 计划每天只能执行 1 次 cron
2. 检查 Vercel Dashboard → Settings → Crons 是否显示配置

---

## 📞 需要帮助？

如果遇到问题，把以下信息发给我：
1. 错误截图
2. SQL 执行结果
3. API 返回的 JSON
