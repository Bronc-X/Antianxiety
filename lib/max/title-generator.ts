'use server';

/**
 * Conversation Title Generator
 * Uses AI to generate concise titles from conversation content
 */

import { generateText } from 'ai';
import { aiClient, getDefaultFastModel } from '@/lib/ai/model-config';

/**
 * Generate a concise title from the first message of a conversation
 * @param firstMessage The first user message
 * @returns A short title (≤10 Chinese characters or ≤20 English letters)
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
    if (!firstMessage?.trim()) {
        return '新对话';
    }

    // If message is very short, just use it as title
    if (firstMessage.length <= 10) {
        return firstMessage;
    }

    try {
        const result = await generateText({
            model: aiClient(getDefaultFastModel()),
            system: `你是一个标题生成器。根据用户的问题，生成一个简短的对话标题。
规则：
- 最多10个中文字符
- 不要使用标点符号
- 抓住问题的核心主题
- 如果是健康问题，用简洁的词描述
示例：
- "我最近老是睡不着怎么办" → "失眠困扰"
- "帮我制定一个减肥计划" → "减肥方案"
- "压力好大不知道怎么缓解" → "压力管理"`,
            prompt: firstMessage,
        });

        const title = result.text?.trim() || '新对话';
        // Ensure title is not too long
        return title.length > 15 ? title.slice(0, 15) : title;
    } catch (error) {
        console.error('Failed to generate title:', error);
        // Fallback: use first 10 chars
        return firstMessage.slice(0, 10) + (firstMessage.length > 10 ? '...' : '');
    }
}
