/**
 * Safety System for Clinical Scales
 * 
 * Handles PHQ-9 Q9 (suicide/self-harm) and other safety-critical responses.
 * Provides crisis resources and logs safety events.
 */

import { createClient } from '@/lib/supabase-client';

export interface CrisisHotline {
    name: string;
    nameEn: string;
    phone: string;
    description?: string;
}

export const CRISIS_HOTLINES: CrisisHotline[] = [
    {
        name: '全国心理援助热线',
        nameEn: 'National Psychological Aid Hotline',
        phone: '400-161-9995',
        description: '24小时服务',
    },
    {
        name: '北京心理危机研究与干预中心',
        nameEn: 'Beijing Psychological Crisis Research and Intervention Center',
        phone: '010-82951332',
        description: '24小时服务',
    },
    {
        name: '生命热线',
        nameEn: 'Life Line',
        phone: '400-821-1215',
        description: '24小时服务',
    },
];

export const SAFETY_MESSAGE = `
我注意到你最近可能有些困扰。如果你正在经历困难，请记得你并不孤单。

📞 **全国心理援助热线**：400-161-9995（24小时）
📞 **北京心理危机中心**：010-82951332（24小时）
📞 **生命热线**：400-821-1215（24小时）

如果你愿意，可以随时和我聊聊你的感受。
`;

export const SAFETY_MESSAGE_EN = `
I notice you might be going through a difficult time. Please remember you are not alone.

📞 **National Psychological Aid Hotline**: 400-161-9995 (24h)
📞 **Beijing Crisis Center**: 010-82951332 (24h)
📞 **Life Line**: 400-821-1215 (24h)

If you'd like, you can always talk to me about how you're feeling.
`;

/**
 * Check if a question response triggers safety protocols
 */
export function checkSafetyTrigger(
    questionId: string,
    value: number,
    safetyQuestionIds: string[] = ['phq9_q9']
): boolean {
    return safetyQuestionIds.includes(questionId) && value >= 1;
}

/**
 * Get safety message in appropriate language
 */
export function getSafetyMessage(language: 'zh' | 'en' = 'zh'): string {
    return language === 'en' ? SAFETY_MESSAGE_EN : SAFETY_MESSAGE;
}

/**
 * Log a safety event to the database
 */
export async function logSafetyEvent(
    userId: string,
    triggerSource: string,
    triggerValue: number,
    actionsTaken: string[] = ['show_safety_message', 'show_crisis_resources']
): Promise<void> {
    try {
        const supabase = createClient();
        await supabase.from('safety_events').insert({
            user_id: userId,
            trigger_source: triggerSource,
            trigger_value: triggerValue,
            actions_taken: actionsTaken,
        });
        console.log('🚨 Safety event logged:', { userId, triggerSource, triggerValue });
    } catch (error) {
        console.error('Failed to log safety event:', error);
        // Don't throw - safety logging failure shouldn't break the flow
    }
}

/**
 * Keywords that should trigger safety checks in chat
 */
export const SAFETY_KEYWORDS = [
    '想死', '不想活', '活着没意思', '自杀', '结束生命',
    '伤害自己', '割腕', '跳楼', '不如死了',
    // English
    'kill myself', 'want to die', 'end my life', 'suicidal',
];

/**
 * Check if text contains safety keywords
 */
export function containsSafetyKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SAFETY_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}
