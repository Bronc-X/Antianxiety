import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { EnrichedDailyLog } from '@/types/logic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleInsightRequest() {
  console.warn('⚠️ Insight API running in daily-log mode (vector context bypassed)');

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Insight auth error:', authError);
      return NextResponse.json({ error: 'Auth error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: logs, error: logError } = await supabase
      .from('daily_wellness_logs')
      .select('log_date, sleep_duration_minutes, stress_level, exercise_duration_minutes')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
      .limit(1);

    if (logError) {
      console.error('Insight daily log query error:', logError);
    }

    const latestLog = logs && logs.length > 0 ? (logs[0] as EnrichedDailyLog) : null;
    const insight = buildInsightFromLog(latestLog);

    return NextResponse.json({
      insight,
      latestLog,
      source: 'daily_log_only',
    });
  } catch (error) {
    console.error('Insight API error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}

export async function GET() {
  return handleInsightRequest();
}

export async function POST() {
  return handleInsightRequest();
}

function buildInsightFromLog(log: EnrichedDailyLog | null) {
  if (!log) {
    return "No daily log yet. Add today's sleep and stress to calibrate your baseline.";
  }

  const sleepMinutes = toNumber(log.sleep_duration_minutes);
  const sleepHours = toNumber(log.sleep_hours) ?? (sleepMinutes !== null ? sleepMinutes / 60 : null);
  const stress = toNumber(log.stress_level);

  if (sleepHours !== null && sleepHours < 6) {
    return `Sleep debt noted (${sleepHours.toFixed(1)}h). Recharge your bio-voltage with an early wind-down and a 10-min morning light walk.`;
  }

  if (stress !== null && stress > 7) {
    return `Stress is spiking (${stress}/10). A short movement break and 4-6 breathing can stabilize your bio-voltage.`;
  }

  if (sleepHours !== null) {
    return `Sleep logged at ${sleepHours.toFixed(1)}h. Keep bedtime consistent to keep your bio-voltage stable.`;
  }

  return 'Keep logging sleep and stress so we can keep your bio-voltage calibrated.';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
