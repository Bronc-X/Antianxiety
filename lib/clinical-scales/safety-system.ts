/**
 * Safety System for Clinical Scales
 * 
 * Handles PHQ-9 Q9 (suicide/self-harm) and other safety-critical responses.
 * Provides regional crisis resources and platform contact info.
 * 
 * Supports:
 * - Regional crisis hotlines (China, Taiwan, Hong Kong, US, UK, etc.)
 * - Platform contact (WeChat for China, Telegram for international)
 */

import { createClient } from '@/lib/supabase-client';

// ============ Types ============

export type Region =
    | 'CN'      // China Mainland
    | 'TW'      // Taiwan
    | 'HK'      // Hong Kong
    | 'US'      // United States
    | 'UK'      // United Kingdom
    | 'AU'      // Australia
    | 'CA'      // Canada
    | 'SG'      // Singapore
    | 'JP'      // Japan
    | 'KR'      // South Korea
    | 'GLOBAL'; // Fallback

export interface CrisisHotline {
    name: string;
    nameEn: string;
    phone: string;
    description?: string;
    descriptionEn?: string;
    url?: string;
}

export interface PlatformContact {
    type: 'wechat' | 'telegram';
    id: string;
    displayName: string;
    url?: string;
}

export interface RegionalSafetyResources {
    region: Region;
    hotlines: CrisisHotline[];
    platformContact: PlatformContact;
}

// ============ Regional Crisis Hotlines ============

export const REGIONAL_HOTLINES: Record<Region, CrisisHotline[]> = {
    CN: [
        {
            name: '全国心理援助热线',
            nameEn: 'National Psychological Aid Hotline',
            phone: '400-161-9995',
            description: '24小时服务',
            descriptionEn: '24h service',
        },
        {
            name: '北京心理危机研究与干预中心',
            nameEn: 'Beijing Psychological Crisis Center',
            phone: '010-82951332',
            description: '24小时服务',
            descriptionEn: '24h service',
        },
        {
            name: '生命热线',
            nameEn: 'Life Line',
            phone: '400-821-1215',
            description: '24小时服务',
            descriptionEn: '24h service',
        },
    ],
    TW: [
        {
            name: '安心專線',
            nameEn: 'Taiwan Suicide Prevention Hotline',
            phone: '1925',
            description: '24小時免費心理諮詢',
            descriptionEn: '24h free counseling',
        },
        {
            name: '生命線',
            nameEn: 'Life Line Taiwan',
            phone: '1995',
            description: '24小時服務',
            descriptionEn: '24h service',
        },
    ],
    HK: [
        {
            name: '撒瑪利亞防止自殺會',
            nameEn: 'Samaritans Hong Kong',
            phone: '2389 2222',
            description: '24小時多語言服務',
            descriptionEn: '24h multilingual',
        },
        {
            name: '香港撒瑪利亞防止自殺會',
            nameEn: 'Samaritan Befrienders HK',
            phone: '2896 0000',
            description: '24小時服務',
            descriptionEn: '24h service',
        },
    ],
    US: [
        {
            name: 'National Suicide Prevention Lifeline',
            nameEn: 'National Suicide Prevention Lifeline',
            phone: '988',
            description: '24/7 Free and Confidential',
            descriptionEn: '24/7 Free and Confidential',
            url: 'https://988lifeline.org',
        },
        {
            name: 'Crisis Text Line',
            nameEn: 'Crisis Text Line',
            phone: 'Text HOME to 741741',
            description: '24/7 Text Support',
            descriptionEn: '24/7 Text Support',
        },
    ],
    UK: [
        {
            name: 'Samaritans',
            nameEn: 'Samaritans',
            phone: '116 123',
            description: '24/7 Free to call',
            descriptionEn: '24/7 Free to call',
            url: 'https://www.samaritans.org',
        },
        {
            name: 'SHOUT',
            nameEn: 'SHOUT',
            phone: 'Text SHOUT to 85258',
            description: '24/7 Text Support',
            descriptionEn: '24/7 Text Support',
        },
    ],
    AU: [
        {
            name: 'Lifeline Australia',
            nameEn: 'Lifeline Australia',
            phone: '13 11 14',
            description: '24/7 Crisis Support',
            descriptionEn: '24/7 Crisis Support',
            url: 'https://www.lifeline.org.au',
        },
        {
            name: 'Beyond Blue',
            nameEn: 'Beyond Blue',
            phone: '1300 22 4636',
            description: '24/7 Support',
            descriptionEn: '24/7 Support',
        },
    ],
    CA: [
        {
            name: 'Canada Suicide Prevention Service',
            nameEn: 'Canada Suicide Prevention Service',
            phone: '1-833-456-4566',
            description: '24/7 Support',
            descriptionEn: '24/7 Support',
        },
        {
            name: 'Crisis Text Line',
            nameEn: 'Crisis Text Line',
            phone: 'Text HOME to 686868',
            description: '24/7 Text Support',
            descriptionEn: '24/7 Text Support',
        },
    ],
    SG: [
        {
            name: 'Samaritans of Singapore',
            nameEn: 'Samaritans of Singapore',
            phone: '1-767',
            description: '24/7 Support',
            descriptionEn: '24/7 Support',
            url: 'https://www.sos.org.sg',
        },
    ],
    JP: [
        {
            name: 'いのちの電話',
            nameEn: 'Inochi no Denwa (Lifeline)',
            phone: '0120-783-556',
            description: '24時間対応',
            descriptionEn: '24h service',
        },
    ],
    KR: [
        {
            name: '자살예방상담전화',
            nameEn: 'Suicide Prevention Hotline',
            phone: '1393',
            description: '24시간 무료',
            descriptionEn: '24h free',
        },
    ],
    GLOBAL: [
        {
            name: 'International Association for Suicide Prevention',
            nameEn: 'International Association for Suicide Prevention',
            phone: 'See website',
            description: 'Find local resources',
            descriptionEn: 'Find local resources',
            url: 'https://www.iasp.info/resources/Crisis_Centres/',
        },
    ],
};

