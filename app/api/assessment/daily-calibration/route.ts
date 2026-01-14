import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface DailyCalibrationPayload {
    responses: Record<string, string | number | null>;
}

const isMissingDailyQuestionnaireTable = (message?: string) => {
    if (!message) return false;
    return message.includes('daily_questionnaire_responses')
        || message.includes('schema cache')
        || message.includes('does not exist');
};

export async function GET(request: NextRequest) {
    try {
        void request;
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
        const today = todayStart.toISOString().split('T')[0];

        const { data: existingQuestionnaire, error: questionnaireError } = await supabase
            .from('daily_questionnaire_responses')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', todayStart.toISOString())
            .lt('created_at', tomorrowStart.toISOString())
            .maybeSingle();

        if (questionnaireError && !isMissingDailyQuestionnaireTable(questionnaireError.message)) {
            return NextResponse.json(
                { error: 'Failed to load daily questionnaire status', details: questionnaireError.message },
                { status: 500 }
            );
        }

        const { data: existingCalibration } = await supabase
            .from('daily_calibrations')
            .select('id, date')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        return NextResponse.json({
            completedToday: !!existingCalibration,
            syncNeeded: !existingCalibration && !!existingQuestionnaire,
            date: existingCalibration?.date ?? null,
        });
    } catch (error) {
        console.error('Daily calibration status error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
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
        const today = todayStart.toISOString().split('T')[0];

        const { data: existing, error: questionnaireError } = await supabase
            .from('daily_questionnaire_responses')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', todayStart.toISOString())
            .lt('created_at', tomorrowStart.toISOString())
            .maybeSingle();

        const questionnaireAvailable = !questionnaireError || !isMissingDailyQuestionnaireTable(questionnaireError.message);
        if (questionnaireError && !isMissingDailyQuestionnaireTable(questionnaireError.message)) {
            return NextResponse.json(
                { error: 'Failed to load daily questionnaire', details: questionnaireError.message },
                { status: 500 }
            );
        }

        const { data: existingCalibration } = await supabase
            .from('daily_calibrations')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        if (existing?.id && existingCalibration?.id) {
            return NextResponse.json(
                { error: 'Already completed today', completedToday: true },
                { status: 409 }
            );
        }

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

        if (questionnaireAvailable) {
            if (existing?.id) {
                const { error: updateError } = await supabase
                    .from('daily_questionnaire_responses')
                    .update({
                        responses: normalizedResponses,
                        questions: Object.keys(normalizedResponses),
                    })
                    .eq('id', existing.id);

                if (updateError) {
                    return NextResponse.json(
                        { error: 'Failed to update daily questionnaire', details: updateError.message },
                        { status: 500 }
                    );
                }
            } else {
                const { error: insertError } = await supabase
                    .from('daily_questionnaire_responses')
                    .insert({
                        user_id: user.id,
                        responses: normalizedResponses,
                        questions: Object.keys(normalizedResponses),
                    });

                if (insertError) {
                    return NextResponse.json(
                        { error: 'Failed to save daily questionnaire', details: insertError.message },
                        { status: 500 }
                    );
                }
            }
        }

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
            return NextResponse.json(
                { error: 'Failed to sync daily calibration', details: calibrationError.message },
                { status: 500 }
            );
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

        return NextResponse.json({ success: true, completedToday: true, date: today });
    } catch (error) {
        console.error('Daily calibration API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
