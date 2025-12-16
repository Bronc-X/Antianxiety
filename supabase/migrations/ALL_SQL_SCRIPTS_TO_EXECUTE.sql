-- ============================================
-- 所有 SQL 脚本合并文件
-- 按顺序执行以下所有脚本
-- ============================================
-- 
-- 执行顺序：
-- 1. AI 记忆向量搜索函数
-- 2. 贝叶斯函数和触发器
-- 3. 启用 Realtime
-- 
-- 注意：确保已执行 SQL_TO_EXECUTE_FIXED.sql 创建基础表
-- ============================================

-- ============================================
-- 第一部分：AI 记忆向量搜索函数
-- ============================================

CREATE OR REPLACE FUNCTION public.match_ai_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  content_text text,
  role text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.content_text,
    am.role,
    am.created_at,
    1 - (am.embedding <=> query_embedding) AS similarity
  FROM public.ai_memory am
  WHERE
    am.embedding IS NOT NULL
    AND (p_user_id IS NULL OR am.user_id = p_user_id)
    AND (1 - (am.embedding <=> query_embedding)) >= match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_ai_memories IS 'AI 记忆向量搜索函数：根据查询向量查找相似的历史记忆';

-- ============================================
-- 第二部分：贝叶斯函数和触发器
-- ============================================
-- 注意：这部分代码较长，请确保完整复制

