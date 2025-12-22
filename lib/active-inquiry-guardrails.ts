/**
 * Active Inquiry Guardrails
 * 
 * Manages AI active inquiry with:
 * - Template + variable generation (not fully open)
 * - Cooldown logic (24h same user, 48h same type)
 * - Forbidden topics (diagnosis, dosage)
 * - User preference (pause 7 days, reduce frequency)
 */

import { createClient } from '@/lib/supabase-client';

// ============ Types ============

export interface InquiryTemplate {
    id: string;
    category: 'plan_tracking' | 'status_check' | 'anomaly_follow' | 'info_gap' | 'deep_explore';
    templateZh: string;
    templateEn: string;
    variables: string[];
    cooldownHours: number;
}

export interface InquiryCooldown {
    userId: string;
    templateId: string;
    category: string;
    lastTriggeredAt: Date;
    expiresAt: Date;
}

export interface UserInquiryPreferences {
    isPaused: boolean;
    pausedUntil?: Date;
    frequency: 'normal' | 'reduced' | 'off';
    cooldownMultiplier: number;
}

export interface InquiryResult {
    allowed: boolean;
    reason?: string;
    question?: string;
    questionZh?: string;
    templateId?: string;
}

// ============ Inquiry Templates ============

export const INQUIRY_TEMPLATES: InquiryTemplate[] = [
    // Plan Tracking
    {
        id: 'plan_checkin_morning',
        category: 'plan_tracking',
        templateZh: '{name}，今天是执行"{plan_title}"的第{day}天。准备好了吗？',
        templateEn: '{name}, Day {day} of "{plan_title}". Ready to go?',
        variables: ['name', 'plan_title', 'day'],
        cooldownHours: 24,
    },
    {
        id: 'plan_item_followup',
        category: 'plan_tracking',
        templateZh: '{name}，你说的{plan_item}，今天做到了吗？',
        templateEn: '{name}, did you manage to do {plan_item} today?',
        variables: ['name', 'plan_item'],
        cooldownHours: 24,
    },

    // Anomaly Follow-up
    {
        id: 'sleep_anomaly',
        category: 'anomaly_follow',
        templateZh: '连续{n}天睡眠不足{hours}小时，是什么原因？',
        templateEn: 'Sleep under {hours}h for {n} consecutive days. What\'s happening?',
        variables: ['n', 'hours'],
        cooldownHours: 48,
    },
    {
        id: 'stress_anomaly',
        category: 'anomaly_follow',
        templateZh: '你的压力指数连续{n}天偏高，工作上有什么事吗？',
        templateEn: 'Stress levels high for {n} days. Anything going on at work?',
        variables: ['n'],
        cooldownHours: 48,
    },

    // Info Gap
    {
        id: 'energy_rhythm',
        category: 'info_gap',
        templateZh: '你一般几点开始犯困？',
        templateEn: 'What time do you usually start feeling tired?',
        variables: [],
        cooldownHours: 168, // 7 days
    },
    {
        id: 'caffeine_habit',
        category: 'info_gap',
        templateZh: '你每天大概喝多少咖啡或茶？',
        templateEn: 'How much coffee or tea do you usually drink per day?',
        variables: [],
        cooldownHours: 168,
    },

    // Deep Explore
    {
        id: 'keyword_followup',
        category: 'deep_explore',
        templateZh: '上次你提到{keyword}，现在情况有好转吗？',
        templateEn: 'You mentioned {keyword} before. Has the situation improved?',
        variables: ['keyword'],
        cooldownHours: 72,
    },

    // Status Check
    {
        id: 'morning_check',
        category: 'status_check',
        templateZh: '{name}，早安。昨晚睡得怎么样？',
        templateEn: '{name}, good morning. How did you sleep?',
        variables: ['name'],
        cooldownHours: 24,
    },
    {
        id: 'evening_check',
        category: 'status_check',
        templateZh: '{name}，今天过得怎么样？',
        templateEn: '{name}, how was your day?',
        variables: ['name'],
        cooldownHours: 24,
    },
];

// ============ Forbidden Topics ============

/**
 * Topics that should NEVER be asked about
 * (Safety-related questions are ALLOWED - handled in safety-system.ts)
 */
