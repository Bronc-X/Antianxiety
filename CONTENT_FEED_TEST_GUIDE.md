# 个性化信息推送功能测试指南

## 📋 测试前准备

### 1. 验证 SQL 执行成功

在 Supabase SQL Editor 中执行以下验证 SQL：

```sql
-- 验证表是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'content_feed_vectors';

-- 验证函数是否存在
SELECT proname FROM pg_proc 
WHERE proname = 'match_content_feed_vectors';

-- 验证表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content_feed_vectors';
```

**预期结果**:
- 表 `content_feed_vectors` 存在
- 函数 `match_content_feed_vectors` 存在
- 表包含以下列：id, source_url, source_type, content_text, embedding, published_at 等

---

## 🔧 步骤 1: 生成用户画像向量

### 方法 1: 通过 API 调用（推荐）

**前提条件**: 确保已登录 Web 应用

**操作**:
1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 执行以下代码：

```javascript
// 调用用户画像生成 API
fetch('/api/user/persona', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(res => res.json())
.then(data => {
  console.log('用户画像生成结果:', data);
  if (data.success) {
    console.log('✅ 用户画像向量已生成');
  } else {
    console.error('❌ 生成失败:', data.error);
  }
})
.catch(err => console.error('请求失败:', err));
```

**预期结果**:
```json
{
  "success": true,
  "message": "用户画像向量已更新"
}
```

### 方法 2: 通过 Supabase Dashboard 验证

在 Supabase SQL Editor 中执行：

```sql
-- 检查用户是否有画像向量
SELECT 
  id,
  full_name,
  user_persona_embedding IS NOT NULL as has_embedding,
  array_length(user_persona_embedding, 1) as embedding_dimension
FROM profiles
WHERE id = auth.uid();
```

**预期结果**: `has_embedding` 应为 `true`，`embedding_dimension` 应为 `1536`

---

## 🔧 步骤 2: 爬取测试内容

### ⚠️ 重要提示

`/api/ingest-content` API 需要 API Key 保护。有两种方式：

**方式 A（推荐）**: 配置环境变量后调用
**方式 B**: 手动插入测试数据（跳过爬取 API）

---

### 方法 1: 配置 API Key 后调用（推荐用于生产环境）

**步骤 1**: 在 `.env.local` 中添加：
```bash
CONTENT_INGEST_API_KEY=your-secret-key-here
```

**步骤 2**: 重启开发服务器

**步骤 3**: 在浏览器 Console 中执行：

```javascript
// 爬取 Reddit 内容（测试）
const API_KEY = 'your-secret-key-here'; // 使用上面配置的 key

fetch('/api/ingest-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    sourceType: 'reddit',
    limit: 5, // 先爬取 5 条测试
  }),
})
.then(res => res.json())
.then(data => {
  console.log('内容爬取结果:', data);
  if (data.success) {
    console.log(`✅ 成功处理 ${data.processed} 条内容`);
    console.log('结果详情:', data.results);
  } else {
    console.error('❌ 爬取失败:', data.error);
  }
})
.catch(err => console.error('请求失败:', err));
```

**注意**: 当前 `/api/ingest-content` 中的爬取函数是占位符，需要实现真实的爬取逻辑。

**预期结果**:
```json
{
  "success": true,
  "processed": 5,
  "results": [
    { "status": "inserted", "url": "https://..." },
    ...
  ]
}
```

### 方法 2: 手动插入测试数据（如果爬取 API 不可用）

在 Supabase SQL Editor 中执行：

```sql
-- 插入测试内容（需要先有 embedding）
-- 注意：这里使用零向量作为示例，实际应该使用真实的 embedding
INSERT INTO content_feed_vectors (
  source_url,
  source_type,
  content_text,
  embedding,
  published_at
) VALUES (
  'https://www.reddit.com/r/test/post1',
  'reddit',
  '测试内容：关于健康习惯养成的讨论。如何通过最小阻力原则建立长期习惯？',
  -- 使用零向量（实际应该使用 generateEmbedding 生成）
  (SELECT array_agg(0.0) FROM generate_series(1, 1536))::vector(1536),
  NOW()
),
(
  'https://www.reddit.com/r/test/post2',
  'reddit',
  '测试内容：贝叶斯信念循环在习惯养成中的应用。如何量化信心增强？',
  (SELECT array_agg(0.0) FROM generate_series(1, 1536))::vector(1536),
  NOW()
)
ON CONFLICT (source_url) DO NOTHING;

-- 验证插入成功
SELECT COUNT(*) as total_content FROM content_feed_vectors;
```

