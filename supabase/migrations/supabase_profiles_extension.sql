-- ============================================
-- 扩展 profiles 表以符合 README 要求
-- 添加 user_persona_embedding 字段（用于 RAG）
-- ============================================

-- 添加 user_persona_embedding 字段（向量类型）
-- 注意：需要先启用 pgvector 扩展
-- CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_persona_embedding vector(1536); -- 用户画像向量（用于 RAG 搜索）

-- 添加其他 README 要求的字段（如果尚未存在）
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh' CHECK (language IN ('en', 'zh'));

-- 添加注释
COMMENT ON COLUMN public.profiles.user_persona_embedding IS '由 AI 生成的、总结用户核心画像的向量（用于 RAG）';
COMMENT ON COLUMN public.profiles.full_name IS '用户全名';
COMMENT ON COLUMN public.profiles.avatar_url IS '用户头像 URL';
COMMENT ON COLUMN public.profiles.language IS '用户语言偏好（en 或 zh）';

-- 创建向量索引（用于快速相似度搜索）
CREATE INDEX IF NOT EXISTS idx_profiles_user_persona_embedding ON public.profiles 
USING hnsw (user_persona_embedding vector_cosine_ops);