export const FORBIDDEN_TOPICS = [
    // Medical diagnosis
    '诊断', '确诊', 'diagnose', 'diagnosis',
    // Medication dosage
    '用药剂量', '药物剂量', '吃多少药', 'dosage', 'medication dose',
    // Prescription
    '处方', '开药', 'prescription', 'prescribe',
    // Medical advice
    '应该吃什么药', '推荐什么药', 'what medication', 'which drug',
];

/**
 * Check if a question contains forbidden topics
 */
export function containsForbiddenTopic(text: string): boolean {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_TOPICS.some(topic => lowerText.includes(topic.toLowerCase()));
}

// ============ Cooldown Logic ============

/**
 * Check if a template is in cooldown for a user
 * 🆕 Now applies user's cooldown multiplier from preferences
 */
export async function isInCooldown(
    userId: string,
    templateId: string
): Promise<boolean> {
    const supabase = createClient();
    const now = new Date();

    // 🆕 Get user preferences to apply cooldown multiplier
    const prefs = await getUserInquiryPreferences(userId);
    if (prefs.isPaused || prefs.frequency === 'off') {
        return true; // Treat as always in cooldown if paused/off
    }

    const { data } = await supabase
        .from('ai_memory')
        .select('created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'active_inquiry')
        .like('content', `%template_id:${templateId}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return false;

    const template = INQUIRY_TEMPLATES.find(t => t.id === templateId);
    if (!template) return false;

    const lastTriggered = new Date(data[0].created_at);
    // 🆕 Apply cooldown multiplier (e.g., 2x for 'reduced' frequency)
    const cooldownMs = template.cooldownHours * 60 * 60 * 1000 * prefs.cooldownMultiplier;

    return now.getTime() - lastTriggered.getTime() < cooldownMs;
}

/**
 * Check if any template of a category is in cooldown
 * 🆕 Now applies user's cooldown multiplier from preferences
 */
export async function isCategoryInCooldown(
    userId: string,
    category: InquiryTemplate['category']
): Promise<boolean> {
    const supabase = createClient();
    const now = new Date();

    // 🆕 Get user preferences to apply cooldown multiplier
    const prefs = await getUserInquiryPreferences(userId);
    if (prefs.isPaused || prefs.frequency === 'off') {
        return true; // Treat as always in cooldown if paused/off
    }

    const { data } = await supabase
        .from('ai_memory')
        .select('created_at')
        .eq('user_id', userId)
        .eq('memory_type', 'active_inquiry')
        .like('content', `%category:${category}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) return false;

    // Category cooldown: 48h for anomaly/deep, 24h for others
    const cooldownHours = ['anomaly_follow', 'deep_explore'].includes(category) ? 48 : 24;
    const lastTriggered = new Date(data[0].created_at);
    // 🆕 Apply cooldown multiplier
    const cooldownMs = cooldownHours * 60 * 60 * 1000 * prefs.cooldownMultiplier;

    return now.getTime() - lastTriggered.getTime() < cooldownMs;
}

// ============ User Preferences ============

/**
 * Get user's active inquiry preferences
 */
export async function getUserInquiryPreferences(
    userId: string
): Promise<UserInquiryPreferences> {
    const supabase = createClient();

    const { data } = await supabase
        .from('user_assessment_preferences')
        .select('active_inquiry_paused_until, active_inquiry_frequency')
        .eq('user_id', userId)
        .single();

    const now = new Date();
    const pausedUntil = data?.active_inquiry_paused_until
        ? new Date(data.active_inquiry_paused_until)
        : undefined;

    const isPaused = pausedUntil ? now < pausedUntil : false;
    const frequency = (data?.active_inquiry_frequency as 'normal' | 'reduced' | 'off') || 'normal';

    return {
        isPaused,
        pausedUntil,
        frequency,
        cooldownMultiplier: frequency === 'reduced' ? 2 : 1,
    };
}

/**
 * Pause active inquiry for N days
 */
export async function pauseActiveInquiry(
    userId: string,
    days: number = 7
): Promise<void> {
    const supabase = createClient();

    const pausedUntil = new Date();
    pausedUntil.setDate(pausedUntil.getDate() + days);

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            active_inquiry_paused_until: pausedUntil.toISOString(),
        }, {
            onConflict: 'user_id',
        });
}

