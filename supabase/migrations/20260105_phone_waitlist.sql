-- Phone Waitlist Table for SMS Beta Signup
-- Purpose: Collect phone numbers from users interested in phone signup feature (currently in beta)

CREATE TABLE IF NOT EXISTS phone_waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'signup_page', -- where the signup came from
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notified_at TIMESTAMPTZ, -- when we notified them about beta availability
    converted_at TIMESTAMPTZ -- when they completed actual phone signup
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_waitlist_created_at ON phone_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_waitlist_phone ON phone_waitlist(phone);

-- RLS policies
ALTER TABLE phone_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access
CREATE POLICY "Service role full access on phone_waitlist"
    ON phone_waitlist
    FOR ALL
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE phone_waitlist IS '手机号等待列表：收集对手机注册功能感兴趣的用户手机号（功能内测中）';
COMMENT ON COLUMN phone_waitlist.source IS '来源：signup_page, marketing_page, etc.';
COMMENT ON COLUMN phone_waitlist.notified_at IS '通知时间：当手机注册功能上线时通知用户';
COMMENT ON COLUMN phone_waitlist.converted_at IS '转化时间：用户完成实际手机注册的时间';
