# 个性化信息推送功能设置指南

## 📋 概述

根据 readme.md 的要求，个性化信息推送功能需要：
- 只保留 4.5分/5分以上相关性的内容
- 支持 X、Reddit、专业研究机构、学府、顶级期刊等来源
- 使用 RAG 系统进行向量相似度搜索

---

## 🔧 步骤 1: 创建 content_feed_vectors 表

**文件**: `supabase_content_feed_vectors.sql`

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `supabase_content_feed_vectors.sql` 中的所有 SQL 代码
3. 点击 **Run** 执行

**验证**:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'content_feed_vectors';
```

---

## 🔧 步骤 2: 创建 RAG 搜索函数

**文件**: `supabase_rag_search_function.sql`

**操作**:
1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `supabase_rag_search_function.sql` 中的所有 SQL 代码
3. 点击 **Run** 执行

**验证**:
```sql
SELECT proname FROM pg_proc WHERE proname = 'match_content_feed_vectors';
```

---

## 🔧 步骤 3: 配置环境变量

在 `.env.local` 中添加（如果还没有）：

```bash
# DeepSeek API Key（用于生成向量嵌入）
DEEPSEEK_API_KEY=sk-...

# 内容爬取 API Key（用于保护 /api/ingest-content 端点）
CONTENT_INGEST_API_KEY=your-secret-key-here
```

---

## ✅ 功能说明

### 1. `/api/feed` - 个性化信息流 API

**功能**: 根据用户画像向量，从内容池中搜索高度相关的内容（相关性 >= 4.5/5）

**请求**:
```
GET /api/feed?limit=10&source_type=reddit
```

**响应**:
```json
{
  "items": [
    {
      "id": 1,
      "source_url": "https://...",
      "source_type": "reddit",
      "content_text": "...",
      "published_at": "2024-01-01T00:00:00Z",
      "relevance_score": 4.7
    }
  ],
  "count": 10
}
```

### 2. `/api/ingest-content` - 内容爬取 API

**功能**: 爬取 X、Reddit、期刊等内容，生成向量嵌入并存储

**请求**:
```bash
POST /api/ingest-content
Authorization: Bearer YOUR_CONTENT_INGEST_API_KEY
Content-Type: application/json

{
  "sourceType": "reddit",
  "limit": 10
}
```

**响应**:
```json
{
  "success": true,
  "processed": 10,
  "results": [
    { "status": "inserted", "url": "https://..." },
    { "status": "updated", "url": "https://..." }
  ]
}
```

---

## 🎯 使用流程

### 1. 首次设置

1. 执行 SQL 脚本创建表和函数
2. 配置环境变量
3. 调用 `/api/user/persona` 生成用户画像向量
4. 调用 `/api/ingest-content` 爬取初始内容

### 2. 定期更新

- 设置定时任务（Vercel Cron 或 Supabase pg_cron）定期调用 `/api/ingest-content`
- 用户每次访问信息流时，自动使用最新的用户画像向量进行搜索

---

## 📊 数据流程

```
用户画像向量 (user_persona_embedding)
    ↓
RAG 搜索 (match_content_feed_vectors)
    ↓
过滤 (relevance_score >= 4.5)
    ↓
返回给用户
```

---

## 🐛 故障排除

### 问题 1: "用户画像向量未生成"

**解决方案**: 调用 `POST /api/user/persona` 生成用户画像向量

### 问题 2: "RPC 函数不存在"

**解决方案**: 执行 `supabase_rag_search_function.sql`

### 问题 3: 没有返回内容

**可能原因**:
- 内容池为空（需要先爬取内容）
- 相关性阈值太高（4.5/5）
- 用户画像向量与内容不匹配

**解决方案**:
- 先调用 `/api/ingest-content` 爬取内容
- 检查用户画像向量是否正确生成

---

## 📝 下一步

完成设置后，可以：
1. 实现前端信息流展示组件
2. 设置定时爬取任务
3. 优化相关性阈值（根据实际效果调整）

