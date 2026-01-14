'use server';

/**
 * Server action to generate alternative (easier) plan items
 * Called when user clicks "平替难项" in PlanSelector
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { ParsedPlan } from '@/lib/plan-parser';

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: 'https://aicanapi.com/v1',
});

export async function generatePlanAlternative(plan: ParsedPlan): Promise<{
    success: boolean;
    data?: ParsedPlan;
    error?: string;
}> {
    try {
        const prompt = `你是一个健康计划微调专家。用户选择了以下方案，希望做一些微调让它更容易开始执行。

⚠️ 重要：只做轻微调整！难度只降低约20%（保持原方案80%的强度）。

当前方案：
标题：${plan.title}
当前难度：${plan.difficulty || '⭐⭐⭐'}
执行项：
${plan.items?.map((item, i) => `${i + 1}. ${item.text}`).join('\n') || '无'}

调整原则：
1. 保持核心目标不变
2. 只对最难的1-2个步骤做轻微简化
3. 难度星级最多只能降一级（如⭐⭐⭐→⭐⭐，或⭐⭐⭐⭐→⭐⭐⭐）
4. 执行项数量保持不变
5. 不要把"每天30分钟"改成"每天5分钟"这种大幅降低

必须严格按以下JSON格式输出（不要添加任何其他文字）：
{
  "title": "微调后的标题（可以保持不变）",
  "description": "简短描述调整了什么",
  "difficulty": "${plan.difficulty === '⭐⭐⭐⭐' ? '⭐⭐⭐' : plan.difficulty === '⭐⭐⭐' ? '⭐⭐' : '⭐⭐'}",
  "duration": "保持原时长",
  "items": [
    { "id": "1", "text": "步骤1（保持或微调）" },
    { "id": "2", "text": "步骤2（保持或微调）" },
    { "id": "3", "text": "步骤3（保持或微调）" },
    { "id": "4", "text": "步骤4（保持或微调）" },
    { "id": "5", "text": "步骤5（保持或微调）" }
  ]
}`;

        const result = await generateText({
            model: openai('deepseek-v3.2-exp'),
            prompt,
            maxTokens: 1000,
        });

        // Parse the JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: '无法解析AI响应' };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        type PlanItemPayload = { id?: string; text?: string };

        const newPlan: ParsedPlan = {
            title: parsed.title || plan.title,
            content: parsed.description || '',
            difficulty: parsed.difficulty || '⭐⭐',
            duration: parsed.duration,
            items: Array.isArray(parsed.items)
                ? parsed.items.map((item: PlanItemPayload, index: number) => ({
                    id: item.id ?? String(index),
                    text: item.text ?? '',
                    status: 'pending' as const,
                }))
                : [],
        };

        return { success: true, data: newPlan };
    } catch (error) {
        console.error('Failed to generate plan alternative:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '生成替代方案失败'
        };
    }
}
