-- ============================================
-- RAG 搜索函数（pgvector 相似度搜索）
-- 用于个性化信息流 API
-- ============================================

-- 创建 RPC 函数：匹配内容向量
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


