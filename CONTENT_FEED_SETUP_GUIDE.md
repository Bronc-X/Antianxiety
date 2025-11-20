# 个性化信息推送功能设置指南

本指南按照“在哪里输入/替换什么”的顺序写成。只要照着从上到下执行，就能够完成 `content_feed_vectors` 内容池、RAG 搜索函数、API Key、数据爬取以及验证流程。

---

## 0. 前置要求

1. **Supabase 项目**：已有项目并能访问 Dashboard。
2. **本地环境**：Node.js ≥ 18，已 `npm install`。
3. **DeepSeek/OpenAI Key**：至少准备一个用于生成向量（推荐 DeepSeek）。
4. **内容爬取权限**：如果要跑 `/api/ingest-content`，需要自定义一个密钥。

---

## 1. 在 Supabase 创建内容池表

1. 打开 [Supabase Dashboard](https://app.supabase.com/) → 选择项目。
2. 侧边栏点 **SQL Editor** → 新建查询，将 `supabase_content_feed_vectors.sql` **整份内容**复制进去。
3. 如果脚本里有 `CREATE POLICY` 等对象已存在，Supabase 会提示 *already exists*。可以：
   - 首次执行：直接 **Run**。
   - 已存在：跳过 `CREATE TABLE` 和 `CREATE POLICY` 段，只执行“插入示例数据”或你需要的 SQL。
4. 执行后运行下面的校验 SQL，确认表已创建：
   ```sql
   SELECT COUNT(*) 
   FROM information_schema.tables 
   WHERE table_name = 'content_feed_vectors';
   ```
   结果 > 0 即成功。

> **提示**：所有 SQL 都在 Supabase Dashboard → SQL Editor 中执行，不需要在本地终端跑。

---

## 2. 创建 RAG 搜索 RPC 函数

1. 在 SQL Editor 中粘贴 `supabase_rag_search_function.sql`。
2. 点击 **Run**。
3. 用以下 SQL 确认函数存在：
   ```sql
   SELECT proname 
   FROM pg_proc 
   WHERE proname = 'match_content_feed_vectors';
   ```

---

## 3. 本地 `.env.local` 配置

在项目根目录创建 / 编辑 `.env.local`，根据你的实际密钥替换占位符：

```bash
# DeepSeek API Key，用于生成向量嵌入（把 sk-xxx 换成自己的）
DEEPSEEK_API_KEY=sk-your-deepseek-key

# 若使用 OpenAI，可追加：
# OPENAI_API_KEY=sk-your-openai-key

# 自定义内容爬取 API 密钥，任意字符串即可，但务必保密
CONTENT_INGEST_API_KEY=nmw-content-secret
```

> 每次修改 `.env.local` 都要重新运行 `npm run dev` 让变量生效。

---

## 4. 生成用户画像向量（必须）

1. 运行开发服务器：`npm run dev`。
2. 浏览器登录你的账号 → 打开开发者工具（F12）→ Console。
3. 执行：
   ```javascript
   await fetch('/api/user/persona', { method: 'POST' }).then(res => res.json());
   ```
   或者在 `test-content-feed.js` 中执行 `await testGeneratePersona();`
4. 在 SQL Editor 中确认画像向量不为 NULL：
   ```sql
   SELECT id, user_persona_embedding IS NOT NULL AS has_embedding
   FROM profiles
   WHERE email = '你的账号邮箱';
   ```

---

## 5. 注入内容 & 生成向量

### 5.1 通过 `/api/ingest-content`

1. 选择一个源（`reddit`、`x`、`journal` 等）。
2. 在本地终端请求（把 `nmw-content-secret` 换成你在 `.env` 设置的 Key）：
   ```bash
   curl -X POST http://localhost:3000/api/ingest-content \
     -H "Authorization: Bearer nmw-content-secret" \
     -H "Content-Type: application/json" \
     -d '{"sourceType":"reddit","limit":10}'
   ```
3. 响应里会告诉你插入/更新了哪些 URL。

### 5.2 手动插入（可选）

1. 在 SQL Editor 执行：
   ```sql
   INSERT INTO public.content_feed_vectors
     (source_url, source_type, content_text, relevance_score, published_at)
   VALUES
     ('https://www.reddit.com/r/example1', 'reddit', '内容摘要…', 4.7, NOW()),
     ('https://www.research.org/paper', 'journal', '论文摘要…', 4.9, NOW());
   ```
2. 执行脚本或 RPC 生成 embedding（若脚本已封装，会自动处理；否则需调用 `match_content_feed_vectors` 里的嵌入逻辑）。

### 5.3 检查是否有重复 / 缺失向量

```sql
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE embedding IS NULL) AS missing_embeddings
FROM public.content_feed_vectors;
```

如需清理重复 URL，可执行（保留最早一条）：
```sql
DELETE FROM public.content_feed_vectors t
USING public.content_feed_vectors t_dup
WHERE t.source_url = t_dup.source_url
  AND t.id > t_dup.id;
```

---

## 6. 调用 API 验证

### 6.1 个性化信息流 `/api/feed`

请求示例（可在浏览器直接打开）：

```
GET http://localhost:3000/api/feed?limit=10&source_type=reddit
```

期望响应：
```json
{
  "items": [
    {
      "id": 123,
      "source_url": "https://…",
      "source_type": "reddit",
      "content_text": "…",
      "published_at": "2024-05-10T09:00:00Z",
      "relevance_score": 4.8
    }
  ],
  "personalization": {
    "ready": true,
    "reason": "personalized",
    "fallback": "none"
  }
}
```

如果看到 `fallback: "latest"` 或 `ready: false`，说明画像向量缺失或内容池仍空，需要回到步骤 4/5。

### 6.2 内容爬取 `/api/ingest-content`

同 5.1 的请求：确认 `success: true` 且 `processed` 大于 0。

### 6.3 Supabase 状态自检

访问（需登录）：`http://localhost:3000/api/feed/status`。  
返回内容池总数、各来源最新抓取时间、最近 25 条记录。

---

## 7. 运行顺序建议

1. **一次性执行**：步骤 1 → 2 → 3 → 4 → 5。
2. **日常更新**：
   - 定时任务（Vercel Cron、Supabase pg_cron 或 GitHub Action）调用 `/api/ingest-content`。
   - 用户每次登录 Dashboard，`/api/feed` 会自动拉取最新内容。

---

## 8. 常见问题速查

| 现象 | 排查 |
| --- | --- |
| `/api/feed` 返回 `fallback: "latest"` | 检查 `profiles.user_persona_embedding` 是否为 NULL；确认内容池有数据且 embedding 不为空。 |
| Supabase 执行 SQL 报 “policy already exists” | 说明之前已创建，删除旧策略或只执行新增部分。 |
| 重复内容 | 执行上文的 `DELETE ... USING ...` 清理重复 URL；或在 `INSERT` 时给 `source_url` 加 `ON CONFLICT DO NOTHING`。 |
| 向量缺失 | 重新跑生成 embedding 的脚本；或查看 `supabase_rag_search_function.sql` 是否执行成功。 |

---

## 9. 下一步

1. **前端**：确保 `components/PersonalizedFeed.tsx` 已接到 API，并在空状态时提示原因。
2. **监控**：结合 `/api/feed/status` 或 Supabase Logs，观察爬虫是否定期运行。
3. **调优**：根据实际数据调整 `RELEVANCE_THRESHOLD`、内容来源权重、UI 呈现。

这样即可完成“哪里输入什么、替换为自己的值”的端到端设置。若需要脚本或更多示例数据，可以在 `scripts/` 目录查看或再补充。

