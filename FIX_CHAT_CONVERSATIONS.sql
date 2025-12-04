-- ============================================
-- 修复 chat_conversations 表
-- 问题：session_id 外键约束导致消息无法保存
-- ============================================

-- 1. 检查当前表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- 2. 检查外键约束
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'chat_conversations'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. 如果 session_id 有外键约束，先删除它
-- ALTER TABLE public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_session_id_fkey;

-- 4. 确保 session_id 可以为 NULL
ALTER TABLE public.chat_conversations 
ALTER COLUMN session_id DROP NOT NULL;

-- 5. 检查 RLS 策略是否正确
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'chat_conversations';

-- 6. 如果没有 INSERT 策略，创建一个
-- CREATE POLICY "Users can insert their own conversations"
-- ON public.chat_conversations
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- 7. 测试插入（用你的实际 user_id 替换）
-- INSERT INTO public.chat_conversations (user_id, role, content, metadata)
-- VALUES ('your-user-id', 'user', 'test message', '{}');

-- 8. 查看最近的对话记录
SELECT id, user_id, role, LEFT(content, 50) as content_preview, created_at
FROM public.chat_conversations
ORDER BY created_at DESC
LIMIT 10;
