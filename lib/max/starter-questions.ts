'use server';

/**
 * Personalized Starter Questions Generator
 * 
 * Analyzes user's historical data to predict questions they might want to ask.
 * Uses:
 * - Recent daily_wellness_logs (7 days)
 * - Active plans status
 * - User's goals and focus areas from profile
 * - Historical conversation themes
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateText } from 'ai';
import { aiClient, getDefaultFastModel } from '@/lib/ai/model-config';

interface UserDataContext {
    recentLogs: Array<{
        log_date: string;
        sleep_duration_minutes?: number;
        stress_level?: number;
        mood_status?: string;
    }>;
    activePlan: {
        title: string;
        item_count: number;
    } | null;
    profile: {
        primary_goal?: string;
        current_focus?: string;
        primary_focus_topics?: string[];
    } | null;
    recentTopics: string[];
}

interface ContextMetrics {
    avgSleepHours: number | null;
    avgStress: number | null;
    recentMood: string | null;
}

const PRIMARY_GOAL_MAP: Record<string, string> = {
    lose_weight: '减脂塑形',
    improve_sleep: '改善睡眠',
    boost_energy: '提升精力',
    maintain_energy: '保持健康',
};

/**
 * Generate personalized starter questions based on user's data
 * @param userId User ID
 * @returns Array of 3-4 personalized question suggestions
 */
export async function generatePersonalizedStarters(userId: string): Promise<string[]> {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch recent wellness logs
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: recentLogs } = await supabase
        .from('daily_wellness_logs')
        .select('log_date, sleep_duration_minutes, stress_level, mood_status')
        .eq('user_id', userId)
        .gte('log_date', weekAgo)
        .order('log_date', { ascending: false })
        .limit(7);

    // 2. Fetch active plan
    const { data: activePlan } = await supabase
        .from('user_plans')
        .select('title, content')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // 3. Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('primary_goal, current_focus, primary_focus_topics')
        .eq('id', userId)
        .maybeSingle();

    // 4. Fetch recent conversation topics (from chat titles)
    const { data: recentConvs } = await supabase
        .from('chat_conversations')
        .select('title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    const context: UserDataContext = {
        recentLogs: recentLogs || [],
        activePlan: activePlan ? {
            title: activePlan.title,
            item_count: typeof activePlan.content === 'object'
                ? ((activePlan.content as any)?.items?.length || 0)
                : 0
        } : null,
        profile: profile || null,
        recentTopics: recentConvs?.map(c => c.title).filter(Boolean) || [],
    };

    return generateQuestionsFromContext(context);
}

function computeMetrics(context: UserDataContext): ContextMetrics {
    const logs = context.recentLogs || [];
    const sleepValues = logs
        .map(l => l.sleep_duration_minutes)
        .filter((v): v is number => typeof v === 'number' && v > 0);
    const stressValues = logs
        .map(l => l.stress_level)
        .filter((v): v is number => typeof v === 'number' && v >= 0);

    const avgSleepHours = sleepValues.length > 0
        ? sleepValues.reduce((sum, v) => sum + v, 0) / sleepValues.length / 60
        : null;
    const avgStress = stressValues.length > 0
        ? stressValues.reduce((sum, v) => sum + v, 0) / stressValues.length
        : null;

    const recentMood = logs.find(l => l.mood_status)?.mood_status || null;

    return { avgSleepHours, avgStress, recentMood };
}

function buildAnchors(context: UserDataContext, metrics: ContextMetrics): string[] {
    const anchors: string[] = [];

    if (metrics.avgSleepHours) {
        anchors.push(`平均睡眠${metrics.avgSleepHours.toFixed(1)}小时`);
    }
    if (metrics.avgStress) {
        anchors.push(`平均压力${metrics.avgStress.toFixed(1)}/10`);
    }
    if (metrics.recentMood) {
        anchors.push(`情绪「${metrics.recentMood}」`);
    }
    if (context.activePlan?.title) {
        anchors.push(`方案「${context.activePlan.title}」`);
    }
    if (context.profile?.primary_goal) {
        const goal = PRIMARY_GOAL_MAP[context.profile.primary_goal] || context.profile.primary_goal;
        anchors.push(`目标「${goal}」`);
    }
    if (context.profile?.current_focus) {
        anchors.push(`关注「${context.profile.current_focus}」`);
    }
    if (context.profile?.primary_focus_topics && context.profile.primary_focus_topics.length > 0) {
        anchors.push(`关注主题「${context.profile.primary_focus_topics[0]}」`);
    }
    if (context.recentTopics.length > 0) {
        anchors.push(`话题「${context.recentTopics[0]}」`);
    }

    return anchors;
}

