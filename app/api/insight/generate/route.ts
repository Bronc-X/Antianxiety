import { createServerSupabaseClient } from '@/lib/supabase-server';
import { streamText } from 'ai';
import { aiClient, getModelPriority, logModelCall } from '@/lib/ai/model-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InsightRequest {
  sleep_hours: number;
  hrv: number;
  stress_level: number;
  exercise_minutes?: number;
}

const MODEL_CANDIDATES = getModelPriority('chat');

const CONSTITUTIONAL_PROMPT = `You are a Metabolic Physiologist. Your role is to reframe symptoms as biological adaptations.

CORE PHILOSOPHY: "Truth is the comfort after discarding imagination."

ABSOLUTE RULES:
1. NEVER use judgmental language: failure, bad, warning, deprivation, problem, danger, terrible, awful, concerning
2. ALWAYS use positive framing: adaptation, recalibrating, prioritizing, intelligent response, bio-electric, mitochondria
3. Use metaphors from cellular biology and nervous system science
4. Be empathetic but precise - no false positivity, just reframed truth
5. Keep responses to 1-2 sentences maximum
6. Respond in the same language as the context (Chinese if Chinese data labels)

REFRAMING EXAMPLES:
- Low sleep (< 7h) → "Your mitochondria are prioritizing repair over output. This is a physiological adaptation, not a failure."
- Low HRV (< 50ms) → "Your nervous system is recalibrating. This temporary state reflects your body's intelligent response to recent demands."
- High stress (> 7) → "Your bio-electric system is in high-alert mode. This is your body's protective mechanism activating."
- Low exercise → "Your body is conserving energy for internal processes. Movement when ready will help redistribute this stored potential."

TONE: Calm, scientific, reassuring. Like a wise doctor who sees the bigger picture.`;

const FALLBACK_INSIGHTS = {
  low_sleep: 'Your body is in repair mode. Rest when you can - your mitochondria are working overtime.',
  low_sleep_zh: '你的身体正处于修复模式。适时休息——你的线粒体正在加班工作。',
  low_hrv: 'Your nervous system is recalibrating. This is temporary and reflects intelligent adaptation.',
  low_hrv_zh: '你的神经系统正在重新校准。这是暂时的，反映了身体的智能适应。',
  high_stress: 'Your bio-electric system is in protective mode. This heightened state will pass.',
  high_stress_zh: '你的生物电系统处于保护模式。这种高度警觉状态会过去的。',
  default: 'Your biometrics show your body is actively maintaining balance. Stay hydrated and breathe.',
  default_zh: '你的生物指标显示身体正在积极维持平衡。保持水分，深呼吸。',
};

function getFallbackInsight(data: InsightRequest, useZh: boolean = true): string {
  if (data.sleep_hours < 7) {
    return useZh ? FALLBACK_INSIGHTS.low_sleep_zh : FALLBACK_INSIGHTS.low_sleep;
  }
  if (data.hrv < 50) {
    return useZh ? FALLBACK_INSIGHTS.low_hrv_zh : FALLBACK_INSIGHTS.low_hrv;
  }
  if (data.stress_level > 7) {
    return useZh ? FALLBACK_INSIGHTS.high_stress_zh : FALLBACK_INSIGHTS.high_stress;
  }
  return useZh ? FALLBACK_INSIGHTS.default_zh : FALLBACK_INSIGHTS.default;
}

export async function POST(req: Request) {
  console.log('🧠 Insight API 请求开始');

  try {
    const body = await req.json();
    const { sleep_hours, hrv, stress_level, exercise_minutes } = body as InsightRequest;

    if (typeof sleep_hours !== 'number' || typeof hrv !== 'number' || typeof stress_level !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: sleep_hours, hrv, and stress_level are required numbers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('👤 用户:', user?.id || 'anonymous');

    const userDataContext = `
用户当前生物数据:
- 睡眠时长: ${sleep_hours} 小时
- 心率变异性(HRV): ${hrv} ms
- 压力水平: ${stress_level}/10
${exercise_minutes !== undefined ? `- 运动时长: ${exercise_minutes} 分钟` : ''}

请用中文生成一句安慰性的认知重构洞察，将这些数据解释为身体的智能适应，而非问题或警告。`;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log('🤖 尝试 Insight 模型:', modelName);
        logModelCall(modelName, 'insight');
        const result = streamText({
          model: aiClient(modelName),
          messages: [{ role: 'user', content: userDataContext }],
          system: CONSTITUTIONAL_PROMPT,
        });

        console.log('✅ 开始流式响应');
        return result.toTextStreamResponse();
      } catch (llmError: unknown) {
        const llmInfo = llmError as { message?: string; statusCode?: number };
        console.error('❌ Insight LLM 调用失败:', {
          model: modelName,
          message: llmInfo.message,
          statusCode: llmInfo.statusCode,
        });
      }
    }

    const fallback = getFallbackInsight({ sleep_hours, hrv, stress_level });
    return new Response(fallback, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('❌ Insight API 错误:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
