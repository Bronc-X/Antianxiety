-- Bootstrap additions for clean installs
-- Safe to run multiple times

-- 1) phase_goals (compat schema for onboarding + goals UI)
CREATE TABLE IF NOT EXISTS public.phase_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text,
  priority text,
  title text,
  rationale text,
  citations jsonb DEFAULT '[]'::jsonb,
  is_ai_recommended boolean DEFAULT true,
  user_modified boolean DEFAULT false,
  goal_text text,
  category text,
  target_date date,
  progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phase_goals_user_id ON public.phase_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_goals_category ON public.phase_goals(category);
CREATE INDEX IF NOT EXISTS idx_phase_goals_active ON public.phase_goals(user_id, is_completed) WHERE NOT is_completed;

ALTER TABLE public.phase_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own phase_goals" ON public.phase_goals;
CREATE POLICY "Users can manage own phase_goals"
  ON public.phase_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_phase_goals_fields()
RETURNS trigger AS $$
BEGIN
  IF NEW.goal_text IS NULL AND NEW.title IS NOT NULL THEN
    NEW.goal_text = NEW.title;
  END IF;
  IF NEW.title IS NULL AND NEW.goal_text IS NOT NULL THEN
    NEW.title = NEW.goal_text;
  END IF;
  IF NEW.category IS NULL AND NEW.goal_type IS NOT NULL THEN
    NEW.category = NEW.goal_type;
  END IF;
  IF NEW.goal_type IS NULL AND NEW.category IS NOT NULL THEN
    IF NEW.category IN ('sleep', 'energy', 'weight', 'stress', 'fitness') THEN
      NEW.goal_type = NEW.category;
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_phase_goals_sync ON public.phase_goals;
CREATE TRIGGER trigger_phase_goals_sync
  BEFORE INSERT OR UPDATE ON public.phase_goals
  FOR EACH ROW EXECUTE FUNCTION public.sync_phase_goals_fields();

-- 2) onboarding_answers
CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('template', 'decision_tree')),
  question_text text NOT NULL,
  answer_value text NOT NULL,
  answer_label text,
  sequence_order integer NOT NULL,
  ai_reasoning text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON public.onboarding_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_sequence ON public.onboarding_answers(user_id, sequence_order);

ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own onboarding_answers" ON public.onboarding_answers;
CREATE POLICY "Users can manage own onboarding_answers"
  ON public.onboarding_answers
  FOR ALL USING (auth.uid() = user_id);

-- 3) inquiry_history
CREATE TABLE IF NOT EXISTS public.inquiry_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('diagnostic', 'feed_recommendation')),
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  data_gaps_addressed text[] DEFAULT '{}',
  user_response text,
  responded_at timestamptz,
  delivery_method text NOT NULL CHECK (delivery_method IN ('push', 'in_app')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_history_user_id ON public.inquiry_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_history_pending
  ON public.inquiry_history(user_id, responded_at) WHERE responded_at IS NULL;

ALTER TABLE public.inquiry_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own inquiry_history" ON public.inquiry_history;
CREATE POLICY "Users can manage own inquiry_history"
  ON public.inquiry_history
  FOR ALL USING (auth.uid() = user_id);

-- 4) user_activity_patterns
CREATE TABLE IF NOT EXISTS public.user_activity_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day integer NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  activity_score float DEFAULT 0 CHECK (activity_score >= 0 AND activity_score <= 1),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_activity_patterns_user_time
  ON public.user_activity_patterns(user_id, day_of_week, hour_of_day);

ALTER TABLE public.user_activity_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own activity_patterns" ON public.user_activity_patterns;
CREATE POLICY "Users can manage own activity_patterns"
  ON public.user_activity_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_activity_patterns_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_activity_patterns_updated_at ON public.user_activity_patterns;
CREATE TRIGGER trigger_activity_patterns_updated_at
  BEFORE UPDATE ON public.user_activity_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_activity_patterns_updated_at();

-- 5) curated_feed_queue
CREATE TABLE IF NOT EXISTS public.curated_feed_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('paper', 'article', 'tip')),
  title text NOT NULL,
  summary text,
  url text,
  source text NOT NULL,
  relevance_score float NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
  matched_goals text[] DEFAULT '{}',
  relevance_explanation text,
  is_pushed boolean DEFAULT false,
  pushed_at timestamptz,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, title)
);

