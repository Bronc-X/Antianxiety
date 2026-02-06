import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OpenAI } from 'openai';

const DEFAULT_MODEL = 'gpt-5.2';

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

type RecommendationItem = {
  title: string;
  summary: string;
  action: string;
  reason?: string;
};

type RecommendationPayload = {
  recommendations: RecommendationItem[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = todayISODate();

    if (!force) {
      const { data: existing } = await supabase
        .from('daily_ai_recommendations')
        .select('id,recommendation_date,recommendations')
        .eq('user_id', user.id)
        .eq('recommendation_date', today)
        .limit(1)
        .maybeSingle();

      if (existing?.recommendations) {
        return NextResponse.json({ success: true, data: existing });
      }
    }

    const [{ data: profile }, { data: logs }, { data: inquiries }] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name,primary_goal,current_focus,preferred_language')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('daily_wellness_logs')
        .select('sleep_duration_minutes,stress_level,energy_level,mood_status,overall_readiness,log_date')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(7),
      supabase
        .from('inquiry_history')
        .select('question_text,question_type,user_response,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const sleepHours = average((logs ?? []).map((l) => (l.sleep_duration_minutes ?? 0) / 60));
    const stressAvg = average((logs ?? []).map((l) => l.stress_level ?? null));
    const energyAvg = average((logs ?? []).map((l) => l.energy_level ?? null));
    const readinessAvg = average((logs ?? []).map((l) => l.overall_readiness ?? null));

    const preferredLang = (profile?.preferred_language || 'zh').toLowerCase().startsWith('en') ? 'en' : 'zh';
    const language = body?.language || preferredLang;

    const context = {
      profile: {
        name: profile?.full_name || '用户',
        primary_goal: profile?.primary_goal || null,
        current_focus: profile?.current_focus || null,
      },
      recent_logs_summary: {
        sleep_hours_avg: sleepHours,
        stress_avg: stressAvg,
        energy_avg: energyAvg,
        readiness_avg: readinessAvg,
      },
      recent_inquiries: inquiries ?? [],
    };

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1',
    });

    const prompt = `
You are Max, a pragmatic and empathetic health AI assistant.
Generate 3-4 short, actionable daily recommendations for the user.
Each recommendation should be specific, realistic, and tailored to the user's recent data.
Avoid medical diagnosis or overly academic language.

Context:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON in this format:
{
  "recommendations": [
    {
      "title": "Short title",
      "summary": "1-2 sentence summary in ${language === 'en' ? 'English' : 'Simplified Chinese'}",
      "action": "One concrete action the user can take today",
      "reason": "Why this helps (plain language, 1 sentence)"
    }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful API that returns JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    const parsed: RecommendationPayload = JSON.parse(content);
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [];

    const { data: stored, error: storeError } = await supabase
      .from('daily_ai_recommendations')
      .upsert(
        {
          user_id: user.id,
          recommendation_date: today,
          recommendations,
          status: 'ready',
        },
        { onConflict: 'user_id,recommendation_date' }
      )
      .select('id,recommendation_date,recommendations')
      .maybeSingle();

    if (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: stored });
  } catch (error) {
    console.error('Daily recommendations error:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