**注意**: 使用零向量会导致相关性分数为 0，仅用于测试表结构。实际使用时需要真实的 embedding。

---

## 🔧 步骤 3: 验证内容池数据

在 Supabase SQL Editor 中执行：

```sql
-- 查看内容池中的数据
SELECT 
  id,
  source_type,
  LEFT(content_text, 50) as content_preview,
  published_at,
  embedding IS NOT NULL as has_embedding
FROM content_feed_vectors
ORDER BY created_at DESC
LIMIT 10;
```

**预期结果**: 应该能看到刚才插入或爬取的内容

---

## 🔧 步骤 4: 测试 RAG 搜索函数

### 方法 1: 在 Supabase SQL Editor 中测试

```sql
-- 获取用户画像向量
DO $$
DECLARE
  user_embedding vector(1536);
BEGIN
  -- 获取当前用户的画像向量
  SELECT user_persona_embedding INTO user_embedding
  FROM profiles
  WHERE id = auth.uid();
  
  -- 如果用户没有画像向量，使用零向量测试
  IF user_embedding IS NULL THEN
    RAISE NOTICE '用户画像向量不存在，使用零向量测试';
    user_embedding := (SELECT array_agg(0.0) FROM generate_series(1, 1536))::vector(1536);
  END IF;
  
  -- 测试 RAG 搜索
  PERFORM * FROM match_content_feed_vectors(
    query_embedding := user_embedding,
    match_threshold := 0.8, -- 对应 4.0/5.0
    match_count := 10,
    source_type_filter := NULL
  );
END $$;
```

### 方法 2: 直接调用函数查看结果

```sql
-- 获取用户画像向量并测试搜索
WITH user_embedding AS (
  SELECT COALESCE(
    user_persona_embedding,
    (SELECT array_agg(0.0) FROM generate_series(1, 1536))::vector(1536)
  ) as embedding
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1
)
SELECT 
  id,
  source_type,
  LEFT(content_text, 100) as content_preview,
  relevance_score
FROM user_embedding,
LATERAL match_content_feed_vectors(
  query_embedding := user_embedding.embedding,
  match_threshold := 0.9, -- 对应 4.5/5.0（readme.md 要求）
  match_count := 10,
  source_type_filter := NULL
)
ORDER BY relevance_score DESC;
```

**预期结果**: 返回相关性 >= 4.5/5.0 的内容列表

---

## 🚀 快速测试（推荐）

### 使用测试脚本（最简单）

1. 在浏览器中打开 Web 应用并登录
2. 打开开发者工具（F12）→ Console
3. 复制 `test-content-feed.js` 文件内容并粘贴到 Console 中执行
4. 执行 `runFullTest()` 运行完整测试

**或者** 在 Console 中逐个执行：
```javascript
// 1. 生成用户画像向量
await testGeneratePersona();

// 2. 获取信息流
await testGetFeed(10);

// 3. 运行完整测试
await runFullTest();
```

---

## 🔧 步骤 5: 测试前端展示

### 方法 1: 在 Dashboard 页面查看

1. 登录 Web 应用
2. 导航到 Dashboard 页面 (`/dashboard`)
3. 滚动到 **"个性化信息流"** 板块
4. 观察是否显示内容

**预期行为**:
- 如果用户画像向量已生成且内容池有数据：显示相关内容列表
- 如果用户画像向量未生成：显示 "用户画像向量未生成，请先完成个人资料设置"
- 如果内容池为空：显示 "暂无相关内容"

### 方法 2: 通过浏览器开发者工具测试 API

1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 刷新 Dashboard 页面
4. 查找 `/api/feed` 请求
5. 查看响应内容

**预期响应**:
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
  "count": 1
}
```

### 方法 3: 直接调用 API 测试

在浏览器 Console 中执行：

```javascript
// 测试信息流 API
fetch('/api/feed?limit=10')
  .then(res => res.json())
  .then(data => {
    console.log('信息流数据:', data);
    if (data.items && data.items.length > 0) {
      console.log(`✅ 成功获取 ${data.items.length} 条内容`);
      data.items.forEach((item, index) => {
        console.log(`${index + 1}. [${item.source_type}] ${item.relevance_score}/5.0 - ${item.content_text.substring(0, 50)}...`);
      });
    } else {
      console.log('⚠️ 没有相关内容');
      if (data.message) {
        console.log('提示:', data.message);
      }
    }
  })
  .catch(err => console.error('请求失败:', err));