CREATE INDEX IF NOT EXISTS idx_curated_feed_user_id ON public.curated_feed_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_curated_feed_unread
  ON public.curated_feed_queue(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_curated_feed_relevance
  ON public.curated_feed_queue(user_id, relevance_score DESC);

ALTER TABLE public.curated_feed_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own curated_feed" ON public.curated_feed_queue;
CREATE POLICY "Users can manage own curated_feed"
  ON public.curated_feed_queue
  FOR ALL USING (auth.uid() = user_id);

-- 6) chat_conversations (for Max history + feedback)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  session_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON public.chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON public.chat_conversations(session_id);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own chat_conversations" ON public.chat_conversations;
CREATE POLICY "Users can manage own chat_conversations"
  ON public.chat_conversations
  FOR ALL USING (auth.uid() = user_id);

-- 7) daily_calibrations
CREATE TABLE IF NOT EXISTS public.daily_calibrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  sleep_quality integer,
  stress_level integer,
  mood_score integer,
  sleep_hours numeric,
  exercise_duration integer,
  meal_quality text,
  water_intake text,
  energy_level integer,
  question_evolution_level integer DEFAULT 1,
  questions_asked jsonb DEFAULT '[]'::jsonb,
  phase_goal_id uuid REFERENCES public.phase_goals(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_calibrations_user_date
  ON public.daily_calibrations(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_calibrations_user_created
  ON public.daily_calibrations(user_id, created_at DESC);

ALTER TABLE public.daily_calibrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own daily_calibrations" ON public.daily_calibrations;
CREATE POLICY "Users can manage own daily_calibrations"
  ON public.daily_calibrations
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_daily_calibrations_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_daily_calibrations_updated_at ON public.daily_calibrations;
CREATE TRIGGER trigger_daily_calibrations_updated_at
  BEFORE UPDATE ON public.daily_calibrations
  FOR EACH ROW EXECUTE FUNCTION public.update_daily_calibrations_updated_at();

-- 8) knowledge_base (for Healthline search)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id bigserial PRIMARY KEY,
  paper_id text UNIQUE,
  title text,
  summary_zh text,
  abstract text,
  url text,
  year integer,
  citation_count integer DEFAULT 0,
  keywords text[] DEFAULT '{}',
  source text DEFAULT 'healthline',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON public.knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_url ON public.knowledge_base(url);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Knowledge base read" ON public.knowledge_base;
CREATE POLICY "Knowledge base read"
  ON public.knowledge_base
  FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Knowledge base write" ON public.knowledge_base;
CREATE POLICY "Knowledge base write"
  ON public.knowledge_base
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_knowledge_base_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER trigger_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_base_updated_at();

-- 9) user_profiles (OAuth provider identities)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text,
  wechat_openid text UNIQUE,
  wechat_unionid text,
  reddit_id text UNIQUE,
  reddit_username text,
  display_name text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own user_profiles" ON public.user_profiles;
CREATE POLICY "Users can manage own user_profiles"
  ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- 10) chat_feedback
CREATE TABLE IF NOT EXISTS public.chat_feedback (
  id bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  feedback text NOT NULL CHECK (feedback IN ('helpful', 'not_helpful', 'report')),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_conversation ON public.chat_feedback(conversation_id);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat feedback service role" ON public.chat_feedback;
CREATE POLICY "Chat feedback service role"
  ON public.chat_feedback
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Chat feedback insert" ON public.chat_feedback;
CREATE POLICY "Chat feedback insert"
  ON public.chat_feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 11) invite_codes (no seed data)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  max_uses int DEFAULT 1,
  current_uses int DEFAULT 0,
  created_by text,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invite codes service role" ON public.invite_codes;
CREATE POLICY "Invite codes service role"
  ON public.invite_codes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Invite codes validation" ON public.invite_codes;
CREATE POLICY "Invite codes validation"
  ON public.invite_codes
  FOR SELECT TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'invite_code_used'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN invite_code_used text;
  END IF;
END $$;

-- 12) belief_sessions view mapped to bayesian_beliefs
CREATE OR REPLACE VIEW public.belief_sessions AS
SELECT
  id,
  user_id,
  prior_score AS prior_value,
  posterior_score AS posterior_value,
  (calculation_details->>'likelihood')::numeric AS likelihood,
  (calculation_details->>'evidence_weight')::numeric AS evidence_weight,
  COALESCE(evidence_stack->'papers', '[]'::jsonb) AS papers_used,
  evidence_stack->'hrv' AS hrv_data,
  belief_context AS belief_text,
  created_at
FROM public.bayesian_beliefs;

-- 13) search_user_memories RPC for semantic search
CREATE OR REPLACE FUNCTION public.search_user_memories(
  p_user_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.content,
    um.metadata,
    1 - (um.embedding <=> query_embedding) AS similarity,
    um.created_at
  FROM public.user_memories um
  WHERE um.user_id = p_user_id
    AND um.embedding IS NOT NULL
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_user_memories(uuid, vector, int) TO authenticated;
