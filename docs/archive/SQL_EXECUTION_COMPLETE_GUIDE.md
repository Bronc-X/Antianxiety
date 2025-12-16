# 📋 Supabase SQL 脚本完整执行指南

## 🎯 概述

本指南包含所有需要在 Supabase 中执行的 SQL 脚本，按照正确的顺序执行以确保功能正常工作。

---

## ⚠️ 重要提示

1. **执行顺序很重要**：请按照下面的顺序依次执行
2. **先执行基础表结构**：确保已执行 `SQL_TO_EXECUTE_FIXED.sql` 创建基础表
3. **逐个执行**：每次只执行一个脚本，确认成功后再执行下一个
4. **备份数据**：如果数据库已有数据，建议先备份

---

## 📝 执行步骤

### 步骤 1: 验证基础表结构（如果还没执行）

**文件**: `SQL_TO_EXECUTE_FIXED.sql`

**说明**: 如果还没有执行过基础表结构，先执行这个脚本。如果已经执行过，可以跳过。

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `SQL_TO_EXECUTE_FIXED.sql` 中的所有 SQL 代码
3. 点击 **Run** 执行
4. 确认执行成功（应该看到 "Success. No rows returned"）

---

### 步骤 2: 启用 AI 记忆向量搜索函数

**文件**: `supabase_ai_memory_search_function.sql`

**功能**: 创建向量搜索函数，用于从 `ai_memory` 表中检索相关历史记忆

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制以下 SQL 代码：

```sql
-- ============================================
-- AI 记忆向量搜索函数
-- 用于在 ai_memory 表中进行相似度搜索
-- ============================================

-- 创建 RPC 函数：匹配 AI 记忆
CREATE OR REPLACE FUNCTION public.match_ai_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  content_text text,
  role text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.content_text,
    am.role,
    am.created_at,
    1 - (am.embedding <=> query_embedding) AS similarity
  FROM public.ai_memory am
  WHERE
    am.embedding IS NOT NULL
    AND (p_user_id IS NULL OR am.user_id = p_user_id)
    AND (1 - (am.embedding <=> query_embedding)) >= match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.match_ai_memories IS 'AI 记忆向量搜索函数：根据查询向量查找相似的历史记忆';
```

3. 点击 **Run** 执行
4. 验证：执行以下 SQL 确认函数已创建：
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'match_ai_memories';
   ```
   应该返回 `match_ai_memories`

---

### 步骤 3: 创建贝叶斯函数和触发器

**文件**: `supabase_bayesian_functions.sql`

**功能**: 创建贝叶斯信念循环的数据库函数和触发器

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 打开 `supabase_bayesian_functions.sql` 文件
3. **复制整个文件的所有 SQL 代码**（从第一行到最后一行）
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行
6. 验证：执行以下 SQL 确认函数已创建：
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('calculate_belief_curve_score', 'calculate_confidence_score', 'calculate_physical_performance_score');
   ```
   应该返回 3 个函数名

---

### 步骤 4: 启用 Supabase Realtime

**文件**: `supabase_enable_realtime.sql`

**功能**: 将表添加到 Realtime 发布中，启用跨设备实时同步

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制以下 SQL 代码：

```sql
-- ============================================
-- 启用 Supabase Realtime 功能
-- 将表添加到 supabase_realtime 发布中
-- ============================================

-- 1. 启用 habits 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;

-- 2. 启用 habit_completions 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;

-- 3. 启用 user_metrics 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;

-- 4. 启用 profiles 表的 Realtime（可选）
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

3. 点击 **Run** 执行
4. 验证：执行以下 SQL 确认表已添加到发布：
   ```sql
   SELECT schemaname, tablename 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime'
   ORDER BY tablename;
   ```
   应该看到：`habits`, `habit_completions`, `profiles`, `user_metrics`

---

## ✅ 验证所有功能

### 验证 1: AI 记忆函数

```sql
-- 测试函数是否存在
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'match_ai_memories';
```

### 验证 2: 贝叶斯函数

```sql
-- 测试所有贝叶斯函数
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'calculate_belief_curve_score',
  'calculate_confidence_score',
  'calculate_physical_performance_score',
  'update_user_metrics_on_habit_completion'
);
```

应该返回 4 个函数。

### 验证 3: 触发器

```sql
-- 测试触发器是否存在
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'trigger_update_user_metrics_on_habit_completion';
```

应该返回触发器信息。

### 验证 4: Realtime

```sql
-- 查看所有启用了 Realtime 的表
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

应该看到 4 个表。

---

## 🐛 常见问题

### 问题 1: "function already exists"

**解决方案**: 这是正常的，`CREATE OR REPLACE FUNCTION` 会更新已存在的函数。可以继续执行。

### 问题 2: "relation does not exist"

**可能原因**: 基础表还没有创建

**解决方案**: 先执行 `SQL_TO_EXECUTE_FIXED.sql`

### 问题 3: "extension vector does not exist"

**解决方案**: 在 Supabase Dashboard → Database → Extensions 中启用 `vector` 扩展

### 问题 4: Realtime 执行失败 - "relation is already member of publication"

**可能原因**: 表已经添加到 Realtime 发布中

**解决方案**: 
- 这是正常的，说明表已经启用了 Realtime
- 已更新 SQL 脚本，使用安全版本（会自动检查并跳过已存在的表）
- 重新执行更新后的 `supabase_enable_realtime.sql` 即可

---

## 📊 执行检查清单

- [ ] 步骤 1: 基础表结构已创建（`SQL_TO_EXECUTE_FIXED.sql`）
- [ ] 步骤 2: AI 记忆搜索函数已创建（`supabase_ai_memory_search_function.sql`）
- [ ] 步骤 3: 贝叶斯函数已创建（`supabase_bayesian_functions.sql`）
- [ ] 步骤 4: Realtime 已启用（`supabase_enable_realtime.sql`）
- [ ] 步骤 5: 个性化信息推送表和函数已创建（`CONTENT_FEED_SQL_COMPLETE.sql`）
- [ ] 所有验证 SQL 都通过

---

### 步骤 5: 创建个性化信息推送表和函数（可选）

**文件**: `CONTENT_FEED_SQL_COMPLETE.sql`

**功能**: 创建内容池表和 RAG 搜索函数，用于个性化信息推送

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `CONTENT_FEED_SQL_COMPLETE.sql` 中的所有 SQL 代码
3. 点击 **Run** 执行

**验证**:
```sql
-- 验证表
SELECT * FROM information_schema.tables WHERE table_name = 'content_feed_vectors';

-- 验证函数
SELECT proname FROM pg_proc WHERE proname = 'match_content_feed_vectors';
```

---

## 🎯 执行完成后

完成所有 SQL 脚本执行后：

1. ✅ AI 记忆系统可以正常工作
2. ✅ 贝叶斯函数会自动计算用户指标
3. ✅ 跨设备实时同步已启用
4. ✅ 个性化信息推送功能可以使用（需要先爬取内容）
5. ✅ 可以开始测试功能

---

## 📝 下一步

完成 SQL 执行后，可以：
1. 测试 AI 聊天功能（验证记忆系统）
2. 测试习惯打卡（验证贝叶斯函数）
3. 测试跨设备同步（验证 Realtime）
4. 调用用户画像向量化 API

---

**最后更新**: 2024-12-19
**执行顺序**: 基础表 → AI 记忆函数 → 贝叶斯函数 → Realtime

