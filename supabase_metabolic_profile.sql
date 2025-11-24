-- =====================================================
-- Migration: Add Metabolic Profile to Profiles Table
-- Purpose: Store onboarding questionnaire results and AI persona context
-- Date: 2025-11-24
-- =====================================================

-- Add metabolic_profile column (JSONB for structured data)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS metabolic_profile JSONB DEFAULT NULL;

-- Add AI persona context (generated from metabolic profile)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_persona_context TEXT DEFAULT NULL;

-- Add onboarding completion timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries on metabolic profile
CREATE INDEX IF NOT EXISTS idx_profiles_metabolic_profile 
ON profiles USING GIN (metabolic_profile);

-- Create index for onboarding completion
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles (onboarding_completed_at);

-- Add comment explaining the structure
COMMENT ON COLUMN profiles.metabolic_profile IS 
'Structured metabolic profile from onboarding questionnaire.
Expected structure: {
  "energy_pattern": "crash_afternoon" | "stable" | "variable",
  "sleep_pattern": "cortisol_imbalance" | "normal" | "occasional_issue",
  "body_pattern": "metabolic_slowdown" | "slight_change" | "healthy",
  "stress_pattern": "low_tolerance" | "medium_tolerance" | "high_tolerance",
  "psychology": "frustrated" | "curious" | "successful",
  "overall_score": 5-15,
  "severity": "high" | "medium" | "low"
}';

COMMENT ON COLUMN profiles.ai_persona_context IS 
'AI-generated persona context based on metabolic_profile. 
Used to inject empathetic context into AI assistant system prompts.';

COMMENT ON COLUMN profiles.onboarding_completed_at IS 
'Timestamp when user completed the onboarding questionnaire.';

-- Grant permissions (if using RLS)
-- Users can read and update their own metabolic profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own metabolic profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own metabolic profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can view their own metabolic profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own metabolic profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================================================
-- Sample Query Examples
-- =====================================================

-- Example 1: Get user's metabolic profile
-- SELECT metabolic_profile, ai_persona_context 
-- FROM profiles 
-- WHERE id = auth.uid();

-- Example 2: Count users by severity level
-- SELECT 
--   metabolic_profile->>'severity' as severity_level,
--   COUNT(*) as user_count
-- FROM profiles 
-- WHERE metabolic_profile IS NOT NULL
-- GROUP BY severity_level;

-- Example 3: Find users with cortisol imbalance
-- SELECT id, metabolic_profile->>'sleep_pattern' as sleep_pattern
-- FROM profiles 
-- WHERE metabolic_profile->>'sleep_pattern' = 'cortisol_imbalance';

-- =====================================================
-- Rollback (if needed)
-- =====================================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS idx_profiles_metabolic_profile;
-- DROP INDEX IF EXISTS idx_profiles_onboarding_completed;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS metabolic_profile;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS ai_persona_context;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed_at;
