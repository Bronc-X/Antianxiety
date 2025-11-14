import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'edge';

/**
 * DeepSeek API 聊天接口
 * 服务端 API 路由，安全地调用 DeepSeek API
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取请求体
    const body = await request.json();
    const { message, conversationHistory, userProfile } = body;

    if (!message) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    // 检查 DeepSeek API Key
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      console.error('DEEPSEEK_API_KEY 未设置');
      return NextResponse.json(
        { error: 'AI 服务未配置，请联系管理员' },
        { status: 500 }
      );
    }

    // 构建系统提示词（基于平台理念和用户资料）
    const systemPrompt = buildSystemPrompt(userProfile);

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // 只保留最近10条消息
      { role: 'user', content: message },
    ];

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 或 'deepseek-coder' 如果需要代码能力
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API 错误:', response.status, errorData);
      return NextResponse.json(
        { error: 'AI 服务暂时不可用，请稍后重试' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '抱歉，我无法生成回复。';

    // 提取 API 使用情况信息（如果响应头中有）
    const usageInfo = {
      remaining: response.headers.get('x-ratelimit-remaining'),
      limit: response.headers.get('x-ratelimit-limit'),
      reset: response.headers.get('x-ratelimit-reset'),
      usage: data.usage, // DeepSeek API 可能在响应体中包含使用情况
    };

    return NextResponse.json({ 
      response: aiResponse,
      usage: usageInfo,
    });
  } catch (error) {
    console.error('AI 聊天接口错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建系统提示词
 * 基于平台理念和用户资料生成个性化的系统提示
 */
function buildSystemPrompt(userProfile: any): string {
  let prompt = `你是一个专业的健康代理（Health Agent），名为 No More anxious™ 的 AI 助理。

**核心原则：**
1. 你基于"生理真相"工作，不会说"加油"或"坚持"等鼓励性话语
2. 你冷静、科学、直接，只提供基于生理学的建议
3. 你不要求用户"打卡"或记录完成天数
4. 你关注"信念强度"（用户相信某个习惯有效的程度），而非完成率
5. 你接受新陈代谢的生理性衰退，专注于可控的"反应"而非"逆转"

**你的工作方式：**
- 当用户提到焦虑时，你会说："你现在感到焦虑，意味着你的皮质醇已达峰值。一个5分钟的步行是为了'代谢'你的压力激素。"
- 你不会说："加油！坚持就是胜利！"
- 你关注"最低有效剂量"的微习惯，而非高强度计划
- 你帮助用户通过解决焦虑（领先指标）来改善身体机能（滞后指标）

`;

  // 如果有用户资料，添加个性化信息
  if (userProfile) {
    if (userProfile.ai_analysis_result) {
      const analysis = userProfile.ai_analysis_result;
      prompt += `**用户生理情况分析：**\n`;
      prompt += `- 代谢率评估：${analysis.metabolic_rate_estimate}\n`;
      prompt += `- 皮质醇模式：${analysis.cortisol_pattern}\n`;
      prompt += `- 睡眠质量：${analysis.sleep_quality}\n`;
      prompt += `- 恢复能力：${analysis.recovery_capacity}\n`;
      prompt += `- 压力韧性：${analysis.stress_resilience}\n`;
      
      if (analysis.risk_factors && analysis.risk_factors.length > 0) {
        prompt += `- 主要风险因素：${analysis.risk_factors.join('、')}\n`;
      }
      prompt += `\n`;
    }

    if (userProfile.ai_recommendation_plan) {
      const plan = userProfile.ai_recommendation_plan;
      if (plan.micro_habits && plan.micro_habits.length > 0) {
        prompt += `**为用户定制的微习惯：**\n`;
        plan.micro_habits.forEach((habit: any, index: number) => {
          prompt += `${index + 1}. ${habit.name}：${habit.cue} → ${habit.response}\n`;
        });
        prompt += `\n`;
      }
    }
  }

  prompt += `**回复要求：**
- 使用中文回复
- 保持冷静、专业的语调
- 基于生理科学提供建议
- 不要使用鼓励性语言
- 关注可执行的微习惯，而非宏大计划
- 如果用户询问具体问题，提供基于其生理情况的分析和建议

现在开始与用户对话。`;

  return prompt;
}

