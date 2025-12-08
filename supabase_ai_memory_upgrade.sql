-- ============================================
-- AI 记忆表升级脚本
-- 添加缺失的 role 和 metadata 字段
-- 执行时间: 2025-12-07
-- ============================================

-- 1. 添加 role 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_memory' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.ai_memory 
    ADD COLUMN role TEXT DEFAULT 'user';
    
    COMMENT ON COLUMN public.ai_memory.role IS '消息角色: user(用户) 或 assistant(AI助手)';
    
    RAISE NOTICE '✅ 已添加 role 字段';
  ELSE
    RAISE NOTICE '⏭️ role 字段已存在，跳过';
  END IF;
END $$;

-- 2. 添加 metadata 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_memory' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.ai_memory 
    ADD COLUMN metadata JSONB DEFAULT NULL;
    
    COMMENT ON COLUMN public.ai_memory.metadata IS '元数据: 模型名称、token数、论文数量等';
    
    RAISE NOTICE '✅ 已添加 metadata 字段';
  ELSE
    RAISE NOTICE '⏭️ metadata 字段已存在，跳过';
  END IF;
END $$;

-- 3. 更新 match_ai_memories 函数以支持 role 字段
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
    COALESCE(am.role, 'user') as role,
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
COMMENT ON FUNCTION public.match_ai_memories IS 'AI 记忆向量搜索函数：根据查询向量查找相似的历史记忆（支持 role 字段）';

-- 4. 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_memory'
ORDER BY ordinal_position;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ AI 记忆表升级完成！';
  RAISE NOTICE '请在 Supabase Dashboard 的 SQL Editor 中执行此脚本';
  RAISE NOTICE '============================================';
END $$;
