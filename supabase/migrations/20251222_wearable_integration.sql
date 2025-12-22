-- ============================================================================
-- 智能穿戴设备数据集成迁移脚本
-- Created: 2025-12-22
-- Description: 创建穿戴设备OAuth令牌、同步日志和统一健康数据表
-- ============================================================================

-- 1. 穿戴设备OAuth令牌存储
CREATE TABLE IF NOT EXISTS wearable_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('fitbit', 'oura', 'health_connect', 'healthkit')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT[],
  device_name TEXT,  -- 用户设备的友好名称
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- 2. 同步日志
CREATE TABLE IF NOT EXISTS wearable_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
  records_synced INTEGER DEFAULT 0,
  data_types TEXT[],  -- ['sleep', 'hrv', 'activity']
  date_range_start DATE,
  date_range_end DATE,
  error_message TEXT,
  duration_ms INTEGER,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 统一健康数据模型
CREATE TABLE IF NOT EXISTS user_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('fitbit', 'oura', 'health_connect', 'healthkit', 'manual')),
  data_type TEXT NOT NULL CHECK (data_type IN ('sleep', 'hrv', 'activity', 'heart_rate', 'stress', 'readiness', 'spo2', 'temperature')),
  recorded_at TIMESTAMPTZ NOT NULL,
  
  -- 归一化后的核心指标
  value NUMERIC,           -- 主数值（如睡眠时长分钟、HRV毫秒等）
  score NUMERIC,           -- 设备提供的评分（0-100）
  quality TEXT CHECK (quality IN ('excellent', 'good', 'fair', 'poor')),
  
  -- 扩展字段（不同数据类型的附加信息）
  metadata JSONB DEFAULT '{}',
  
  -- 原始数据（便于调试和追溯）
  raw_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 防止重复导入
  UNIQUE (user_id, source, data_type, recorded_at)
);

-- ============================================================================
-- 索引优化
-- ============================================================================

-- 健康数据查询优化
CREATE INDEX IF NOT EXISTS idx_health_data_user_type 
  ON user_health_data(user_id, data_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_data_source 
  ON user_health_data(source, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_data_user_date 
  ON user_health_data(user_id, recorded_at DESC);

-- 同步日志查询优化
CREATE INDEX IF NOT EXISTS idx_sync_log_user_provider 
  ON wearable_sync_log(user_id, provider, synced_at DESC);

-- 令牌查询优化
CREATE INDEX IF NOT EXISTS idx_wearable_tokens_user 
  ON wearable_tokens(user_id);

-- ============================================================================
-- RLS策略
-- ============================================================================

ALTER TABLE wearable_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_data ENABLE ROW LEVEL SECURITY;

-- wearable_tokens: 用户只能管理自己的令牌
CREATE POLICY "Users can manage own wearable tokens" ON wearable_tokens
  FOR ALL USING (auth.uid() = user_id);

-- wearable_sync_log: 用户只能查看自己的同步日志
CREATE POLICY "Users can view own sync logs" ON wearable_sync_log
  FOR SELECT USING (auth.uid() = user_id);

-- user_health_data: 用户完全控制自己的健康数据
CREATE POLICY "Users can access own health data" ON user_health_data
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 触发器：自动更新 updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wearable_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wearable_tokens_updated ON wearable_tokens;
CREATE TRIGGER trigger_wearable_tokens_updated
  BEFORE UPDATE ON wearable_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_wearable_token_timestamp();

-- ============================================================================
-- 辅助函数：获取用户最新健康数据
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_health_data(
  p_user_id UUID,
  p_data_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  data_type TEXT,
  source TEXT,
  recorded_at TIMESTAMPTZ,
  value NUMERIC,
  score NUMERIC,
  quality TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (uhd.data_type)
    uhd.data_type,
    uhd.source,
    uhd.recorded_at,
    uhd.value,
    uhd.score,
    uhd.quality
  FROM user_health_data uhd
  WHERE uhd.user_id = p_user_id
    AND uhd.recorded_at >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_data_type IS NULL OR uhd.data_type = p_data_type)
  ORDER BY uhd.data_type, uhd.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 辅助函数：获取健康数据趋势
-- ============================================================================

CREATE OR REPLACE FUNCTION get_health_data_trend(
  p_user_id UUID,
  p_data_type TEXT,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  recorded_date DATE,
  avg_value NUMERIC,
  avg_score NUMERIC,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(uhd.recorded_at) as recorded_date,
    AVG(uhd.value) as avg_value,
    AVG(uhd.score) as avg_score,
    COUNT(*) as record_count
  FROM user_health_data uhd
  WHERE uhd.user_id = p_user_id
    AND uhd.data_type = p_data_type
    AND uhd.recorded_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY DATE(uhd.recorded_at)
  ORDER BY recorded_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 注释
-- ============================================================================

COMMENT ON TABLE wearable_tokens IS '存储用户连接的穿戴设备OAuth令牌';
COMMENT ON TABLE wearable_sync_log IS '穿戴设备数据同步日志，用于追踪和调试';
COMMENT ON TABLE user_health_data IS '统一的健康数据模型，归一化来自不同穿戴设备的数据';

COMMENT ON COLUMN user_health_data.value IS '主数值：睡眠=分钟, HRV=毫秒, 活动=步数/卡路里, 心率=BPM';
COMMENT ON COLUMN user_health_data.score IS '设备评分(0-100)：如Oura的睡眠评分、就绪度评分';
COMMENT ON COLUMN user_health_data.metadata IS '数据类型特定的附加信息，如睡眠阶段分布';
