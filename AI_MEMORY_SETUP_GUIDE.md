# AI 记忆系统设置指南

## 📋 概述

AI 记忆系统已实现，现在需要完成以下步骤来启用它：

1. ✅ 数据库表已创建（`ai_memory`）
2. ⏳ 需要在 Supabase 中创建向量搜索函数
3. ⏳ 需要配置环境变量

---

## 🔧 步骤 1: 创建向量搜索函数

在 Supabase SQL Editor 中执行以下 SQL：

**文件位置**: `supabase_ai_memory_search_function.sql`

```sql
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

**操作步骤**:
1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制上面的 SQL 代码
4. 点击 **Run** 执行

---

## 🔑 步骤 2: 配置环境变量

在 `.env.local` 文件中添加以下环境变量：

### 选项 1: 使用 DeepSeek API（推荐）

```bash
# DeepSeek API Key（用于生成向量嵌入和 AI 对话）
DEEPSEEK_API_KEY=sk-...

# 可选：自定义 DeepSeek Embeddings API
# DEEPSEEK_EMBEDDING_API_URL=https://api.deepseek.com/v1/embeddings
# DEEPSEEK_EMBEDDING_MODEL=deepseek-embedding
```

### 选项 2: 使用 OpenAI API

```bash
# OpenAI Embeddings API（用于生成向量嵌入）
OPENAI_API_KEY=sk-...

# 可选：自定义 OpenAI API 基址 / Embeddings 接口
# OPENAI_API_BASE=https://api.openai.com/v1
# OPENAI_EMBEDDING_API_URL=https://api.openai.com/v1/embeddings
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**注意**:
- 系统会**优先尝试 DeepSeek**，如果请求失败会自动回退到 OpenAI，避免手动切换
- 可以继续使用 `EMBEDDING_API_URL` / `EMBEDDING_MODEL` 作为通用兜底配置
- 至少需要设置其中一个 API Key
- DeepSeek Embeddings API 的向量维度是 1536，与 OpenAI 兼容

---

## ✅ 验证设置

完成上述步骤后，AI 记忆系统将自动工作：

1. **用户发送消息时**：
   - 系统会生成消息的向量嵌入
   - 从 `ai_memory` 表中检索相似的历史记忆
   - 将相关记忆添加到系统提示词中

2. **AI 回复后**：
   - 系统会存储用户消息和 AI 回复到 `ai_memory` 表
   - 每条消息都会生成向量嵌入并存储

3. **下次对话时**：
   - AI 可以引用之前对话的内容
   - 实现"永不 SAY HI"的体验

---

## 🐛 故障排除

### 问题 1: "函数 match_ai_memories 不存在"

**解决方案**: 确保已执行 `supabase_ai_memory_search_function.sql` 中的 SQL

### 问题 2: "DEEPSEEK_API_KEY 或 OPENAI_API_KEY 未设置"

**解决方案**: 在 `.env.local` 中添加 `DEEPSEEK_API_KEY`（推荐）或 `OPENAI_API_KEY`

### 问题 3: 向量搜索失败，使用备用方法

**可能原因**:
- RPC 函数未创建
- 向量嵌入生成失败
- 数据库连接问题

**解决方案**: 检查 Supabase 日志和服务器日志，系统会自动降级到获取最近记忆的方法

---

## 📊 系统架构

```
用户消息
    ↓
生成向量嵌入 (OpenAI Embeddings API)
    ↓
向量相似度搜索 (pgvector)
    ↓
检索相关历史记忆
    ↓
构建包含记忆的上下文
    ↓
调用 DeepSeek API
    ↓
存储新对话到 ai_memory 表
```

---

## 🎯 下一步

完成设置后，可以：
1. 测试 AI 对话，验证记忆系统是否工作
2. 查看 `ai_memory` 表，确认记忆已存储
3. 进行多轮对话，验证 AI 能否引用历史内容

