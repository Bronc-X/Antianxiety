-- Add phone column to early_access_signups table

ALTER TABLE early_access_signups
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookups (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_early_access_signups_phone ON early_access_signups(phone);
