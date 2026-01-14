import { createServerSupabaseClient } from '@/lib/supabase-server';
import { aiClient } from '@/lib/ai/model-config';
import { generateText } from 'ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExplainRequest {
    recommendationId: string;
    title: string;
    description: string;
    science: string;
    language: 'en' | 'zh';
    category?: string;
}

/**
 * POST /api/digital-twin/explain-recommendation
 * 
 * Generates a plain language explanation for a health recommendation
 * and records user interest in the database.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json() as ExplainRequest;
        const { recommendationId, title, description, science, language, category } = body;

        if (!recommendationId || !title) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401 }
            );
        }

        // Generate plain language explanation using LLM
        const systemPrompt = language === 'zh'
            ? `你是 Max，一个专业但友好的健康助手。你的任务是用大白话解释健康建议，让没有医学背景的普通人也能轻松理解和执行。

规则：
1. 使用口语化、亲切的语言
2. 举生活中的例子来说明
3. 如果有专业术语，立刻用大白话解释
4. 给出具体的执行步骤
5. 鼓励用户，让他们觉得这个建议是可行的
6. 控制在 150-200 字以内`
            : `You are Max, a professional but friendly health assistant. Your task is to explain health recommendations in plain language so anyone can understand and follow them.

Rules:
1. Use conversational, friendly language
2. Give real-life examples
3. Explain any technical terms immediately
4. Provide concrete action steps
5. Encourage the user, make them feel this is doable
6. Keep it to 150-200 words`;

        const userPrompt = language === 'zh'
            ? `请用大白话解释这个健康建议：

标题：${title}
具体内容：${description}
科学依据：${science}

请像朋友聊天一样解释给我听，让我知道：
1. 这个建议到底是让我做什么？
2. 为什么这个有用？
3. 我具体怎么开始？`
            : `Please explain this health recommendation in plain language:

Title: ${title}
Description: ${description}
Scientific basis: ${science}

Explain it to me like a friend would, telling me:
1. What exactly am I supposed to do?
2. Why does this work?
3. How do I get started?`;

        // Use deepseek-v3.2-exp as primary model per user request
        const MODELS_PRIORITY = [
            'deepseek-v3.2-exp',      // 🔑 用户要求优先使用
            'gemini-3-flash-preview', // Fallback
            'claude-sonnet-4-20250514',
        ];
        let explanation = '';
        let usedModel = '';

        // Try models in priority order
        for (const model of MODELS_PRIORITY) {
            try {
                const result = await generateText({
                    model: aiClient(model),
                    system: systemPrompt,
                    prompt: userPrompt,
                    maxTokens: 500,
                });
                explanation = result.text;
                usedModel = model;
                break;
            } catch {
                console.warn(`Model ${model} failed, trying next...`);
                continue;
            }
        }

        if (!explanation) {
            return new Response(
                JSON.stringify({ error: 'Failed to generate explanation' }),
                { status: 500 }
            );
        }

        // Record user interest in database
        const { error: insertError } = await supabase
            .from('user_recommendation_interests')
            .insert({
                user_id: user.id,
                recommendation_id: recommendationId,
                recommendation_title: title,
                recommendation_category: category || null,
                interaction_type: 'ask_max',
                max_explanation: explanation,
            });

        if (insertError) {
            console.error('Failed to record interest:', insertError);
            // Don't fail the request, just log it
        }

        console.log(`✅ Generated explanation for "${title}" using ${usedModel}`);

        return new Response(
            JSON.stringify({
                explanation,
                savedInterest: !insertError,
                model: usedModel,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Explain recommendation error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
}
