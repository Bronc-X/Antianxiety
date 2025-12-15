-- ============================================
-- AntiAnxiety Backend Upgrade SQL Migration
-- AntiAnxiety - 用户记忆系统 + 混合搜索
-- ============================================

-- 1. 启用 pgvector 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建 user_memories 表
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 添加表注释
COMMENT ON TABLE user_memories IS '用户记忆表 - 存储用户与AI交互中的重要信息片段';
COMMENT ON COLUMN user_memories.content IS '记忆内容文本';
COMMENT ON COLUMN user_memories.embedding IS 'OpenAI text-embedding-ada-002 生成的1536维向量';
COMMENT ON COLUMN user_memories.metadata IS 'JSONB元数据: emotion_tags, consensus_score, source_type';

-- 4. 创建索引
-- 用户ID索引（快速过滤用户记忆）
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);

-- 创建时间索引（按时间排序）
CREATE INDEX IF NOT EXISTS idx_user_memories_created_at ON user_memories(created_at DESC);


-- 向量相似度索引（IVFFlat - 适合中等规模数据）
-- 注意：需要先有一些数据才能创建此索引，或使用 HNSW
CREATE INDEX IF NOT EXISTS idx_user_memories_embedding ON user_memories 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. 启用 RLS（行级安全）
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
-- 用户只能查看自己的记忆
DROP POLICY IF EXISTS "Users can view own memories" ON user_memories;
CREATE POLICY "Users can view own memories" ON user_memories
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的记忆
DROP POLICY IF EXISTS "Users can insert own memories" ON user_memories;
CREATE POLICY "Users can insert own memories" ON user_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的记忆
DROP POLICY IF EXISTS "Users can update own memories" ON user_memories;
CREATE POLICY "Users can update own memories" ON user_memories
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的记忆
DROP POLICY IF EXISTS "Users can delete own memories" ON user_memories;
CREATE POLICY "Users can delete own memories" ON user_memories
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_user_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_memories_updated_at ON user_memories;
CREATE TRIGGER trigger_user_memories_updated_at
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memories_updated_at();

-- ============================================
-- 验证脚本执行成功
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ AntiAnxiety upgrade completed successfully!';
    RAISE NOTICE '   - pgvector extension enabled';
    RAISE NOTICE '   - user_memories table created';
    RAISE NOTICE '   - Indexes created';
    RAISE NOTICE '   - RLS policies applied';
END $$;


-- ============================================
-- PART 2: Hybrid Search Function
-- 混合搜索算法：(Similarity * 0.6) + (Authority * 0.4)
-- ============================================

-- 创建 hybrid_search RPC 函数
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    similarity_weight FLOAT DEFAULT 0.6,
    authority_weight FLOAT DEFAULT 0.4
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity_score FLOAT,
    consensus_score FLOAT,
    final_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        um.content,
        um.metadata,
        -- 计算余弦相似度（1 - 距离）
        (1 - (um.embedding <=> query_embedding))::FLOAT AS similarity_score,
        -- 从 metadata 中提取 consensus_score，如果为 null 则默认为 0
        COALESCE((um.metadata->>'consensus_score')::FLOAT, 0)::FLOAT AS consensus_score,
        -- 混合评分公式
        (
            (1 - (um.embedding <=> query_embedding)) * similarity_weight + 
            COALESCE((um.metadata->>'consensus_score')::FLOAT, 0) * authority_weight
        )::FLOAT AS final_score
    FROM user_memories um
    -- 只返回当前认证用户的记忆
    WHERE um.user_id = auth.uid()
    -- 按混合评分降序排序
    ORDER BY final_score DESC
    -- 限制返回数量
    LIMIT match_count;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION hybrid_search IS '混合搜索函数 - 结合语义相似度和科学权威评分检索用户记忆';

-- 授予执行权限
GRANT EXECUTE ON FUNCTION hybrid_search TO authenticated;

-- ============================================
-- 验证 hybrid_search 函数创建成功
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ hybrid_search function created successfully!';
    RAISE NOTICE '   - Formula: (similarity * 0.6) + (consensus * 0.4)';
    RAISE NOTICE '   - Handles null consensus_score (defaults to 0)';
    RAISE NOTICE '   - Filters by authenticated user';
END $$;