/**
 * Resume active inquiry
 */
export async function resumeActiveInquiry(userId: string): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .update({ active_inquiry_paused_until: null })
        .eq('user_id', userId);
}

/**
 * Set active inquiry frequency
 */
export async function setActiveInquiryFrequency(
    userId: string,
    frequency: 'normal' | 'reduced' | 'off'
): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('user_assessment_preferences')
        .upsert({
            user_id: userId,
            active_inquiry_frequency: frequency,
        }, {
            onConflict: 'user_id',
        });
}

// ============ Template Generation ============

/**
 * Fill template with variables
 */
export function fillTemplate(
    template: InquiryTemplate,
    variables: Record<string, string>,
    language: 'zh' | 'en' = 'zh'
): string {
    let text = language === 'en' ? template.templateEn : template.templateZh;

    for (const [key, value] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return text;
}

/**
 * Generate an active inquiry with guardrails
 */
export async function generateGuardedInquiry(
    userId: string,
    templateId: string,
    variables: Record<string, string>,
    language: 'zh' | 'en' = 'zh'
): Promise<InquiryResult> {
    // 1. Check user preferences
    const prefs = await getUserInquiryPreferences(userId);

    if (prefs.isPaused) {
        return {
            allowed: false,
            reason: `User paused until ${prefs.pausedUntil?.toISOString()}`,
        };
    }

    if (prefs.frequency === 'off') {
        return {
            allowed: false,
            reason: 'User turned off active inquiry',
        };
    }

    // 2. Find template
    const template = INQUIRY_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        return {
            allowed: false,
            reason: `Template not found: ${templateId}`,
        };
    }

    // 3. Check cooldown (with multiplier for reduced frequency)
    const effectiveCooldown = template.cooldownHours * prefs.cooldownMultiplier;
    const inCooldown = await isInCooldown(userId, templateId);

    if (inCooldown) {
        return {
            allowed: false,
            reason: `Template in cooldown (${effectiveCooldown}h)`,
        };
    }

    // 4. Generate question
    const question = fillTemplate(template, variables, language);
    const questionZh = fillTemplate(template, variables, 'zh');

    // 5. Check forbidden topics
    if (containsForbiddenTopic(question)) {
        return {
            allowed: false,
            reason: 'Generated question contains forbidden topic',
        };
    }

    // 6. Log inquiry for cooldown tracking
    const supabase = createClient();
    await supabase.from('ai_memory').insert({
        user_id: userId,
        memory_type: 'active_inquiry',
        content: `template_id:${templateId};category:${template.category};question:${question}`,
        importance: 0.3,
    });

    return {
        allowed: true,
        question,
        questionZh,
        templateId,
    };
}

/**
 * Get next available inquiry for a user
 * Returns the first template that passes all guardrails
 */
export async function getNextAvailableInquiry(
    userId: string,
    preferredCategories: InquiryTemplate['category'][] = ['plan_tracking', 'status_check'],
    variables: Record<string, string> = {},
    language: 'zh' | 'en' = 'zh'
): Promise<InquiryResult> {
    // Check user preferences first
    const prefs = await getUserInquiryPreferences(userId);
    if (prefs.isPaused || prefs.frequency === 'off') {
        return { allowed: false, reason: 'User preference blocks inquiry' };
    }

    // Try templates in order of preferred categories
    const orderedTemplates = INQUIRY_TEMPLATES.sort((a, b) => {
        const aIndex = preferredCategories.indexOf(a.category);
        const bIndex = preferredCategories.indexOf(b.category);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    for (const template of orderedTemplates) {
        // Check if all required variables are present
        const hasAllVars = template.variables.every(v => v in variables);
        if (!hasAllVars) continue;

        // Check cooldown
        const inCooldown = await isInCooldown(userId, template.id);
        if (inCooldown) continue;

        // Generate and return
        return generateGuardedInquiry(userId, template.id, variables, language);
    }

    return { allowed: false, reason: 'No available templates' };
}
