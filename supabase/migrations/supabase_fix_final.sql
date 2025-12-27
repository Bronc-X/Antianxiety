-- ============================================
-- ANTI-ANXIETY EN | FINAL COMPLETE SCHEMA (FIXED)
-- Run this in Supabase -> SQL Editor
-- This script handles existing tables/policies safely
-- ============================================

-- 1. Enable Extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- 2. Create Tables (with IF NOT EXISTS)

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  nickname text,
  avatar_url text,
  language text default 'en',
  wearables jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure 'wearables' column exists (if table already existed without it)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'wearables') then
    alter table public.profiles add column wearables jsonb default '{}'::jsonb;
  end if;
end $$;

-- DAILY WELLNESS LOGS
create table if not exists public.daily_wellness_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  log_date date not null,
  sleep_quality integer,   
  stress_level integer,    
  morning_energy integer,  
  overall_readiness float, 
  ai_recommendation text,
  created_at timestamptz default now(),
  unique(user_id, log_date)
);

-- CHAT CONVERSATIONS
create table if not exists public.chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null, 
  content text not null,
  session_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- USER PLANS
create table if not exists public.user_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text default 'active', 
  source text default 'AI',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.daily_wellness_logs enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.user_plans enable row level security;

-- 4. RLS Policies (Safely Drop & Recreate)

-- Profiles
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Logs
drop policy if exists "Users can manage own logs" on daily_wellness_logs;
create policy "Users can manage own logs" on daily_wellness_logs for all using (auth.uid() = user_id);

-- Chat
drop policy if exists "Users can manage own chats" on chat_conversations;
create policy "Users can manage own chats" on chat_conversations for all using (auth.uid() = user_id);

-- Plans
drop policy if exists "Users can manage own plans" on user_plans;
create policy "Users can manage own plans" on user_plans for all using (auth.uid() = user_id);

-- 5. Auto-create Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing; -- Prevent error if profile exists
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Indexes
create index if not exists idx_logs_user_date on daily_wellness_logs(user_id, log_date desc);
create index if not exists idx_chat_user_created on chat_conversations(user_id, created_at desc);
create index if not exists idx_plans_user_status on user_plans(user_id, status);
