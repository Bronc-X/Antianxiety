/**
 * User Profile Aggregator
 * 
 * Aggregates user data from multiple sources into a unified profile
 * for RAG-powered personalization.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

interface WellnessLog {
    mood_score: number;
    energy_level: number;
    sleep_quality: number;
    created_at: string;
}

interface UnifiedProfileData {
    demographics: {
        gender?: string;
        age?: number;
        height?: number;
        weight?: number;
        bmi?: number;
    };
    health_goals: Array<{ goal_text: string; category: string }>;
    lifestyle_factors: {
        sleep_hours?: number;
        exercise_frequency?: string;
        stress_level?: string;
    };
    health_concerns: string[];
    recent_mood_trend: 'improving' | 'stable' | 'declining';
    ai_inferred_traits: Record<string, unknown>;
}

/**
 * Analyze mood trend from recent wellness logs
 */
function analyzeMoodTrend(logs: WellnessLog[]): 'improving' | 'stable' | 'declining' {
    if (!logs || logs.length < 2) return 'stable';

    // Sort by date ascending
    const sorted = [...logs].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calculate average of first half vs second half
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = firstHalf.reduce((sum, l) => sum + l.mood_score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, l) => sum + l.mood_score, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
}

/**
 * Build profile text for embedding generation
 */
function buildProfileText(data: UnifiedProfileData): string {
    const parts: string[] = [];

    // Demographics
    if (data.demographics.gender) {
        parts.push(`Gender: ${data.demographics.gender}`);
    }
    if (data.demographics.age) {
        parts.push(`Age: ${data.demographics.age} years old`);
    }
    if (data.demographics.bmi) {
        parts.push(`BMI: ${data.demographics.bmi.toFixed(1)}`);
    }

    // Health goals
    if (data.health_goals.length > 0) {
        const goals = data.health_goals.map(g => g.goal_text).join(', ');
        parts.push(`Goals: ${goals}`);
    }

    // Lifestyle
    if (data.lifestyle_factors.sleep_hours) {
        parts.push(`Average sleep: ${data.lifestyle_factors.sleep_hours} hours`);
    }
    if (data.lifestyle_factors.exercise_frequency) {
        parts.push(`Exercise frequency: ${data.lifestyle_factors.exercise_frequency}`);
    }
    if (data.lifestyle_factors.stress_level) {
        parts.push(`Stress level: ${data.lifestyle_factors.stress_level}`);
    }

    // Health concerns
    if (data.health_concerns.length > 0) {
        parts.push(`Health concerns: ${data.health_concerns.join(', ')}`);
    }

    // Mood trend
    parts.push(`Recent mood trend: ${data.recent_mood_trend}`);

    return parts.join('. ') + '.';
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        console.error('OPENAI_API_KEY not configured');
        return null;
    }

    try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        return null;
    }
}

/**
 * Main aggregation function
 * Collects data from all sources and updates unified profile
 */
export async function aggregateUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Supabase configuration missing' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Fetch basic profile from user_profiles
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
        }

        // 2. Fetch recent wellness logs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: wellnessLogs } = await supabase
            .from('daily_wellness_logs')
            .select('mood_score, energy_level, sleep_quality, created_at')
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        // 3. Fetch user feedback patterns
        const { data: feedbackData } = await supabase
            .from('user_feed_feedback')
            .select('feedback_type, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        // 4. Fetch active phase goals from dedicated table (may not exist yet)
        let phaseGoals: Array<{ goal_text: string; category: string; priority: string }> | null = null;
        try {
            const { data } = await supabase
                .from('phase_goals')
                .select('goal_text, category, priority')
                .eq('user_id', userId)
                .eq('is_completed', false)
                .order('priority', { ascending: true })
                .limit(10);
            phaseGoals = data;
        } catch {
            console.log('phase_goals table not available, skipping');
        }

        // 5. Build unified profile data
        const currentYear = new Date().getFullYear();
        const age = profile?.birth_year ? currentYear - profile.birth_year : undefined;
        const bmi = profile?.height && profile?.weight
            ? profile.weight / ((profile.height / 100) ** 2)
            : undefined;

        const unifiedData: UnifiedProfileData = {
            demographics: {
                gender: profile?.gender,
                age,
                height: profile?.height,
                weight: profile?.weight,
                bmi,
            },
            health_goals: (phaseGoals && phaseGoals.length > 0)
                ? phaseGoals.map(g => ({ goal_text: g.goal_text, category: g.category }))
                : (profile?.phase_goals || []),
            lifestyle_factors: {
                sleep_hours: profile?.sleep_hours,
                exercise_frequency: profile?.exercise_frequency,
                stress_level: profile?.stress_level,
            },
            health_concerns: profile?.metabolic_concerns || [],
            recent_mood_trend: analyzeMoodTrend(wellnessLogs || []),
            ai_inferred_traits: {},
        };

        // 5. Infer engagement patterns from feedback
        if (feedbackData && feedbackData.length > 0) {
            const likeCount = feedbackData.filter(f => f.feedback_type === 'like').length;
            const saveCount = feedbackData.filter(f => f.feedback_type === 'save').length;
            unifiedData.ai_inferred_traits = {
                engagement_level: feedbackData.length > 20 ? 'high' : feedbackData.length > 5 ? 'medium' : 'low',
                likes_ratio: (likeCount / feedbackData.length).toFixed(2),
                saves_ratio: (saveCount / feedbackData.length).toFixed(2),
            };
        }

        // 6. Build profile text for embedding
        const profileText = buildProfileText(unifiedData);

        // 7. Generate embedding (async, can fail gracefully)
        const embedding = await generateEmbedding(profileText);

        // 8. Upsert unified profile
        const { error: upsertError } = await supabase
            .from('unified_user_profiles')
            .upsert({
                user_id: userId,
                demographics: unifiedData.demographics,
                health_goals: unifiedData.health_goals,
                lifestyle_factors: unifiedData.lifestyle_factors,
                health_concerns: unifiedData.health_concerns,
                recent_mood_trend: unifiedData.recent_mood_trend,
                ai_inferred_traits: unifiedData.ai_inferred_traits,
                profile_text: profileText,
                profile_embedding: embedding,
                last_aggregated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });

        if (upsertError) {
            console.error('Error upserting unified profile:', upsertError);
            return { success: false, error: upsertError.message };
        }

        return { success: true };

    } catch (error) {
        console.error('Error in aggregateUserProfile:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get unified profile for a user
 */
export async function getUnifiedProfile(userId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
        .from('unified_user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching unified profile:', error);
        return null;
    }

    return data;
}

/**
 * Check if profile needs re-aggregation
 */
export async function shouldReaggregate(userId: string): Promise<boolean> {
    const profile = await getUnifiedProfile(userId);

    if (!profile) return true;

    const lastAggregated = new Date(profile.last_aggregated_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return lastAggregated < sevenDaysAgo;
}
