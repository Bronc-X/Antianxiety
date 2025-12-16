# ⚡ 快速部署指南

## 🎯 3 步完成部署

---

## Step 1: 执行 SQL（2分钟）

1. 打开 https://supabase.com/dashboard
2. 进入你的项目 → **SQL Editor** → **New query**
3. 复制 `supabase/migrations/20251216_adaptive_interaction_system.sql` 全部内容
4. 粘贴 → 点击 **Run**
5. 看到绿色成功提示 ✅

---

## Step 2: 添加环境变量（1分钟）

在 `.env.local` 添加一行：

```env
CRON_SECRET=nma_cron_2024_secret
```

在 Vercel Dashboard → Settings → Environment Variables 也添加同样的变量。

---

## Step 3: 部署（1分钟）

```bash
git add .
git commit -m "feat: 自适应交互系统部署"
git push
```

等待 Vercel 部署完成（约 2 分钟）。

---

## 🧪 快速测试

### 测试 1: 检查数据库
在 Supabase SQL Editor 执行：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('phase_goals', 'curated_feed_queue');
```
应该返回 2 行。

### 测试 2: 测试 Cron
浏览器访问：
```
https://你的域名.vercel.app/api/cron/curate-content
```
应该返回 JSON（包含 `"success": true`）。

### 测试 3: 完整流程
1. 注册新账号 → 完成问卷 → 看到 Phase Goals
2. 打开每日校准 → 完成校准
3. 刷新首页 → 可能看到主动问询横幅

---

## ✅ 完成！

系统会：
- 每天 3:00 AM UTC 自动为活跃用户抓取个性化内容
- 用户打开 App 时显示主动问询
- 根据 Phase Goals 定制每日校准问题
