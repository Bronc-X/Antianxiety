-- ============================================
-- 启用 Supabase Realtime 功能
-- 将表添加到 supabase_realtime 发布中
-- 安全版本：如果表已在发布中，跳过
-- ============================================

-- 注意：Supabase Realtime 依赖于 PostgreSQL 的逻辑复制机制
-- 需要将表添加到名为 'supabase_realtime' 的发布中

-- 使用 DO 块安全地添加表（如果不存在则添加）
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
    RAISE NOTICE '已添加 habits 表到 Realtime';
  ELSE
    RAISE NOTICE 'habits 表已在 Realtime 中，跳过';
  END IF;

  -- 2. 启用 habit_completions 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'habit_completions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_completions;
    RAISE NOTICE '已添加 habit_completions 表到 Realtime';
  ELSE
    RAISE NOTICE 'habit_completions 表已在 Realtime 中，跳过';
  END IF;

  -- 3. 启用 user_metrics 表的 Realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_metrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_metrics;
    RAISE NOTICE '已添加 user_metrics 表到 Realtime';
  ELSE
    RAISE NOTICE 'user_metrics 表已在 Realtime 中，跳过';
  END IF;

  -- 4. 启用 profiles 表的 Realtime（可选）
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    RAISE NOTICE '已添加 profiles 表到 Realtime';
  ELSE
    RAISE NOTICE 'profiles 表已在 Realtime 中，跳过';
  END IF;
END $$;

-- ============================================
-- 验证：查看已添加到发布的表
-- ============================================
-- 执行以下 SQL 可以查看所有已启用 Realtime 的表：
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