CREATE OR REPLACE FUNCTION public.calculate_belief_curve_score(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_belief_score DECIMAL(5,2) := 0.0;
  v_completion_count INTEGER := 0;
  v_total_habits INTEGER := 0;
  v_completion_rate DECIMAL(5,2) := 0.0;
  v_avg_belief_score DECIMAL(5,2) := 0.0;
  v_bayesian_score DECIMAL(5,2) := 0.0;
BEGIN
  SELECT 
    COUNT(DISTINCT hc.habit_id),
    COUNT(DISTINCT h.id)
  INTO v_completion_count, v_total_habits
  FROM public.habits h
  LEFT JOIN public.habit_completions hc 
    ON h.id = hc.habit_id 
    AND hc.user_id = p_user_id
    AND DATE(hc.completed_at) = p_date
  WHERE h.user_id = p_user_id;

  IF v_total_habits = 0 THEN
    RETURN 0.5;
  END IF;

  v_completion_rate := v_completion_count::DECIMAL / v_total_habits::DECIMAL;

  SELECT COALESCE(AVG(h.belief_score), 5.0) / 10.0
  INTO v_avg_belief_score
  FROM public.habits h
  WHERE h.user_id = p_user_id
    AND h.belief_score IS NOT NULL;
  
  IF v_avg_belief_score IS NULL THEN
    v_avg_belief_score := 0.5;
  END IF;

  v_bayesian_score := (v_completion_rate * 0.6 + v_avg_belief_score * 0.4);
  v_belief_score := GREATEST(0.0, LEAST(1.0, v_bayesian_score));

  RETURN v_belief_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_belief_curve_score IS '计算用户的信念曲线分数（基于贝叶斯定理）';

CREATE OR REPLACE FUNCTION public.calculate_confidence_score(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_confidence_score DECIMAL(5,2) := 0.0;
  v_streak_days INTEGER := 0;
  v_consistency_score DECIMAL(5,2) := 0.0;
  v_recent_completion_rate DECIMAL(5,2) := 0.0;
BEGIN
  WITH daily_completions AS (
    SELECT 
      DATE(hc.completed_at) as completion_date,
      COUNT(DISTINCT hc.habit_id) as habits_completed
    FROM public.habit_completions hc
    INNER JOIN public.habits h ON h.id = hc.habit_id
    WHERE hc.user_id = p_user_id
      AND hc.completed_at >= p_date - INTERVAL '7 days'
      AND hc.completed_at < p_date + INTERVAL '1 day'
    GROUP BY DATE(hc.completed_at)
  ),
  streaks AS (
    SELECT 
      completion_date,
      ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn
    FROM daily_completions
    WHERE habits_completed > 0
  )
  SELECT COUNT(*)
  INTO v_streak_days
  FROM streaks
  WHERE rn <= 7;

  SELECT 
    COUNT(DISTINCT DATE(hc.completed_at))::DECIMAL / 7.0
  INTO v_consistency_score
  FROM public.habit_completions hc
  INNER JOIN public.habits h ON h.id = hc.habit_id
  WHERE hc.user_id = p_user_id
    AND hc.completed_at >= p_date - INTERVAL '7 days'
    AND hc.completed_at < p_date + INTERVAL '1 day';

  SELECT 
    COUNT(DISTINCT hc.habit_id)::DECIMAL / 
    NULLIF(COUNT(DISTINCT h.id), 0)::DECIMAL
  INTO v_recent_completion_rate
  FROM public.habits h
  LEFT JOIN public.habit_completions hc 
    ON h.id = hc.habit_id 
    AND hc.user_id = p_user_id
    AND hc.completed_at >= p_date - INTERVAL '7 days'
    AND hc.completed_at < p_date + INTERVAL '1 day'
  WHERE h.user_id = p_user_id;

  v_confidence_score := (
    (LEAST(v_streak_days, 7)::DECIMAL / 7.0 * 0.4) +
    (COALESCE(v_consistency_score, 0.0) * 0.3) +
    (COALESCE(v_recent_completion_rate, 0.0) * 0.3)
  );

  v_confidence_score := GREATEST(0.0, LEAST(1.0, v_confidence_score));

  RETURN v_confidence_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_confidence_score IS '计算用户的信心增强分数（基于连续完成天数、一致性和完成率）';

CREATE OR REPLACE FUNCTION public.calculate_physical_performance_score(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_performance_score DECIMAL(5,2) := 0.0;
  v_sleep_score DECIMAL(5,2) := 0.0;
  v_exercise_score DECIMAL(5,2) := 0.0;
  v_stress_score DECIMAL(5,2) := 0.0;
  v_energy_score DECIMAL(5,2) := 0.0;
BEGIN
  SELECT 
    CASE 
      WHEN sleep_duration_minutes IS NULL THEN 0.5
      WHEN sleep_duration_minutes BETWEEN 420 AND 540 THEN 1.0
      ELSE GREATEST(0.0, 1.0 - ABS(sleep_duration_minutes - 480)::DECIMAL / 600.0)
    END,
    CASE 
      WHEN exercise_duration_minutes IS NULL OR exercise_duration_minutes = 0 THEN 0.0
      ELSE LEAST(1.0, exercise_duration_minutes::DECIMAL / 60.0)
    END,
    CASE 
      WHEN stress_level IS NULL THEN 0.5
      ELSE (11 - stress_level)::DECIMAL / 10.0
    END,
    CASE 
      WHEN energy_level IS NULL THEN 0.5
      ELSE energy_level::DECIMAL / 10.0
    END
  INTO v_sleep_score, v_exercise_score, v_stress_score, v_energy_score
  FROM public.daily_wellness_logs
  WHERE user_id = p_user_id
    AND log_date = p_date
  LIMIT 1;

  IF v_sleep_score IS NULL THEN
    SELECT 
      CASE 
        WHEN sleep_hours IS NULL THEN 0.5
        WHEN sleep_hours BETWEEN 7 AND 9 THEN 1.0
        ELSE GREATEST(0.0, 1.0 - ABS(sleep_hours - 8)::DECIMAL / 2.0)
      END,
      CASE 
        WHEN body_function_score IS NULL THEN 0.5
        ELSE body_function_score::DECIMAL / 100.0
      END,
      CASE 
        WHEN stress_level IS NULL THEN 0.5
        ELSE (11 - stress_level)::DECIMAL / 10.0
      END,
      CASE 
        WHEN energy_level IS NULL THEN 0.5
        ELSE energy_level::DECIMAL / 10.0
      END
    INTO v_sleep_score, v_exercise_score, v_stress_score, v_energy_score
    FROM public.profiles
    WHERE id = p_user_id;
  END IF;

  v_performance_score := (
    COALESCE(v_sleep_score, 0.5) * 0.3 +
    COALESCE(v_exercise_score, 0.5) * 0.3 +
    COALESCE(v_stress_score, 0.5) * 0.2 +
    COALESCE(v_energy_score, 0.5) * 0.2
  );

  v_performance_score := GREATEST(0.0, LEAST(1.0, v_performance_score));

  RETURN v_performance_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_physical_performance_score IS '计算用户的身体机能表现分数（基于睡眠、运动、压力、精力等指标）';

CREATE OR REPLACE FUNCTION public.update_user_metrics_on_habit_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_completion_date DATE;
BEGIN
  SELECT h.user_id, DATE(NEW.completed_at)
  INTO v_user_id, v_completion_date
  FROM public.habits h
  WHERE h.id = NEW.habit_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_metrics (
    user_id,
    date,
    belief_curve_score,
    confidence_score,
    physical_performance_score
  )
  VALUES (
    v_user_id,
    v_completion_date,
    public.calculate_belief_curve_score(v_user_id, v_completion_date),
    public.calculate_confidence_score(v_user_id, v_completion_date),
    public.calculate_physical_performance_score(v_user_id, v_completion_date)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    belief_curve_score = public.calculate_belief_curve_score(v_user_id, v_completion_date),
    confidence_score = public.calculate_confidence_score(v_user_id, v_completion_date),
    physical_performance_score = public.calculate_physical_performance_score(v_user_id, v_completion_date),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_user_metrics_on_habit_completion IS '当习惯完成时自动计算并更新用户指标';

DROP TRIGGER IF EXISTS trigger_update_user_metrics_on_habit_completion ON public.habit_completions;

CREATE TRIGGER trigger_update_user_metrics_on_habit_completion
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_metrics_on_habit_completion();

-- ============================================
-- 第三部分：启用 Supabase Realtime（安全版本）
-- ============================================

DO $$
BEGIN
  -- 1. 启用 habits 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'habits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
  END IF;

  -- 2. 启用 habit_completions 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'habit_completions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;
  END IF;

  -- 3. 启用 user_metrics 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_metrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;
  END IF;

  -- 4. 启用 profiles 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ============================================
-- 执行完成！
-- ============================================
-- 
-- 验证：执行以下 SQL 确认所有功能已启用
-- 
-- 1. 验证 AI 记忆函数：
-- SELECT proname FROM pg_proc WHERE proname = 'match_ai_memories';
-- 
-- 2. 验证贝叶斯函数：
-- SELECT proname FROM pg_proc WHERE proname IN (
--   'calculate_belief_curve_score',
--   'calculate_confidence_score',
--   'calculate_physical_performance_score',
--   'update_user_metrics_on_habit_completion'
-- );
-- 
-- 3. 验证触发器：
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_update_user_metrics_on_habit_completion';
-- 
-- 4. 验证 Realtime：
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- ============================================

