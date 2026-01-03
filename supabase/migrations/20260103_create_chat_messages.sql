-- Create chat_messages table (Was missing in previous schema)
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  role text not null CHECK (role IN ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Policy: Users can manage messages if they own the conversation
drop policy if exists "Users can manage own messages" on public.chat_messages;
create policy "Users can manage own messages" on public.chat_messages 
  for all using (
    exists (
      select 1 from public.chat_conversations 
      where id = chat_messages.conversation_id 
      and user_id = auth.uid()
    )
  );

-- Index for performance
create index if not exists idx_messages_conv_created 
  on public.chat_messages(conversation_id, created_at);
