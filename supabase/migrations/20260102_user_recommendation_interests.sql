-- Migration: Create user_recommendation_interests table
-- Records user interactions with health recommendations for personalization

CREATE TABLE IF NOT EXISTS user_recommendation_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_id TEXT NOT NULL,
    recommendation_title TEXT NOT NULL,
    recommendation_category TEXT, -- anxiety, depression, sleep, stress, general
    interaction_type TEXT DEFAULT 'ask_max', -- ask_max, save, dismiss
    max_explanation TEXT, -- Store Max's explanation
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_recommendation_interests_user_id 
    ON user_recommendation_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_interests_category 
    ON user_recommendation_interests(recommendation_category);

-- RLS Policies
ALTER TABLE user_recommendation_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendation interests"
    ON user_recommendation_interests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendation interests"
    ON user_recommendation_interests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendation interests"
    ON user_recommendation_interests FOR DELETE
    USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE user_recommendation_interests IS 'Tracks user interactions with health recommendations for personalization';