// ============ Platform Contact ============

export const PLATFORM_CONTACTS: Record<Region, PlatformContact> = {
    CN: {
        type: 'wechat',
        id: 'AntiAnxiety_Official',
        displayName: '官方微信',
        url: 'weixin://dl/chat?AntiAnxiety_Official',
    },
    TW: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram客服',
        url: 'https://t.me/antianxiety_support',
    },
    HK: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    US: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    UK: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    AU: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    CA: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    SG: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    JP: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    KR: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
    GLOBAL: {
        type: 'telegram',
        id: '@antianxiety_support',
        displayName: 'Telegram Support',
        url: 'https://t.me/antianxiety_support',
    },
};

// ============ Region Detection ============

/**
 * Detect region from language/locale
 */
export function detectRegion(locale: string): Region {
    const lcLocale = locale.toLowerCase();

    if (lcLocale.startsWith('zh-tw') || lcLocale.startsWith('zh-hant')) return 'TW';
    if (lcLocale.startsWith('zh-hk')) return 'HK';
    if (lcLocale.startsWith('zh')) return 'CN';
    if (lcLocale.startsWith('en-us') || lcLocale === 'en') return 'US';
    if (lcLocale.startsWith('en-gb')) return 'UK';
    if (lcLocale.startsWith('en-au')) return 'AU';
    if (lcLocale.startsWith('en-ca')) return 'CA';
    if (lcLocale.startsWith('en-sg')) return 'SG';
    if (lcLocale.startsWith('ja')) return 'JP';
    if (lcLocale.startsWith('ko')) return 'KR';

    return 'GLOBAL';
}

/**
 * Get regional safety resources
 */
export function getRegionalSafetyResources(locale: string): RegionalSafetyResources {
    const region = detectRegion(locale);
    return {
        region,
        hotlines: REGIONAL_HOTLINES[region] || REGIONAL_HOTLINES.GLOBAL,
        platformContact: PLATFORM_CONTACTS[region] || PLATFORM_CONTACTS.GLOBAL,
    };
}

// ============ Safety Messages ============

/**
 * Generate safety message for a specific region
 */
export function getSafetyMessage(locale: string = 'zh'): string {
    const resources = getRegionalSafetyResources(locale);
    const isChineseLocale = locale.startsWith('zh');

    const hotlineSection = resources.hotlines
        .map(h => `📞 **${isChineseLocale ? h.name : h.nameEn}**：${h.phone}${h.url ? ` (${h.url})` : ''}`)
        .join('\n');

    const platformSection = resources.platformContact.type === 'wechat'
        ? `💬 **${resources.platformContact.displayName}**：${resources.platformContact.id}`
        : `💬 **${resources.platformContact.displayName}**：${resources.platformContact.url}`;

    if (isChineseLocale) {
        return `
我注意到你最近可能有些困扰。如果你正在经历困难，请记得你并不孤单。

${hotlineSection}

${platformSection}

如果你愿意，可以随时和我聊聊你的感受。
`;
    } else {
        return `
I notice you might be going through a difficult time. Please remember you are not alone.

${hotlineSection}

${platformSection}

If you'd like, you can always talk to me about how you're feeling.
`;
    }
}

// ============ Legacy Exports (for backward compatibility) ============

export const CRISIS_HOTLINES = REGIONAL_HOTLINES.CN;

// ============ Safety Check Functions ============

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
    // Chinese
    '想死', '不想活', '活着没意思', '自杀', '结束生命',
    '伤害自己', '割腕', '跳楼', '不如死了',
    // Traditional Chinese
    '想死', '不想活', '活著沒意思', '自殺', '結束生命',
    // English
    'kill myself', 'want to die', 'end my life', 'suicidal',
    'hurt myself', 'self harm', 'end it all',
    // Japanese
    '死にたい', '自殺',
    // Korean
    '죽고싶', '자살',
];

/**
 * Check if text contains safety keywords
 */
export function containsSafetyKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return SAFETY_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}
