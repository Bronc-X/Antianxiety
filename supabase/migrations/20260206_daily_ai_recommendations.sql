-- Create daily AI recommendations table
-- Stores 3-4 adaptive recommendations generated asynchronously

CREATE TABLE IF NOT EXISTS daily_ai_recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_date date NOT NULL,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_ai_recommendations_user_date_idx
  ON daily_ai_recommendations(user_id, recommendation_date);

ALTER TABLE daily_ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily recommendations"
  ON daily_ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily recommendations"
  ON daily_ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily recommendations"
  ON daily_ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
