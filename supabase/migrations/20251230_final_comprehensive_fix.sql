-- ============================================
-- Final Comprehensive Fix Migration V3
-- Simplified - skip priority conversion (already text)
-- Date: 2025-12-30
-- ============================================

-- ============================================
-- 1. Ensure phase_goals.priority has default
-- ============================================
DO $$
BEGIN
    -- Just ensure default is set
    ALTER TABLE public.phase_goals 
    ALTER COLUMN priority SET DEFAULT 'medium';
EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist, add it
    ALTER TABLE public.phase_goals ADD COLUMN priority TEXT DEFAULT 'medium';
WHEN others THEN
    -- Skip any other errors
    NULL;
END $$;

-- ============================================
-- 2. Ensure chat_conversations has correct structure
-- ============================================
DO $$
BEGIN
    -- Add columns if they don't exist
    ALTER TABLE public.chat_conversations
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'New Chat',
    ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, create with bigserial id (matching existing schema)
    CREATE TABLE public.chat_conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT DEFAULT 'New Chat',
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Users can manage own conversations" 
    ON public.chat_conversations FOR ALL 
    USING (auth.uid() = user_id);
END $$;

-- ============================================
-- 3. Ensure chat_messages has correct structure
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        -- Create with bigint to match chat_conversations.id
        CREATE TABLE public.chat_messages (
            id BIGSERIAL PRIMARY KEY,
            conversation_id BIGINT NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
        
        -- Create policy (via conversation ownership)
        CREATE POLICY "Users can manage own messages" 
        ON public.chat_messages FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.chat_conversations c 
                WHERE c.id = conversation_id AND c.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- ============================================
-- Done!
-- ============================================
SELECT 'Migration complete!' as status;
