-- =============================================
-- RAG系统：向量知识库 Vector Knowledge Base
-- 基于代谢退行性研究数据库
-- =============================================

-- 1. 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建知识库表
CREATE TABLE IF NOT EXISTS public.metabolic_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  
  -- 内容字段
  content TEXT NOT NULL,                    -- 中文内容
  content_en TEXT,                          -- 英文内容
  
  -- 分类和标签
  category TEXT NOT NULL,                   -- 'mechanism', 'intervention', 'food', 'research', 'symptom'
  subcategory TEXT,                         -- 子分类，如 'mitochondrial', 'inflammation'
  tags TEXT[] DEFAULT '{}',                 -- 标签数组，如 ['fatigue', 'ATP', 'exercise']
  
  -- 元数据
  metadata JSONB DEFAULT '{}',              -- 额外信息，如研究引用、数据、时间线
  
  -- 向量嵌入
  embedding vector(1536),                   -- OpenAI text-embedding-3-small 的维度
  
  -- 优先级和质量
  priority INTEGER DEFAULT 1,               -- 1-5，数字越大优先级越高
  quality_score FLOAT DEFAULT 1.0,          -- 0-1，内容质量评分
  
  -- 使用统计
  usage_count INTEGER DEFAULT 0,            -- 被检索使用的次数
  helpful_count INTEGER DEFAULT 0,          -- 用户反馈有用的次数
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 添加表注释
COMMENT ON TABLE public.metabolic_knowledge_base IS 'RAG系统知识库 - 存储代谢健康相关的向量化知识';
COMMENT ON COLUMN public.metabolic_knowledge_base.content IS '中文知识内容';
COMMENT ON COLUMN public.metabolic_knowledge_base.category IS '知识分类：mechanism(机制), intervention(干预), food(食物), research(研究), symptom(症状)';
COMMENT ON COLUMN public.metabolic_knowledge_base.embedding IS 'OpenAI text-embedding-3-small 生成的1536维向量';
COMMENT ON COLUMN public.metabolic_knowledge_base.priority IS '优先级1-5，检索时优先返回高优先级内容';

-- 4. 创建向量索引（IVFFlat - 快速近似搜索）
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_embedding 
ON public.metabolic_knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. 创建常规索引
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_category ON public.metabolic_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_tags ON public.metabolic_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metabolic_knowledge_priority ON public.metabolic_knowledge_base(priority DESC);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_metabolic_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_metabolic_knowledge_updated_at
  BEFORE UPDATE ON public.metabolic_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_metabolic_knowledge_updated_at();

-- 7. 启用行级安全（RLS）
ALTER TABLE public.metabolic_knowledge_base ENABLE ROW LEVEL SECURITY;

-- 8. RLS策略：公开可读（所有用户都能检索知识库）
CREATE POLICY "Knowledge base is publicly readable"
ON public.metabolic_knowledge_base
FOR SELECT
TO authenticated, anon
USING (true);

-- 9. RLS策略：仅管理员可写
CREATE POLICY "Only admins can insert knowledge"
ON public.metabolic_knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Only admins can update knowledge"
ON public.metabolic_knowledge_base
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- 10. 创建相似度搜索函数（核心RAG检索）
CREATE OR REPLACE FUNCTION match_metabolic_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  content text,
  content_en text,
  category text,
  subcategory text,
  tags text[],
  metadata jsonb,
  similarity float,
  priority integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.content_en,
    kb.category,
    kb.subcategory,
    kb.tags,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity,
    kb.priority
  FROM metabolic_knowledge_base kb
  WHERE 
    1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR kb.category = filter_category)
  ORDER BY 
    kb.priority DESC,                      -- 优先级高的优先
    kb.embedding <=> query_embedding       -- 然后按相似度排序
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_metabolic_knowledge IS 'RAG核心函数：根据query向量检索最相关的知识片段';

-- 11. 创建多分类检索函数（同时检索多个类别）
CREATE OR REPLACE FUNCTION match_metabolic_knowledge_multi_category(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_categories text[] DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  content text,
  content_en text,
  category text,
  subcategory text,
  tags text[],
  metadata jsonb,
  similarity float,
  priority integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.content_en,
    kb.category,
    kb.subcategory,
    kb.tags,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity,
    kb.priority
  FROM metabolic_knowledge_base kb
  WHERE 
    1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (
      filter_categories IS NULL 
      OR kb.category = ANY(filter_categories)
    )
  ORDER BY 
    kb.priority DESC,
    kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 12. 创建使用统计更新函数
CREATE OR REPLACE FUNCTION increment_knowledge_usage(
  knowledge_id bigint,
  is_helpful boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE metabolic_knowledge_base
  SET 
    usage_count = usage_count + 1,
    helpful_count = CASE 
      WHEN is_helpful = true THEN helpful_count + 1 
      ELSE helpful_count 
    END
  WHERE id = knowledge_id;
END;
$$;

COMMENT ON FUNCTION increment_knowledge_usage IS '记录知识片段的使用统计和用户反馈';

-- 13. 创建对话历史表（存储用户与AI的对话）
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 对话内容
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',              -- 如使用的知识片段IDs、模型版本等
  
  -- 用户反馈
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'report')),
  feedback_comment TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON public.chat_conversations(created_at DESC);

COMMENT ON TABLE public.chat_conversations IS '用户与AI健康助手的对话历史';

