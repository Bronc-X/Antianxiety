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

