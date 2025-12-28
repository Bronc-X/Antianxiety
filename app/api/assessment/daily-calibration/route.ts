import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface DailyCalibrationPayload {
    responses: Record<string, string | number | null>;
}

export async function POST(request: NextRequest) {
    try {
        const body: DailyCalibrationPayload = await request.json();
        const { responses } = body || {};

        if (!responses || typeof responses !== 'object') {
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(todayStart.getDate() + 1);

        const { data: existing } = await supabase
            .from('daily_questionnaire_responses')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', todayStart.toISOString())
            .lt('created_at', tomorrowStart.toISOString())
            .maybeSingle();

        const toNumberSafe = (value: unknown) => {
            if (value === null || value === undefined) return null;
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        };

        const normalizeToIndex = (value: number | null) => {
            if (value === null) return null;
            return Math.max(0, Math.min(4, Math.round((value - 1) / 2)));
        };

        const sleepQualityScore = toNumberSafe(responses.sleep_quality ?? responses.sleepQuality);
        const energyLevelScore = toNumberSafe(responses.energy_level ?? responses.energyLevel);
        const stressRaw = responses.stress_level ?? responses.stressLevel;
        const moodRaw = responses.mood ?? responses.mood_status;

        const stressScoreMap: Record<string, number> = {
            none: 2,
            low: 4,
            medium: 7,
            high: 9,
        };

        const stressScore = typeof stressRaw === 'string'
            ? stressScoreMap[stressRaw] ?? null
            : toNumberSafe(stressRaw);

        const moodScoreMap: Record<string, number> = {
            great: 5,
            good: 4,
            neutral: 3,
            low: 1,
        };

        const moodScore = typeof moodRaw === 'string'
            ? moodScoreMap[moodRaw] ?? null
            : toNumberSafe(moodRaw);

        const normalizedResponses = {
            ...responses,
            sleep_quality: normalizeToIndex(sleepQualityScore),
            energy_level: normalizeToIndex(energyLevelScore),
            stress_level: normalizeToIndex(stressScore),
            mood: moodScore,
        };

        if (existing?.id) {
            await supabase
                .from('daily_questionnaire_responses')
                .update({
                    responses: normalizedResponses,
                    questions: Object.keys(normalizedResponses),
                })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('daily_questionnaire_responses')
                .insert({
                    user_id: user.id,
                    responses: normalizedResponses,
                    questions: Object.keys(normalizedResponses),
                });
        }

        const today = todayStart.toISOString().split('T')[0];

        const { error: calibrationError } = await supabase
            .from('daily_calibrations')
            .upsert({
                user_id: user.id,
                date: today,
                sleep_quality: sleepQualityScore || null,
                stress_level: stressScore || null,
                mood_score: moodScore || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,date',
            });

        if (calibrationError) {
            console.warn('Daily calibration sync warning:', calibrationError.message);
        }

        const sleepQualityLabel = sleepQualityScore !== null
            ? sleepQualityScore >= 9
                ? 'excellent'
                : sleepQualityScore >= 7
                    ? 'good'
                    : sleepQualityScore >= 5
                        ? 'average'
                        : sleepQualityScore >= 3
                            ? 'poor'
                            : 'very_poor'
            : null;

        const moodStatusLabel = moodScore !== null
            ? moodScore >= 4
                ? '轻松愉悦'
                : moodScore === 3
                    ? '略感疲惫'
                    : '情绪低落'
            : null;

        const { error: wellnessError } = await supabase
            .from('daily_wellness_logs')
            .upsert({
                user_id: user.id,
                log_date: today,
                sleep_quality: sleepQualityLabel,
                stress_level: stressScore ?? null,
                mood_status: moodStatusLabel,
                notes: 'Daily calibration update',
            }, {
                onConflict: 'user_id,log_date',
            });

        if (wellnessError) {
            console.warn('Daily wellness log sync warning:', wellnessError.message);
        }

        const cookieHeader = request.headers.get('cookie') ?? '';
        await fetch(new URL('/api/user/refresh', request.url), {
            method: 'POST',
            headers: { cookie: cookieHeader },
        }).catch(() => {});
        await fetch(new URL('/api/user/profile-sync', request.url), {
            method: 'POST',
            headers: { cookie: cookieHeader },
        }).catch(() => {});

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Daily calibration API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
