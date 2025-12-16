-- ============================================
-- 创建 content_feed_vectors 表（RAG 内容池 - 向量表）
-- 用于存储从 X、Reddit、期刊等来源爬取的内容及其向量嵌入
-- ============================================

-- 首先需要启用 pgvector 扩展（如果尚未启用）
-- 在 Supabase Dashboard 的 SQL Editor 中运行：
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 创建 content_feed_vectors 表
CREATE TABLE IF NOT EXISTS public.content_feed_vectors (
  id BIGSERIAL PRIMARY KEY,
  source_url TEXT NOT NULL, -- 来源 URL（例如：Reddit/X 链接）
  source_type TEXT NOT NULL, -- 来源类型：'x', 'reddit', 'journal', 'research_institution', 'university'
  content_text TEXT NOT NULL, -- 帖子/论文摘要
  embedding vector(1536), -- 内容文本的向量嵌入（用于 RAG 搜索）
  relevance_score DECIMAL(3,2), -- 相关性评分（0.00-5.00），由 RAG 系统计算
  published_at TIMESTAMPTZ, -- 原始发布时间
  crawled_at TIMESTAMPTZ DEFAULT NOW(), -- 爬取时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_url) -- 确保每个 URL 只有一条记录
);

-- 添加注释
COMMENT ON TABLE public.content_feed_vectors IS 'RAG 内容池（向量表），存储从外部来源爬取的内容';
COMMENT ON COLUMN public.content_feed_vectors.source_url IS '来源 URL（例如：Reddit/X 链接）';
COMMENT ON COLUMN public.content_feed_vectors.source_type IS '来源类型：x, reddit, journal, research_institution, university';
COMMENT ON COLUMN public.content_feed_vectors.content_text IS '帖子/论文摘要';
COMMENT ON COLUMN public.content_feed_vectors.embedding IS '内容文本的向量嵌入（用于相似度搜索）';
COMMENT ON COLUMN public.content_feed_vectors.relevance_score IS '相关性评分（0.00-5.00），用于过滤低相关性内容';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_source_type ON public.content_feed_vectors(source_type);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_relevance_score ON public.content_feed_vectors(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_published_at ON public.content_feed_vectors(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_crawled_at ON public.content_feed_vectors(crawled_at DESC);

-- 创建向量索引（使用 HNSW 算法，适合高维向量相似度搜索）
-- 注意：需要先启用 pgvector 扩展
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_embedding ON public.content_feed_vectors 
USING hnsw (embedding vector_cosine_ops);

-- 启用 Row Level Security (RLS)
-- 注意：此表是公开的内容池，所有认证用户都可以读取
ALTER TABLE public.content_feed_vectors ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：所有认证用户都可以查看内容（用于 RAG 搜索）
CREATE POLICY "Authenticated users can view content feed"
  ON public.content_feed_vectors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 只有服务角色可以插入、更新和删除（通过后台任务）
-- 注意：这需要在 Supabase Dashboard 中配置服务角色密钥

-- 为 content_feed_vectors 表添加 updated_at 触发器
CREATE TRIGGER update_content_feed_vectors_updated_at
  BEFORE UPDATE ON public.content_feed_vectors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

