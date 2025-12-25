-- Fix phase_goals table - add missing columns if they don't exist

-- First check if table exists, if not create it
CREATE TABLE IF NOT EXISTS phase_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'phase_goals' AND column_name = 'category'
    ) THEN
        ALTER TABLE phase_goals ADD COLUMN category TEXT NOT NULL DEFAULT 'habits';
    END IF;
END $$;

-- Add target_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'phase_goals' AND column_name = 'target_date'
    ) THEN
        ALTER TABLE phase_goals ADD COLUMN target_date DATE;
    END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_phase_goals_user ON phase_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_goals_category ON phase_goals(category);

-- Enable RLS if not already
ALTER TABLE phase_goals ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own goals" ON phase_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON phase_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON phase_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON phase_goals;

CREATE POLICY "Users can view own goals"
    ON phase_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON phase_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON phase_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON phase_goals FOR DELETE
    USING (auth.uid() = user_id);
