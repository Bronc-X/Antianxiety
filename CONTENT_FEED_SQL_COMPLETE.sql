-- ============================================
-- 个性化信息推送功能 SQL 脚本
-- 包含：content_feed_vectors 表和 RAG 搜索函数
-- ============================================
-- 
-- 执行顺序：
-- 1. 创建 content_feed_vectors 表
-- 2. 创建 RAG 搜索函数
-- 
-- 注意：确保已启用 pgvector 扩展
-- ============================================

-- ============================================
-- 第一部分：创建 content_feed_vectors 表
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_feed_vectors (
  id BIGSERIAL PRIMARY KEY,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536),
  relevance_score DECIMAL(3,2),
  published_at TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_url)
);

COMMENT ON TABLE public.content_feed_vectors IS 'RAG 内容池（向量表），存储从外部来源爬取的内容';
COMMENT ON COLUMN public.content_feed_vectors.source_url IS '来源 URL（例如：Reddit/X 链接）';
COMMENT ON COLUMN public.content_feed_vectors.source_type IS '来源类型：x, reddit, journal, research_institution, university';
COMMENT ON COLUMN public.content_feed_vectors.content_text IS '帖子/论文摘要';
COMMENT ON COLUMN public.content_feed_vectors.embedding IS '内容文本的向量嵌入（用于相似度搜索）';
COMMENT ON COLUMN public.content_feed_vectors.relevance_score IS '相关性评分（0.00-5.00），用于过滤低相关性内容';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_source_type ON public.content_feed_vectors(source_type);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_relevance_score ON public.content_feed_vectors(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_published_at ON public.content_feed_vectors(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_crawled_at ON public.content_feed_vectors(crawled_at DESC);

-- 创建向量索引（使用 HNSW 算法）
CREATE INDEX IF NOT EXISTS idx_content_feed_vectors_embedding ON public.content_feed_vectors 
USING hnsw (embedding vector_cosine_ops);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.content_feed_vectors ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：所有认证用户都可以查看内容（用于 RAG 搜索）
DROP POLICY IF EXISTS "Authenticated users can view content feed" ON public.content_feed_vectors;
CREATE POLICY "Authenticated users can view content feed"
  ON public.content_feed_vectors
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 为 content_feed_vectors 表添加 updated_at 触发器
CREATE OR REPLACE FUNCTION update_content_feed_vectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_content_feed_vectors_updated_at ON public.content_feed_vectors;
CREATE TRIGGER update_content_feed_vectors_updated_at
  BEFORE UPDATE ON public.content_feed_vectors
  FOR EACH ROW
  EXECUTE FUNCTION update_content_feed_vectors_updated_at();

-- ============================================
-- 第二部分：创建 RAG 搜索函数
-- ============================================

CREATE OR REPLACE FUNCTION public.match_content_feed_vectors(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10,
  source_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  source_url text,
  source_type text,
  content_text text,
  published_at timestamptz,
  relevance_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cfv.id,
    cfv.source_url,
    cfv.source_type,
    cfv.content_text,
    cfv.published_at,
    -- 计算余弦相似度并转换为 0-5 范围
    (1 - (cfv.embedding <=> query_embedding)) * 5.0 AS relevance_score
  FROM public.content_feed_vectors cfv
  WHERE
    cfv.embedding IS NOT NULL
    AND (1 - (cfv.embedding <=> query_embedding)) >= match_threshold
    AND (source_type_filter IS NULL OR cfv.source_type = source_type_filter)
  ORDER BY cfv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_content_feed_vectors IS 'RAG 搜索函数：根据查询向量查找相似内容';

-- ============================================
-- 执行完成！
-- ============================================
-- 
-- 验证：执行以下 SQL 确认表和函数已创建
-- 
-- 1. 验证表：
-- SELECT * FROM information_schema.tables WHERE table_name = 'content_feed_vectors';
-- 
-- 2. 验证函数：
-- SELECT proname FROM pg_proc WHERE proname = 'match_content_feed_vectors';
-- ============================================