function buildDeterministicStarters(context: UserDataContext, metrics: ContextMetrics): string[] {
    const questions: string[] = [];

    if (context.activePlan?.title) {
        questions.push(`我正在执行方案「${context.activePlan.title}」，哪一步最难坚持、需要调整？`);
    }
    if (metrics.avgSleepHours) {
        questions.push(`我近7天平均睡眠${metrics.avgSleepHours.toFixed(1)}小时，帮我给一个中强度作息方案？`);
    }
    if (metrics.avgStress) {
        questions.push(`我近7天平均压力${metrics.avgStress.toFixed(1)}/10，帮我制定减压行动计划？`);
    }
    if (metrics.recentMood) {
        questions.push(`我最近情绪是「${metrics.recentMood}」，想先优化哪一点？`);
    }
    if (context.profile?.primary_goal) {
        const goal = PRIMARY_GOAL_MAP[context.profile.primary_goal] || context.profile.primary_goal;
        questions.push(`围绕目标「${goal}」，我今天该先做哪一项？`);
    }
    if (context.profile?.current_focus) {
        questions.push(`针对关注「${context.profile.current_focus}」，我应该从哪一步开始？`);
    }
    if (context.profile?.primary_focus_topics && context.profile.primary_focus_topics.length > 0) {
        questions.push(`围绕关注主题「${context.profile.primary_focus_topics[0]}」，帮我给一个行动方案？`);
    }
    if (context.recentTopics.length > 0) {
        questions.push(`上次聊到话题「${context.recentTopics[0]}」，我还要继续深入吗？`);
    }

    return questions;
}

function buildMissingDataStarters(context: UserDataContext): string[] {
    const questions: string[] = [];

    if (context.recentLogs.length === 0) {
        questions.push('我最近没有状态记录，应该先做个简短记录吗？');
    }
    if (!context.activePlan) {
        questions.push('我现在没有执行中的方案，帮我给一套中强度方案？');
    }
    if (!context.profile?.primary_goal) {
        questions.push('我还没设置主要目标，我应该先改善什么？');
    }
    if (!context.profile?.current_focus) {
        questions.push('我还没设置当前关注点，帮我锁定最需要关注的问题？');
    }

    if (questions.length < 3) {
        questions.push('帮我做一个快速状态评估？');
        questions.push('我今天最想先解决哪个小问题？');
    }

    return questions;
}

function uniqueQuestions(candidates: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of candidates) {
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const normalized = trimmed.endsWith('？') ? trimmed : `${trimmed}？`;
        if (seen.has(normalized)) continue;
        if (/[你您]/.test(normalized)) continue;
        seen.add(normalized);
        result.push(normalized);
    }

    return result;
}

/**
 * Generate questions based on analyzed user context
 */
async function generateQuestionsFromContext(context: UserDataContext): Promise<string[]> {
    const metrics = computeMetrics(context);
    const anchors = buildAnchors(context, metrics);
    const deterministic = buildDeterministicStarters(context, metrics);
    const missingData = buildMissingDataStarters(context);

    if (anchors.length === 0) {
        return uniqueQuestions([...deterministic, ...missingData]).slice(0, 4);
    }

    try {
        const result = await generateText({
            model: aiClient(getDefaultFastModel()),
            system: `你是一个健康助手的开场问题生成器。根据用户的历史数据，预测他们最可能想问的问题。

规则：
- 生成4个个性化问题
- 每个问题不超过20个字
- 问题应该基于用户的具体情况
- 不要问太笼统的问题如"你好吗"
- 要具体、可执行
- 每个问题必须包含下方“锚点”中的至少一个（必须原样出现）
- 问题必须是用户第一人称视角（使用“我/我的”），禁止使用“你/您”

输出格式：每行一个问题，共4行，不需要编号`,
            prompt: `锚点（必须原样包含）：
${anchors.map(a => `- ${a}`).join('\n')}

基于以上锚点，生成4个问题：`,
        });

        const questions = result.text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0 && q.length <= 30)
            .slice(0, 4);

        const anchored = questions.filter(q => anchors.some(a => q.includes(a)));
        const merged = uniqueQuestions([...anchored, ...deterministic, ...missingData]).slice(0, 4);
        return merged.length >= 3 ? merged : uniqueQuestions([...deterministic, ...missingData]).slice(0, 4);
    } catch (error) {
        console.error('Failed to generate personalized starters:', error);
        return uniqueQuestions([...deterministic, ...missingData]).slice(0, 4);
    }
}
