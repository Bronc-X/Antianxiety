-- ============================================
-- pg_cron 定时任务配置
-- 用于定时触发内容爬取和用户行为分析
-- ============================================

-- 注意：需要先启用 pg_cron 扩展
-- 在 Supabase Dashboard 的 SQL Editor 中运行：
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. 定时内容爬取任务
-- 每 6 小时执行一次内容爬取
-- ============================================
SELECT cron.schedule(
  'ingest-content-every-6h',
  '0 */6 * * *', -- 每 6 小时执行一次
  $$
  SELECT
    net.http_post(
      url := 'https://your-vercel-app.vercel.app/api/ingest-content',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.content_ingest_api_key', true)
      ),
      body := jsonb_build_object(
        'sourceType', 'all',
        'limit', 20
      )
    ) AS request_id;
  $$
);

-- ============================================
-- 2. 定时用户行为分析和提醒
-- 每晚 22:00 执行，分析用户当天的习惯完成情况
-- ============================================
SELECT cron.schedule(
  'analyze-user-habits-daily',
  '0 22 * * *', -- 每晚 22:00 执行
  $$
  -- 分析所有用户当天的习惯完成情况
  -- 如果发现"最小阻力习惯"未完成，创建提醒
  DO $$
  DECLARE
    user_record RECORD;
    incomplete_habits INTEGER;
    min_resistance_habit RECORD;
  BEGIN
    FOR user_record IN
      SELECT DISTINCT user_id
      FROM public.habits
    LOOP
      -- 检查用户当天是否有未完成的最小阻力习惯（阻力等级 1-2）
      SELECT COUNT(*)
      INTO incomplete_habits
      FROM public.habits h
      WHERE h.user_id = user_record.user_id
        AND h.min_resistance_level <= 2
        AND NOT EXISTS (
          SELECT 1
          FROM public.habit_completions hc
          WHERE hc.habit_id = h.id
            AND hc.user_id = user_record.user_id
            AND DATE(hc.completed_at) = CURRENT_DATE
        );

      -- 如果有未完成的最小阻力习惯，创建提醒
      IF incomplete_habits > 0 THEN
        -- 获取一个未完成的最小阻力习惯作为示例
        SELECT h.*
        INTO min_resistance_habit
        FROM public.habits h
        WHERE h.user_id = user_record.user_id
          AND h.min_resistance_level <= 2
          AND NOT EXISTS (
            SELECT 1
            FROM public.habit_completions hc
            WHERE hc.habit_id = h.id
              AND hc.user_id = user_record.user_id
              AND DATE(hc.completed_at) = CURRENT_DATE
          )
        LIMIT 1;

        -- 插入提醒
        INSERT INTO public.ai_reminders (
          user_id,
          reminder_type,
          title,
          content,
          scheduled_at
        )
        VALUES (
          user_record.user_id,
          'habit_prompt',
          '最小阻力习惯提醒',
          '您今天还有 ' || incomplete_habits || ' 个最小阻力习惯未完成。例如：' || COALESCE(min_resistance_habit.title, '习惯') || '。这些习惯设计为最低阻力，完成它们有助于建立持续的正反馈循环。',
          NOW()
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END $$;
  $$
);

-- ============================================
-- 3. 定时更新用户指标（备用方案）
-- 如果触发器未正常工作，可以每小时执行一次更新
-- ============================================
SELECT cron.schedule(
  'update-user-metrics-hourly',
  '0 * * * *', -- 每小时执行一次
  $$
  -- 为所有有习惯打卡但指标未更新的用户更新指标
  DO $$
  DECLARE
    user_record RECORD;
  BEGIN
    FOR user_record IN
      SELECT DISTINCT hc.user_id
      FROM public.habit_completions hc
      WHERE DATE(hc.completed_at) = CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1
          FROM public.user_metrics um
          WHERE um.user_id = hc.user_id
            AND um.date = CURRENT_DATE
        )
    LOOP
      -- 插入或更新用户指标
      INSERT INTO public.user_metrics (
        user_id,
        date,
        belief_curve_score,
        confidence_score,
        physical_performance_score
      )
      VALUES (
        user_record.user_id,
        CURRENT_DATE,
        public.calculate_belief_curve_score(user_record.user_id, CURRENT_DATE),
        public.calculate_confidence_score(user_record.user_id, CURRENT_DATE),
        public.calculate_physical_performance_score(user_record.user_id, CURRENT_DATE)
      )
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        belief_curve_score = public.calculate_belief_curve_score(user_record.user_id, CURRENT_DATE),
        confidence_score = public.calculate_confidence_score(user_record.user_id, CURRENT_DATE),
        physical_performance_score = public.calculate_physical_performance_score(user_record.user_id, CURRENT_DATE),
        updated_at = NOW();
    END LOOP;
  END $$;
  $$
);

-- ============================================
-- 查看已配置的定时任务
-- ============================================
-- SELECT * FROM cron.job;

-- ============================================
-- 删除定时任务（如果需要）
-- ============================================
-- SELECT cron.unschedule('ingest-content-every-6h');
-- SELECT cron.unschedule('analyze-user-habits-daily');
-- SELECT cron.unschedule('update-user-metrics-hourly');


