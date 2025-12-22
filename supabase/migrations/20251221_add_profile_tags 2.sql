-- Migration: Add tags field to profiles table
-- Purpose: Store user health assessment tags for recommendation filtering
-- Date: 2025-12-21

-- Add tags JSONB column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add assessment_history JSONB column for tracking assessment results
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS assessment_history JSONB DEFAULT '[]'::jsonb;

-- Add last_assessment_at timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_assessment_at TIMESTAMPTZ;

-- Create index for efficient tag-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_tags 
ON profiles USING GIN (tags);

-- Comment for documentation
COMMENT ON COLUMN profiles.tags IS 'User health tags from HealthAssessmentEngine, e.g., ["高皮质醇风险", "中心性肥胖"]';
COMMENT ON COLUMN profiles.assessment_history IS 'History of health assessment results for trend analysis';
COMMENT ON COLUMN profiles.last_assessment_at IS 'Timestamp of most recent health assessment';

-- RLS policy: users can only update their own tags
-- (Assuming existing RLS policies already cover this via user_id)

-- Example tags that can be stored:
-- - 高皮质醇风险 (High Cortisol Risk)
-- - 重度焦虑 (Severe Anxiety)
-- - 中心性肥胖 (Central Obesity)
-- - 代谢低谷期 (Metabolic Decline)
-- - 亚健康状态 (Sub-Health Status)
-- - 慢性疲劳 (Chronic Fatigue)
-- - 免疫力差 (Weak Immunity)
-- - 压力型肥胖 (Stress Belly Syndrome)
-- - 激素衰退型 (Hormonal Decline)
