# 开发总结 - 爬虫、Reddit 登录、函数生成曲线

## ✅ 已完成的功能

### 1. Reddit OAuth 登录（Web 端）
- ✅ 在登录页面 (`app/login/page.tsx`) 添加了 Reddit 登录按钮
- ✅ 在注册页面 (`app/signup/page.tsx`) 添加了 Reddit 注册按钮
- ✅ 更新了 OAuth 处理函数以支持 Reddit provider
- ✅ 添加了 Reddit 品牌标识（橙色 "R" 图标）

**注意：** 需要在 Supabase Dashboard 中配置 Reddit OAuth：
1. 进入 Supabase Dashboard → Authentication → Providers
2. 启用 Reddit provider
3. 配置 Reddit OAuth App 的 Client ID 和 Client Secret

### 2. 内容爬虫系统
- ✅ 创建了 `/api/ingest-content` API 路由
- ✅ 实现了 Reddit 内容爬取（使用公开 API）
- ✅ 实现了 X (Twitter) 内容爬取框架（需要配置 Twitter API）
- ✅ 实现了期刊内容爬取（使用 PubMed API）
- ✅ 实现了向量嵌入生成和存储
- ✅ 支持批量处理和去重

**功能特点：**
- 支持多种来源类型：`x`, `reddit`, `journal`, `research_institution`, `university`
- 自动生成向量嵌入（使用 OpenAI 兼容的嵌入 API）
- 存储到 `content_feed_vectors` 表
- 支持 API Key 认证保护

**环境变量配置：**
```env
CONTENT_INGEST_API_KEY=your_api_key_here  # 用于保护爬虫 API
DEEPSEEK_API_KEY=your_deepseek_key  # 或使用专门的嵌入 API Key
EMBEDDING_API_URL=https://api.openai.com/v1/embeddings  # 可选，默认使用 OpenAI
EMBEDDING_MODEL=text-embedding-3-small  # 可选，默认使用 text-embedding-3-small
TWITTER_API_KEY=your_twitter_key  # 可选，用于 X 内容爬取
TWITTER_API_SECRET=your_twitter_secret  # 可选
```

### 3. RAG 搜索系统
- ✅ 创建了 `/api/feed` API 路由（个性化信息流）
- ✅ 实现了基于用户画像向量的相似度搜索
- ✅ 创建了 `supabase_rag_search_function.sql` - pgvector 相似度搜索函数
- ✅ 实现了相关性过滤（只返回相关性 >= 4.5/5 的内容）
- ✅ 提供了备用搜索方案（如果 RPC 函数不存在）

**功能特点：**
- 使用 pgvector 进行高效的向量相似度搜索
- 根据用户画像 (`user_persona_embedding`) 进行个性化推荐
- 支持按来源类型过滤
- 自动计算相关性分数

**使用方法：**
```typescript
// 获取个性化信息流
const response = await fetch('/api/feed?limit=10&source_type=reddit');
const data = await response.json();
// data.items 包含相关性 >= 4.5/5 的内容
```

### 4. 贝叶斯函数曲线可视化
- ✅ 创建了 `components/UserMetricsChart.tsx` 组件
- ✅ 展示三个核心指标：
  - 信念曲线分数 (belief_curve_score) - 绿色
  - 信心增强分数 (confidence_score) - 蓝色
  - 身体机能表现分数 (physical_performance_score) - 绿色
- ✅ 使用 Recharts 库进行可视化
- ✅ 自动将数据库中的 0-1 范围转换为 0-100 显示
- ✅ 包含详细的指标说明

**使用方法：**
```typescript
import UserMetricsChart from '@/components/UserMetricsChart';

// 从数据库获取 user_metrics 数据
const { data: metrics } = await supabase
  .from('user_metrics')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: true });

<UserMetricsChart data={metrics} />
```

### 5. 定时任务配置
- ✅ 创建了 `vercel.json` - Vercel Cron 配置（每 6 小时执行内容爬取）
- ✅ 创建了 `supabase_cron_jobs.sql` - pg_cron 定时任务配置
  - 内容爬取任务（每 6 小时）
  - 用户行为分析任务（每晚 22:00）
  - 用户指标更新任务（每小时，备用方案）