```

### 方法 4: Feed 状态 API 自检

1. 登录 Web 应用后，直接访问 `http://localhost:3000/api/feed/status`
2. 响应中会返回：
   - `totalCount`：内容池总量
   - `summaryBySource`：各来源最近抓取数量、最新抓取时间、示例链接
   - `latestItems`：最近 25 条抓取记录
3. 需要按来源过滤时，可访问 `http://localhost:3000/api/feed/status?source_type=reddit`、`...=x` 等

**用途**：快速确认爬虫/内容入库是否运行、是否覆盖期望来源，以及最近是否有新内容入库。

---

## 🔧 步骤 6: 验证相关性过滤（4.5/5.0 阈值）

### 在 Supabase SQL Editor 中验证

```sql
-- 检查所有内容的相关性分数分布
WITH user_embedding AS (
  SELECT COALESCE(
    user_persona_embedding,
    (SELECT array_agg(0.0) FROM generate_series(1, 1536))::vector(1536)
  ) as embedding
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1
)
SELECT 
  COUNT(*) as total_matched,
  COUNT(*) FILTER (WHERE relevance_score >= 4.5) as above_threshold,
  AVG(relevance_score) as avg_score,
  MIN(relevance_score) as min_score,
  MAX(relevance_score) as max_score
FROM user_embedding,
LATERAL match_content_feed_vectors(
  query_embedding := user_embedding.embedding,
  match_threshold := 0.0, -- 降低阈值以查看所有结果
  match_count := 100,
  source_type_filter := NULL
);
```

**预期结果**: 
- `above_threshold` 应该只包含相关性 >= 4.5 的内容
- 前端应该只显示 `above_threshold` 的内容

---

## 🐛 常见问题排查

### 问题 1: "用户画像向量未生成"

**症状**: API 返回 `"用户画像向量未生成，请先完成个人资料设置"`

**解决方案**:
1. 确保用户已填写个人资料（年龄、主要关注、活动水平等）
2. 调用 `POST /api/user/persona` 生成画像向量
3. 验证 `profiles.user_persona_embedding` 不为 NULL

### 问题 2: "暂无相关内容"

**症状**: 前端显示 "暂无相关内容"

**可能原因**:
1. 内容池为空（需要先爬取内容）
2. 相关性分数都 < 4.5/5.0（阈值太高）
3. 用户画像向量与内容不匹配

**解决方案**:
1. 检查内容池是否有数据：`SELECT COUNT(*) FROM content_feed_vectors;`
2. 检查相关性分数分布（见步骤 6）
3. 如 API 响应包含 `personalization.fallback` 字段且值为 `latest`/`trending`，说明系统已自动回退至最新内容或精选热议；继续完善个人资料或等待内容池更新即可
4. 如果相关性分数普遍较低，考虑：
   - 降低阈值（修改 `RELEVANCE_THRESHOLD` 常量）
   - 优化用户画像生成逻辑
   - 爬取更多相关内容

### 问题 3: "RPC 函数不存在"

**症状**: API 返回错误或使用备用搜索方案

**解决方案**:
1. 验证函数是否存在：`SELECT proname FROM pg_proc WHERE proname = 'match_content_feed_vectors';`
2. 如果不存在，重新执行 `CONTENT_FEED_SQL_COMPLETE.sql`

### 问题 4: 内容爬取 API 返回 401/403

**症状**: `/api/ingest-content` 返回未授权错误

**解决方案**:
1. 检查 API 是否需要 API Key
2. 查看 `app/api/ingest-content/route.ts` 中的认证逻辑
3. 如果需要，配置 `CONTENT_INGEST_API_KEY` 环境变量

---

## ✅ 测试检查清单

- [ ] SQL 表和函数已创建
- [ ] 用户画像向量已生成
- [ ] 内容池中有数据（至少 1 条）
- [ ] RAG 搜索函数可以正常调用
- [ ] 前端可以显示信息流
- [ ] 相关性过滤正常工作（只显示 >= 4.5/5.0）
- [ ] 不同来源类型可以正确显示（X, Reddit, 期刊等）
- [ ] 错误处理正常（无向量、无内容等情况）

---

## 📝 下一步优化建议

完成基础测试后，可以考虑：

1. **优化内容爬取**:
   - 实现真实的 Reddit/X API 集成
   - 添加期刊和研究机构的内容源
   - 设置定时爬取任务（Vercel Cron）

2. **优化相关性计算**:
   - 根据实际效果调整阈值
   - 添加用户反馈机制（标记内容是否相关）

3. **优化前端体验**:
   - 添加加载更多功能
   - 添加来源类型筛选
   - 添加内容预览和展开功能

4. **性能优化**:
   - 添加缓存机制
   - 优化向量索引
   - 限制查询数量

