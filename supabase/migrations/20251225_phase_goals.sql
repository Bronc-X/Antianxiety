-- Phase Goals Table
-- Stores user's short-term health goals for the Digital Twin system

CREATE TABLE IF NOT EXISTS phase_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'habits',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phase_goals_user ON phase_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_goals_category ON phase_goals(category);
CREATE INDEX IF NOT EXISTS idx_phase_goals_active ON phase_goals(user_id, is_completed) WHERE NOT is_completed;

-- Enable RLS
ALTER TABLE phase_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_phase_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS phase_goals_updated_at ON phase_goals;
CREATE TRIGGER phase_goals_updated_at
    BEFORE UPDATE ON phase_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_phase_goals_updated_at();

-- Comment
COMMENT ON TABLE phase_goals IS 'User phase goals for the Digital Twin system. Goals are synced to unified_user_profiles for personalized recommendations.';
