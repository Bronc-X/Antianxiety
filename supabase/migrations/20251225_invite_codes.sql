-- Invite Codes Table for Beta Access Control
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    created_by TEXT,
    notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can manage invite codes
CREATE POLICY "Service role full access" ON invite_codes
    FOR ALL TO service_role
    USING (true);

-- Anyone can check if a code exists (for validation)
CREATE POLICY "Allow code validation" ON invite_codes
    FOR SELECT TO anon, authenticated
    USING (true);

-- Add invite_code_used column to profiles table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'invite_code_used'
    ) THEN
        ALTER TABLE profiles ADD COLUMN invite_code_used TEXT;
    END IF;
END $$;

-- Insert 100 Christmas-themed invite codes (one-time use each)
INSERT INTO invite_codes (code, max_uses, notes) VALUES
    -- 🎄 圣诞树系列 (20个)
    ('TREE-XMAS-A1B2', 1, '🎄 Christmas Tree'),
    ('TREE-PINE-C3D4', 1, '🎄 Christmas Tree'),
    ('TREE-STAR-E5F6', 1, '🎄 Christmas Tree'),
    ('TREE-SNOW-G7H8', 1, '🎄 Christmas Tree'),
    ('TREE-GLOW-I9J0', 1, '🎄 Christmas Tree'),
    ('TREE-LITE-K1L2', 1, '🎄 Christmas Tree'),
    ('TREE-ORNT-M3N4', 1, '🎄 Christmas Tree'),
    ('TREE-TPPR-O5P6', 1, '🎄 Christmas Tree'),
    ('TREE-GRND-Q7R8', 1, '🎄 Christmas Tree'),
    ('TREE-SLVR-S9T0', 1, '🎄 Christmas Tree'),
    ('TREE-GOLD-U1V2', 1, '🎄 Christmas Tree'),
    ('TREE-RBOW-W3X4', 1, '🎄 Christmas Tree'),
    ('TREE-BLNK-Y5Z6', 1, '🎄 Christmas Tree'),
    ('TREE-FRST-A7B8', 1, '🎄 Christmas Tree'),
    ('TREE-COZY-C9D0', 1, '🎄 Christmas Tree'),
    ('TREE-WARM-E1F2', 1, '🎄 Christmas Tree'),
    ('TREE-BRGT-G3H4', 1, '🎄 Christmas Tree'),
    ('TREE-MERY-I5J6', 1, '🎄 Christmas Tree'),
    ('TREE-JOLY-K7L8', 1, '🎄 Christmas Tree'),
    ('TREE-FEST-M9N0', 1, '🎄 Christmas Tree'),
    -- ❄️ 雪花系列 (15个)
    ('SNOW-FLKE-P1Q2', 1, '❄️ Snowflake'),
    ('SNOW-WHTE-R3S4', 1, '❄️ Snowflake'),
    ('SNOW-CRST-T5U6', 1, '❄️ Snowflake'),
    ('SNOW-COLD-V7W8', 1, '❄️ Snowflake'),
    ('SNOW-FRST-X9Y0', 1, '❄️ Snowflake'),
    ('SNOW-WINT-A2B3', 1, '❄️ Snowflake'),
    ('SNOW-ICED-C4D5', 1, '❄️ Snowflake'),
    ('SNOW-PURE-E6F7', 1, '❄️ Snowflake'),
    ('SNOW-GLTR-G8H9', 1, '❄️ Snowflake'),
    ('SNOW-SOFT-I0J1', 1, '❄️ Snowflake'),
    ('SNOW-LITE-K2L3', 1, '❄️ Snowflake'),
    ('SNOW-DRFT-M4N5', 1, '❄️ Snowflake'),
    ('SNOW-BLNK-O6P7', 1, '❄️ Snowflake'),
    ('SNOW-MGIC-Q8R9', 1, '❄️ Snowflake'),
    ('SNOW-CALM-S0T1', 1, '❄️ Snowflake'),
    -- 🎅 圣诞老人系列 (15个)
    ('SANTA-HOHO-U2V3', 1, '🎅 Santa Claus'),
    ('SANTA-BELL-W4X5', 1, '🎅 Santa Claus'),
    ('SANTA-GIFT-Y6Z7', 1, '🎅 Santa Claus'),
    ('SANTA-SLED-A8B9', 1, '🎅 Santa Claus'),
    ('SANTA-NRTH-C0D1', 1, '🎅 Santa Claus'),
    ('SANTA-POLE-E2F3', 1, '🎅 Santa Claus'),
    ('SANTA-MGIC-G4H5', 1, '🎅 Santa Claus'),
    ('SANTA-CHIM-I6J7', 1, '🎅 Santa Claus'),
    ('SANTA-SOCK-K8L9', 1, '🎅 Santa Claus'),
    ('SANTA-REED-M0N1', 1, '🎅 Santa Claus'),
    ('SANTA-COAT-O2P3', 1, '🎅 Santa Claus'),
    ('SANTA-BTNS-Q4R5', 1, '🎅 Santa Claus'),
    ('SANTA-LAFF-S6T7', 1, '🎅 Santa Claus'),
    ('SANTA-JOLY-U8V9', 1, '🎅 Santa Claus'),
    ('SANTA-WISH-W0X1', 1, '🎅 Santa Claus'),
    -- 🦌 驯鹿系列 (10个)
    ('DEER-RUDO-Y2Z3', 1, '🦌 Reindeer'),
    ('DEER-RNDR-A4B5', 1, '🦌 Reindeer'),
    ('DEER-NOSE-C6D7', 1, '🦌 Reindeer'),
    ('DEER-ANTL-E8F9', 1, '🦌 Reindeer'),
    ('DEER-DASH-G0H1', 1, '🦌 Reindeer'),
    ('DEER-DANC-I2J3', 1, '🦌 Reindeer'),
    ('DEER-PRNC-K4L5', 1, '🦌 Reindeer'),
    ('DEER-COMT-M6N7', 1, '🦌 Reindeer'),
    ('DEER-CUPI-O8P9', 1, '🦌 Reindeer'),
    ('DEER-BLTZ-Q0R1', 1, '🦌 Reindeer'),
    -- ⭐ 星星系列 (10个)
    ('STAR-BGHT-S2T3', 1, '⭐ Christmas Star'),
    ('STAR-HOPE-U4V5', 1, '⭐ Christmas Star'),
    ('STAR-WISH-W6X7', 1, '⭐ Christmas Star'),
    ('STAR-BEAM-Y8Z9', 1, '⭐ Christmas Star'),
    ('STAR-GLOW-A0B1', 1, '⭐ Christmas Star'),
    ('STAR-TWNK-C2D3', 1, '⭐ Christmas Star'),
    ('STAR-SHNE-E4F5', 1, '⭐ Christmas Star'),
    ('STAR-DREM-G6H7', 1, '⭐ Christmas Star'),
    ('STAR-GUID-I8J9', 1, '⭐ Christmas Star'),
    ('STAR-LEAD-K0L1', 1, '⭐ Christmas Star'),
    -- 🎁 礼物系列 (15个)
    ('GIFT-JOYY-M2N3', 1, '🎁 Gift Box'),
    ('GIFT-LOVE-O4P5', 1, '🎁 Gift Box'),
    ('GIFT-WARM-Q6R7', 1, '🎁 Gift Box'),
    ('GIFT-WRAP-S8T9', 1, '🎁 Gift Box'),
    ('GIFT-RBON-U0V1', 1, '🎁 Gift Box'),
    ('GIFT-BOWS-W2X3', 1, '🎁 Gift Box'),
    ('GIFT-TAGS-Y4Z5', 1, '🎁 Gift Box'),
    ('GIFT-BOXS-A6B7', 1, '🎁 Gift Box'),
    ('GIFT-PACK-C8D9', 1, '🎁 Gift Box'),
    ('GIFT-SURP-E0F1', 1, '🎁 Gift Box'),
    ('GIFT-SPEC-G2H3', 1, '🎁 Gift Box'),
    ('GIFT-PRSN-I4J5', 1, '🎁 Gift Box'),
    ('GIFT-OPEN-K6L7', 1, '🎁 Gift Box'),
    ('GIFT-CHRS-M8N9', 1, '🎁 Gift Box'),
    ('GIFT-XMAS-O0P1', 1, '🎁 Gift Box'),
    -- 🔔 铃铛系列 (10个)
    ('BELL-RING-Q2R3', 1, '🔔 Jingle Bell'),
    ('BELL-DING-S4T5', 1, '🔔 Jingle Bell'),
    ('BELL-JNGL-U6V7', 1, '🔔 Jingle Bell'),
    ('BELL-SONG-W8X9', 1, '🔔 Jingle Bell'),
    ('BELL-CHME-Y0Z1', 1, '🔔 Jingle Bell'),
    ('BELL-GOLD-A2B3', 1, '🔔 Jingle Bell'),
    ('BELL-SLVR-C4D5', 1, '🔔 Jingle Bell'),
    ('BELL-BRSS-E6F7', 1, '🔔 Jingle Bell'),
    ('BELL-MERY-G8H9', 1, '🔔 Jingle Bell'),
    ('BELL-XMAS-I0J1', 1, '🔔 Jingle Bell'),
    -- 🕯️ 蜡烛系列 (5个)
    ('CNDL-WARM-K2L3', 1, '🕯️ Candle Light'),
    ('CNDL-GLOW-M4N5', 1, '🕯️ Candle Light'),
    ('CNDL-LITE-O6P7', 1, '🕯️ Candle Light'),
    ('CNDL-FLME-Q8R9', 1, '🕯️ Candle Light'),
    ('CNDL-COZY-S0T1', 1, '🕯️ Candle Light')
ON CONFLICT (code) DO NOTHING;
