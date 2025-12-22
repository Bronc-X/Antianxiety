-- ==========================================
-- E2E Verification Queries for Assessment System
-- ==========================================

-- Replace <uid> with actual User ID being tested

-- 1. Verify Daily Calibration Storage (Today)
-- Expected: count >= 5 for completed daily session
select response_date, count(*) as question_count
from user_scale_responses
where user_id = '<uid>' 
  and source = 'daily'
  and response_date = current_date
group by response_date;

-- 2. Verify Safety Events
-- Expected: Record exists if safety trigger (PHQ9-Q9 >= 1) was hit
select * 
from safety_events
where user_id = '<uid>'
order by created_at desc 
limit 5;

-- 3. Verify Scale Triggers (e.g. GAD-2 -> GAD-7)
-- Expected: Record exists if GAD-2 score >= 3
select * 
from scale_trigger_logs
where user_id = '<uid>'
order by created_at desc 
limit 5;

-- 4. Verify Frequency Preferences
-- Check daily_frequency (daily/every_other_day) and reason
select daily_frequency, daily_frequency_reason, last_frequency_change
from user_assessment_preferences
where user_id = '<uid>';

-- 5. Verify Profile Updates (AI Analysis & Calibration Dates)
select 
  last_daily_calibration,
  last_weekly_calibration,
  last_monthly_calibration,
  inferred_scale_scores,
  jsonb_typeof(ai_analysis_result) as ai_result_type
from profiles 
where id = '<uid>';

-- ==========================================
-- Helper: Generate Fake Stable Data (7 Days)
-- Run this to force "Stable" state for Frequency Downgrade test
-- ==========================================

/*
insert into user_scale_responses
  (id, user_id, scale_id, question_id, answer_value, source, response_date, created_at)
select
  gen_random_uuid(), 
  '<uid>', 
  'DAILY', 
  q.question_id, 
  q.value, 
  'daily', 
  (current_date - (d || ' day')::interval)::date,
  now()
from generate_series(1, 7) d
cross join (values
  ('gad7_q1', 0),            -- Low Anxiety
  ('gad7_q2', 0),
  ('daily_sleep_duration', 420), -- 7 hours (in minutes)
  ('daily_sleep_quality', 4),    -- Good quality
  ('daily_stress_level', 1)      -- Low stress
) as q(question_id, value);
*/
