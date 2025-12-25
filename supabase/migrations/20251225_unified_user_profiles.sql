-- Unified User Profile System
-- Creates a single aggregated profile table with vector embedding for RAG

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create unified user profiles table
CREATE TABLE IF NOT EXISTS unified_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Static profile (aggregated from various sources)
    demographics JSONB DEFAULT '{}'::jsonb,          -- age, gender, height, weight, BMI
    health_goals JSONB DEFAULT '[]'::jsonb,          -- primary goals, phase goals
    lifestyle_factors JSONB DEFAULT '{}'::jsonb,     -- sleep habits, exercise, diet
    health_concerns JSONB DEFAULT '[]'::jsonb,       -- metabolic concerns, symptoms
    
    -- Dynamic profile (continuously updated)
    recent_mood_trend TEXT DEFAULT 'stable',         -- improving/stable/declining
    engagement_pattern JSONB DEFAULT '{}'::jsonb,    -- active hours, preferred content
    ai_inferred_traits JSONB DEFAULT '{}'::jsonb,    -- AI-inferred characteristics
    
    -- Vector representation for RAG
    profile_embedding vector(1536),                  -- OpenAI embedding
    profile_text TEXT,                               -- Source text for embedding
    
    -- Timestamps
    last_aggregated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_unified_profile_user 
    ON unified_user_profiles(user_id);

-- Create vector similarity index (IVFFlat for performance)
-- Note: This requires pgvector extension and at least 1000 rows for optimal performance
-- For smaller datasets, exact search will be used automatically
CREATE INDEX IF NOT EXISTS idx_unified_profile_embedding 
    ON unified_user_profiles 
    USING ivfflat (profile_embedding vector_cosine_ops)
    WITH (lists = 100);

-- Enable RLS
ALTER TABLE unified_user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON unified_user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON unified_user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON unified_user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role can manage all profiles (for background aggregation)
CREATE POLICY "Service role can manage all profiles"
    ON unified_user_profiles FOR ALL
    USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unified_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS unified_profile_updated_at ON unified_user_profiles;
CREATE TRIGGER unified_profile_updated_at
    BEFORE UPDATE ON unified_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_unified_profile_updated_at();

-- Comment for documentation
COMMENT ON TABLE unified_user_profiles IS 'Aggregated user profile for RAG-powered personalization. Combines data from registration, daily logs, chat, and feedback.';
