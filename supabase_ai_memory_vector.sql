-- ============================================
-- 创建 ai_memory 表（AI 记忆表 - 向量表）
-- 使用 pgvector 扩展存储向量嵌入
-- ============================================

-- 首先需要启用 pgvector 扩展（如果尚未启用）
-- 在 Supabase Dashboard 的 SQL Editor 中运行：
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 创建 ai_memory 表
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL, -- Q 或 A 的文本
  embedding vector(1536), -- OpenAI 嵌入向量维度（1536），DeepSeek 可能不同，需要根据实际调整
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE public.ai_memory IS 'AI 记忆表（向量表），存储每一次与用户的有意义互动，实现"永不SAY HI"';
COMMENT ON COLUMN public.ai_memory.content_text IS '对话内容（问题或回答的文本）';
COMMENT ON COLUMN public.ai_memory.embedding IS '内容文本的向量嵌入（用于相似度搜索）';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_id ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created_at ON public.ai_memory(created_at DESC);

-- 创建向量索引（使用 HNSW 算法，适合高维向量相似度搜索）
-- 注意：需要先启用 pgvector 扩展
CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding ON public.ai_memory 
USING hnsw (embedding vector_cosine_ops);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看、插入、更新和删除自己的记忆
CREATE POLICY "Users can view their own ai memory"
  ON public.ai_memory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai memory"
  ON public.ai_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai memory"
  ON public.ai_memory
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai memory"
  ON public.ai_memory
  FOR DELETE
  USING (auth.uid() = user_id);

-- 为 ai_memory 表添加 updated_at 触发器
CREATE TRIGGER update_ai_memory_updated_at
  BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

