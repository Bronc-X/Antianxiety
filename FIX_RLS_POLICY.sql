-- 修复 RLS 策略问题
-- 问题：客户端 upsert 可能在某些情况下无法通过 RLS 策略

-- 1. 修改 handle_new_user trigger 使用 ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, LEFT(NEW.id::text, 8))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 确保 INSERT 策略允许用户创建自己的 profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. 确保 UPDATE 策略允许用户更新自己的 profile  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. 为 upsert 添加专门的策略（Supabase upsert 需要 INSERT 和 UPDATE 权限）
-- 已包含在上面的策略中

-- 5. 验证 RLS 是否启用
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 执行完成后，请在 Supabase Dashboard 的 SQL Editor 中运行此脚本