**Vercel Cron 配置：**
- 路径：`/api/ingest-content`
- 频率：每 6 小时执行一次
- 需要在 Vercel Dashboard 中启用 Cron Jobs（Pro 计划）

**pg_cron 配置：**
- 需要在 Supabase Dashboard 中启用 pg_cron 扩展
- 执行 `supabase_cron_jobs.sql` 创建定时任务

## 📋 需要用户操作的部分

### 1. Supabase 配置
1. **启用 Reddit OAuth：**
   - Supabase Dashboard → Authentication → Providers → Reddit
   - 配置 Reddit OAuth App 的 Client ID 和 Secret

2. **执行数据库迁移：**
   ```sql
   -- 1. 启用扩展
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   -- 2. 执行之前创建的 SQL 文件
   -- supabase_rag_search_function.sql
   -- supabase_cron_jobs.sql
   ```

3. **配置环境变量：**
   - 在 Supabase Dashboard 中设置 `app.content_ingest_api_key`（用于 pg_cron 调用）

### 2. Vercel 配置
1. **环境变量：**
   ```env
   CONTENT_INGEST_API_KEY=your_secure_api_key
   DEEPSEEK_API_KEY=your_deepseek_key
   EMBEDDING_API_URL=https://api.openai.com/v1/embeddings  # 可选
   EMBEDDING_MODEL=text-embedding-3-small  # 可选
   TWITTER_API_KEY=your_twitter_key  # 可选
   TWITTER_API_SECRET=your_twitter_secret  # 可选
   ```

2. **启用 Cron Jobs：**
   - Vercel Dashboard → Project Settings → Cron Jobs
   - 确保 `vercel.json` 中的配置已生效

### 3. 前端集成
1. **使用 UserMetricsChart 组件：**
   ```typescript
   // 在 dashboard 或 landing 页面中
   import UserMetricsChart from '@/components/UserMetricsChart';
   
   // 获取数据
   const { data: metrics } = await supabase
     .from('user_metrics')
     .select('*')
     .eq('user_id', user.id)
     .order('date', { ascending: true });
   
   // 渲染组件
   <UserMetricsChart data={metrics || []} />
   ```

2. **使用个性化信息流 API：**
   ```typescript
   // 获取个性化内容
   const response = await fetch('/api/feed?limit=10');
   const { items } = await response.json();
   ```

## 🔧 技术细节

### 向量嵌入
- 默认使用 OpenAI 兼容的嵌入 API
- 向量维度：1536（text-embedding-3-small）
- 如果使用 DeepSeek，可能需要调整向量维度

### 爬虫限制
- Reddit：使用公开 API，有速率限制（建议添加延迟）
- X (Twitter)：需要 Twitter API v2 认证
- PubMed：公开 API，无认证要求

### 性能优化
- 批量处理内容（避免单条处理）
- 使用数据库索引优化查询
- 向量搜索使用 HNSW 索引

## 📝 注意事项

1. **Reddit OAuth：** Supabase 需要支持 Reddit provider，如果当前版本不支持，可能需要等待更新或使用自定义 OAuth 流程

2. **Twitter API：** Twitter API v2 需要付费计划，免费计划有严格限制

3. **向量嵌入：** 如果 DeepSeek 不支持嵌入，需要使用其他服务（如 OpenAI、Cohere 等）

4. **定时任务：** pg_cron 在 Supabase 的某些计划中可能不可用，可以使用 Vercel Cron 作为替代

5. **API 保护：** `/api/ingest-content` 使用 API Key 保护，确保设置强密码

## 🎯 下一步建议

1. **测试 Reddit 登录** - 确保 Supabase 支持 Reddit OAuth
2. **配置 Twitter API** - 如果需要爬取 X 内容
3. **测试爬虫** - 手动调用 `/api/ingest-content` 验证功能
4. **集成前端** - 在 dashboard 页面展示 UserMetricsChart
5. **监控定时任务** - 确保定时任务正常执行