-- 14. RLS策略：用户只能看自己的对话
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 15. 创建对话会话表（管理多轮对话）
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- 会话元数据
  title TEXT,                               -- 会话标题（可自动生成或用户编辑）
  summary TEXT,                             -- 会话摘要
  
  -- 统计
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.chat_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions"
ON public.chat_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 16. 添加session_id到conversations表
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON public.chat_conversations(session_id);

-- 17. 创建示例知识片段（用于测试）
INSERT INTO public.metabolic_knowledge_base (content, content_en, category, subcategory, tags, metadata, priority) VALUES
(
  '线粒体功能障碍是30岁后代谢下降的核心原因。表现为ATP生成减少、氧化应激（ROS）增加，导致易疲劳、耐力下降、恢复慢。',
  'Mitochondrial dysfunction is a core cause of metabolic decline after 30. Manifests as reduced ATP production and increased oxidative stress (ROS), leading to fatigue, decreased endurance, and slow recovery.',
  'mechanism',
  'mitochondrial',
  ARRAY['fatigue', 'ATP', 'ROS', 'mitochondria', 'aging'],
  '{"research": "Błaszczyk 2020, Raza 2024", "age_group": "30+"}'::jsonb,
  5
),
(
  'Zone 2有氧运动（60-70%最大心率）是提升线粒体功能的最佳方式。研究显示，每天30分钟、持续8-12周可提升基础代谢率5-10%。',
  'Zone 2 aerobic exercise (60-70% max HR) is the best way to enhance mitochondrial function. Studies show 30 min daily for 8-12 weeks can increase BMR by 5-10%.',
  'intervention',
  'exercise',
  ARRAY['zone2', 'aerobic', 'BMR', 'mitochondria', 'exercise'],
  '{"research": "Cabo et al. 2024", "timeline": "8-12 weeks", "expected_improvement": "5-10% BMR increase", "dosage": "30 min daily"}'::jsonb,
  5
),
(
  '16:8间歇性禁食可抑制IL-17/TNF炎症通路，改善胰岛素敏感性20-30%。适合腹部脂肪积累、餐后困倦的人群。',
  '16:8 intermittent fasting can suppress IL-17/TNF inflammatory pathways and improve insulin sensitivity by 20-30%. Suitable for abdominal fat accumulation and post-meal drowsiness.',
  'intervention',
  'diet',
  ARRAY['fasting', '16:8', 'insulin', 'inflammation', 'belly_fat'],
  '{"research": "Kwon et al. 2019", "timeline": "12 weeks", "expected_improvement": "20-30% insulin sensitivity", "method": "8pm-12pm fasting window"}'::jsonb,
  5
),
(
  '亚精胺是AI预测的抗衰分子，可诱导自噬、改善线粒体功能。食物来源：小麦胚芽、大豆、发酵奶酪、蘑菇、纳豆。建议每日5-10mg。',
  'Spermidine is an AI-predicted anti-aging molecule that induces autophagy and improves mitochondrial function. Food sources: wheat germ, soybeans, aged cheese, mushrooms, natto. Recommended: 5-10mg daily.',
  'food',
  'anti_aging',
  ARRAY['spermidine', 'autophagy', 'mitochondria', 'anti_aging', 'food'],
  '{"research": "Arora et al. 2024 Nature Aging - AgeXtend", "dosage": "5-10mg daily", "timing": "morning", "food_sources": ["wheat germ", "soybeans", "aged cheese", "mushrooms", "natto"]}'::jsonb,
  4
),
(
  'Omega-3（EPA+DHA）可降低炎症标志物（CRP、IL-6）20-30%，改善大脑健康和情绪。建议每日1-2g EPA+DHA，随餐服用。',
  'Omega-3 (EPA+DHA) can reduce inflammatory markers (CRP, IL-6) by 20-30% and improve brain health and mood. Recommended: 1-2g EPA+DHA daily with meals.',
  'food',
  'anti_inflammatory',
  ARRAY['omega3', 'inflammation', 'brain', 'mood', 'supplement'],
  '{"research": "Izadi et al. 2024", "dosage": "1-2g EPA+DHA daily", "timing": "with meals", "food_sources": ["salmon", "mackerel", "fish oil", "algae oil"]}'::jsonb,
  4
);

-- 18. 显示统计信息
SELECT 
  'Vector knowledge base setup completed!' as status,
  COUNT(*) as sample_knowledge_count
FROM public.metabolic_knowledge_base;

-- =============================================
-- 使用说明
-- =============================================

/*
1. 执行此脚本创建向量数据库和相关表

2. 使用embed_knowledge_base.ts脚本导入完整知识库

3. 在应用中调用match_metabolic_knowledge函数：
   
   SELECT * FROM match_metabolic_knowledge(
     query_embedding := '[0.1, 0.2, ...]'::vector(1536),
     match_threshold := 0.7,
     match_count := 5,
     filter_category := 'intervention'
   );

4. 记录对话历史：
   
   INSERT INTO chat_conversations (user_id, role, content, metadata)
   VALUES (
     'user-uuid',
     'user',
     '为什么我下午三点老是想睡觉？',
     '{"knowledge_used": [1, 2]}'::jsonb
   );

5. 更新知识使用统计：
   
   SELECT increment_knowledge_usage(1, true);
*/
