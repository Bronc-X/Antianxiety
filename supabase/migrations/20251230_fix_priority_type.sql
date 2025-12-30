-- Quick fix: Ensure priority column in phase_goals is TEXT type
-- Run this if you get "invalid input syntax for type integer" error

-- Option 1: Drop and recreate as TEXT (only if column exists as integer)
DO $$ 
BEGIN
    -- Check if priority is integer type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'phase_goals' 
        AND column_name = 'priority'
        AND data_type = 'integer'
    ) THEN
        -- Convert integer to text
        ALTER TABLE public.phase_goals 
        ALTER COLUMN priority TYPE TEXT 
        USING CASE 
            WHEN priority = 1 THEN 'high'
            WHEN priority = 2 THEN 'medium'
            WHEN priority = 3 THEN 'low'
            ELSE 'medium'
        END;
    END IF;
    
    -- Add default if not set
    ALTER TABLE public.phase_goals 
    ALTER COLUMN priority SET DEFAULT 'medium';
    
EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist, add it
    ALTER TABLE public.phase_goals ADD COLUMN priority TEXT DEFAULT 'medium';
END $$;
