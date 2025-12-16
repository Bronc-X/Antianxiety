-- ============================================
-- 贝叶斯函数和信心增强函数
-- 根据 README 要求，这些函数应该在数据库内部直接编写
-- 使用 pl/pgsql 语言
-- ============================================

-- ============================================
-- 1. 贝叶斯函数：计算信念曲线分数
-- ============================================
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
  -- 获取用户当天的习惯完成情况
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

  -- 如果没有习惯，返回默认值
  IF v_total_habits = 0 THEN
    RETURN 0.5; -- 默认中等分数
  END IF;

  -- 计算完成率
  v_completion_rate := v_completion_count::DECIMAL / v_total_habits::DECIMAL;

  -- 获取平均信念分数（从习惯定义中）
  -- 注意：如果 habits 表有 belief_score 字段，使用它；否则使用默认值
  SELECT COALESCE(AVG(h.belief_score), 5.0) / 10.0
  INTO v_avg_belief_score
  FROM public.habits h
  WHERE h.user_id = p_user_id
    AND h.belief_score IS NOT NULL;
  
  -- 如果没有信念分数数据，使用默认值
  IF v_avg_belief_score IS NULL THEN
    v_avg_belief_score := 0.5; -- 默认中等信念分数
  END IF;

  -- 贝叶斯更新：结合先验（平均信念分数）和证据（完成率）
  -- 公式：P(belief|evidence) = P(evidence|belief) * P(belief) / P(evidence)
  -- 简化版本：belief_score = (completion_rate * 0.6 + avg_belief_score * 0.4)
  v_bayesian_score := (v_completion_rate * 0.6 + v_avg_belief_score * 0.4);

  -- 确保分数在 0.00-1.00 范围内
  v_belief_score := GREATEST(0.0, LEAST(1.0, v_bayesian_score));

  RETURN v_belief_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_belief_curve_score IS '计算用户的信念曲线分数（基于贝叶斯定理）';

-- ============================================
-- 2. 信心增强函数：计算信心增强分数
-- ============================================
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
  -- 计算连续完成天数（最近7天）
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
  WHERE rn <= 7; -- 最近7天

  -- 计算一致性分数（基于最近7天的完成情况）
  SELECT 
    COUNT(DISTINCT DATE(hc.completed_at))::DECIMAL / 7.0
  INTO v_consistency_score
  FROM public.habit_completions hc
  INNER JOIN public.habits h ON h.id = hc.habit_id
  WHERE hc.user_id = p_user_id
    AND hc.completed_at >= p_date - INTERVAL '7 days'
    AND hc.completed_at < p_date + INTERVAL '1 day';

  -- 计算最近完成率
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

  -- 信心增强公式：结合连续天数、一致性和完成率
  -- confidence = (streak_days/7 * 0.4 + consistency * 0.3 + completion_rate * 0.3)
  v_confidence_score := (
    (LEAST(v_streak_days, 7)::DECIMAL / 7.0 * 0.4) +
    (COALESCE(v_consistency_score, 0.0) * 0.3) +
    (COALESCE(v_recent_completion_rate, 0.0) * 0.3)
  );

  -- 确保分数在 0.00-1.00 范围内
  v_confidence_score := GREATEST(0.0, LEAST(1.0, v_confidence_score));

  RETURN v_confidence_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_confidence_score IS '计算用户的信心增强分数（基于连续完成天数、一致性和完成率）';

-- ============================================
-- 3. 身体机能表现函数：计算身体机能表现分数
-- ============================================
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
  -- 从 daily_wellness_logs 获取当天的数据
  SELECT 
    -- 睡眠评分：7-9小时为最佳（1.0），每偏离1小时减0.1
    CASE 
      WHEN sleep_duration_minutes IS NULL THEN 0.5
      WHEN sleep_duration_minutes BETWEEN 420 AND 540 THEN 1.0 -- 7-9小时
      ELSE GREATEST(0.0, 1.0 - ABS(sleep_duration_minutes - 480)::DECIMAL / 600.0)
    END,
    -- 运动评分：有运动为1.0，无运动为0.0
    CASE 
      WHEN exercise_duration_minutes IS NULL OR exercise_duration_minutes = 0 THEN 0.0
      ELSE LEAST(1.0, exercise_duration_minutes::DECIMAL / 60.0) -- 60分钟为满分
    END,
    -- 压力评分：压力越低分数越高（1-10转换为0-1，反转）
    CASE 
      WHEN stress_level IS NULL THEN 0.5
      ELSE (11 - stress_level)::DECIMAL / 10.0
    END,
    -- 精力评分：精力越高分数越高（1-10转换为0-1）
    CASE 
      WHEN energy_level IS NULL THEN 0.5
      ELSE energy_level::DECIMAL / 10.0
    END
  INTO v_sleep_score, v_exercise_score, v_stress_score, v_energy_score
  FROM public.daily_wellness_logs
  WHERE user_id = p_user_id
    AND log_date = p_date
  LIMIT 1;

  -- 如果没有当天的记录，尝试从 profiles 表获取默认值
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

  -- 综合评分：加权平均
  -- performance = (sleep * 0.3 + exercise * 0.3 + stress * 0.2 + energy * 0.2)
  v_performance_score := (
    COALESCE(v_sleep_score, 0.5) * 0.3 +
    COALESCE(v_exercise_score, 0.5) * 0.3 +
    COALESCE(v_stress_score, 0.5) * 0.2 +
    COALESCE(v_energy_score, 0.5) * 0.2
  );

  -- 确保分数在 0.00-1.00 范围内
  v_performance_score := GREATEST(0.0, LEAST(1.0, v_performance_score));

  RETURN v_performance_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_physical_performance_score IS '计算用户的身体机能表现分数（基于睡眠、运动、压力、精力等指标）';

-- ============================================
-- 4. 触发器函数：当 habit_completions 插入时自动计算指标
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_metrics_on_habit_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_completion_date DATE;
BEGIN
  -- 获取用户ID和完成日期
  SELECT h.user_id, DATE(NEW.completed_at)
  INTO v_user_id, v_completion_date
  FROM public.habits h
  WHERE h.id = NEW.habit_id;

  -- 如果找不到用户ID，返回
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 插入或更新 user_metrics 表
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

-- ============================================
-- 5. 创建触发器：在 habit_completions 插入后触发
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_user_metrics_on_habit_completion ON public.habit_completions;

CREATE TRIGGER trigger_update_user_metrics_on_habit_completion
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_metrics_on_habit_completion();

