-- ============================================
-- 数据库迁移：添加个人资料字段
-- 用于存储用户的静态生理数据
-- ============================================

-- 1. 添加个人资料字段到 profiles 表
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS height NUMERIC,
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- 2. 添加注释
COMMENT ON COLUMN profiles.height IS '身高（厘米）';
COMMENT ON COLUMN profiles.weight IS '体重（千克）';
COMMENT ON COLUMN profiles.age IS '年龄（岁）';
COMMENT ON COLUMN profiles.gender IS '性别：male, female, other';
COMMENT ON COLUMN profiles.profile_completed_at IS '个人资料完成时间';

-- 3. 创建 daily_logs 表（如果不存在）
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  
  -- 核心健康指标
  sleep_hours NUMERIC CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  exercise_minutes INTEGER CHECK (exercise_minutes >= 0),
  water_intake_ml INTEGER CHECK (water_intake_ml >= 0),
  
  -- 备注
  notes TEXT,
  
  -- 元数据
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：每个用户每天只能有一条日志
  UNIQUE(user_id, log_date)
);

-- 4. 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date 
  ON daily_logs(user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_created 
  ON daily_logs(created_at DESC);

-- 5. 添加注释
COMMENT ON TABLE daily_logs IS '用户每日健康日志';
COMMENT ON COLUMN daily_logs.sleep_hours IS '睡眠时长（小时）';
COMMENT ON COLUMN daily_logs.sleep_quality IS '睡眠质量（1-5分）';
COMMENT ON COLUMN daily_logs.stress_level IS '压力水平（1-5分，1=低压力，5=高压力）';
COMMENT ON COLUMN daily_logs.energy_level IS '能量水平（1-5分，1=低能量，5=高能量）';
COMMENT ON COLUMN daily_logs.exercise_minutes IS '运动时长（分钟）';
COMMENT ON COLUMN daily_logs.water_intake_ml IS '饮水量（毫升）';

-- 6. 启用 Row Level Security (RLS)
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
-- 用户只能查看自己的日志
CREATE POLICY "Users can view their own logs"
  ON daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的日志
CREATE POLICY "Users can create their own logs"
  ON daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的日志
CREATE POLICY "Users can update their own logs"
  ON daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的日志
CREATE POLICY "Users can delete their own logs"
  ON daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成！现在可以：
-- 1. 保存用户的身高、体重、年龄、性别
-- 2. 用户记录每日的睡眠、压力、能量等数据
-- 3. 基于真实日志数据生成雷达图和AI建议
-- ============================================
