-- User Feedback Table for Content Recommendations
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_feed_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL,
    content_url TEXT,
    content_title TEXT,
    source TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bookmark', 'dislike', 'like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id, feedback_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_feed_feedback_user ON user_feed_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feed_feedback_type ON user_feed_feedback(feedback_type);

-- Enable Row Level Security
ALTER TABLE user_feed_feedback ENABLE ROW LEVEL SECURITY;

-- Users can manage their own feedback
CREATE POLICY "Users can view own feedback" ON user_feed_feedback
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON user_feed_feedback
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" ON user_feed_feedback
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
