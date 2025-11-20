import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { API_CONSTANTS, AI_ROLES } from '@/lib/config/constants';
import {
  generateEmbedding,
  retrieveMemories,
  storeMemory,
  buildContextWithMemories,
} from '@/lib/aiMemory';
import { fetchWithRetry, parseApiError } from '@/lib/apiUtils';

export const runtime = 'edge';

type RoleValue = (typeof AI_ROLES)[keyof typeof AI_ROLES];

interface ConversationMessage {
  role: RoleValue;
  content: string;
}

interface AIAnalysisResult {
  metabolic_rate_estimate?: string;
  cortisol_pattern?: string;
  sleep_quality?: string;
  recovery_capacity?: string;
  stress_resilience?: string;
  risk_factors?: string[];
  [key: string]: unknown;
}

interface AIMicroHabit {
  name?: string;
  cue?: string;
  response?: string;
}

interface AIRecommendationPlan {
  micro_habits?: AIMicroHabit[];
}

interface UserProfileData {
  ai_analysis_result?: AIAnalysisResult | null;
  ai_recommendation_plan?: AIRecommendationPlan | null;
  [key: string]: unknown;
}

interface DeepSeekUsage {
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  [key: string]: number | undefined;
}

interface DeepSeekChoice {
  message?: {
    role: RoleValue;
    content?: string;
  };
}

interface DeepSeekResponseBody {
  choices: DeepSeekChoice[];
  usage?: DeepSeekUsage;
}

interface ChatRequestBody {
  message: string;
  conversationHistory?: ConversationMessage[];
  userProfile?: UserProfileData | null;
}

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
    const body = (await request.json()) as ChatRequestBody;
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

    // ===== AI 记忆系统：检索相关历史记忆 =====
    let relevantMemories: Array<{ content_text: string; role: string; created_at: string }> = [];
    try {
      // 生成用户消息的向量嵌入
      const messageEmbedding = await generateEmbedding(message);
      
      if (messageEmbedding && messageEmbedding.length > 0) {
        // 从 ai_memory 表中检索相关记忆
        relevantMemories = await retrieveMemories(user.id, messageEmbedding);
      }
    } catch (error) {
      console.error('检索 AI 记忆失败:', error);
      // 继续执行，即使记忆检索失败也不影响对话
    }

    // 构建系统提示词（基于平台理念和用户资料）
    let systemPrompt = buildSystemPrompt(userProfile);
    
    // 如果有相关记忆，添加到系统提示词中（增强上下文）
    if (relevantMemories.length > 0) {
      const memoryContext = buildContextWithMemories(relevantMemories);
      systemPrompt += memoryContext;
      systemPrompt += `\n**重要**：以上是用户的历史对话。在回复时，可以引用这些内容，但不要重复说"你之前说过"。直接使用这些信息即可。\n`;
    }

    // 构建消息历史
    const messages: ConversationMessage[] = [
      { role: AI_ROLES.SYSTEM, content: systemPrompt },
      ...(conversationHistory || []).slice(-API_CONSTANTS.CONVERSATION_HISTORY_LIMIT), // 只保留最近N条消息
      { role: AI_ROLES.USER, content: message },
    ];

    // 调用 DeepSeek API（带重试机制）
    let response: Response;
    try {
      response = await fetchWithRetry(
        `${API_CONSTANTS.DEEPSEEK_API_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: API_CONSTANTS.DEEPSEEK_MODEL,
            messages: messages,
            temperature: API_CONSTANTS.DEEPSEEK_TEMPERATURE,
            max_tokens: API_CONSTANTS.DEEPSEEK_MAX_TOKENS,
            stream: false,
          }),
        },
        3, // 最大重试 3 次
        1000 // 初始延迟 1 秒
      );
    } catch (error) {
      console.error('DeepSeek API 请求失败（已重试）:', error);
      const errorInfo = parseApiError(error);
      return NextResponse.json(
        {
          error: errorInfo.message || 'AI 服务暂时不可用，请稍后重试',
          code: errorInfo.code,
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorData = await response.text().catch(() => '未知错误');
      console.error('DeepSeek API 错误:', response.status, errorData);

      // 根据错误类型返回不同的错误信息
      let errorMessage = 'AI 服务暂时不可用，请稍后重试';
      if (response.status === 401) {
        errorMessage = 'AI 服务认证失败，请联系管理员';
      } else if (response.status === 429) {
        errorMessage = '请求过于频繁，请稍后再试';
      } else if (response.status >= 500) {
        errorMessage = 'AI 服务暂时不可用，请稍后重试';
      }

      return NextResponse.json(
        { error: errorMessage, code: response.status.toString() },
        { status: response.status }
      );
    }

    const data = (await response.json()) as DeepSeekResponseBody;
    const aiResponse = data.choices[0]?.message?.content || '抱歉，我无法生成回复。';

    // ===== AI 记忆系统：存储新的对话到记忆库 =====
    try {
      // 存储用户消息
      const userMessageEmbedding = await generateEmbedding(message);
      await storeMemory(user.id, message, 'user', userMessageEmbedding);

      // 存储 AI 回复
      const aiResponseEmbedding = await generateEmbedding(aiResponse);
      await storeMemory(
        user.id,
        aiResponse,
        'assistant',
        aiResponseEmbedding,
        {
          model: API_CONSTANTS.DEEPSEEK_MODEL,
          tokens: data.usage?.total_tokens,
        }
      );
    } catch (error) {
      console.error('存储 AI 记忆失败:', error);
      // 继续执行，即使存储失败也不影响响应
    }

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
    const errorInfo = parseApiError(error);
    return NextResponse.json(
      {
        error: errorInfo.message || '服务器错误，请稍后重试',
        code: errorInfo.code,
      },
      { status: 500 }
    );
  }
}

/**
 * 构建系统提示词
 * 基于平台理念和用户资料生成个性化的系统提示
 * 风格：冷峻、理性、基于第一性原理
 */
function buildSystemPrompt(userProfile?: UserProfileData | null): string {
  let prompt = `你是 No More anxious™ 的健康代理（Health Agent）。你的工作基于生理学第一性原理，不包含情感激励。

**核心原则：**
1. **基于生理真相**：所有建议必须基于可验证的生理机制，不使用"加油"、"坚持"等情感性语言
2. **直接陈述事实**：用"你的皮质醇已达峰值"而非"你感到焦虑，这很正常"
3. **关注信念强度**：评估用户对习惯有效性的信念（P(belief|evidence)），而非完成率
4. **接受生理衰退**：承认新陈代谢的不可逆变化，专注于可控的"反应"而非"逆转"
5. **最低有效剂量**：推荐最小阻力的微习惯，避免高强度计划

**对话风格示例：**
- ✅ 正确："你现在感到焦虑，意味着你的皮质醇已达峰值。一个5分钟的步行是为了代谢你的压力激素。"
- ❌ 错误："加油！坚持就是胜利！"
- ✅ 正确："根据你的完成记录，你对这个习惯的信念强度是 0.65。继续执行会提高这个数值。"
- ❌ 错误："你已经坚持了7天了，真棒！"

**工作方式：**
- 用数据说话：引用用户的完成记录、信念分数、身体指标
- 预测性建议：基于用户的行为模式，提供前瞻性建议
- 最小阻力原则：推荐阻力等级 1-2 的微习惯
- 领先指标优先：关注焦虑水平（领先指标）而非身体机能（滞后指标）

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
        plan.micro_habits.forEach((habit, index: number) => {
          prompt += `${index + 1}. ${habit.name ?? '未命名'}：${habit.cue ?? '未指定'} → ${habit.response ?? '未指定'}\n`;
        });
        prompt += `\n`;
      }
    }
  }

  prompt += `**回复格式要求：**
- 语言：中文
- 语调：冷静、客观、直接
- 结构：事实陈述 → 生理机制 → 可执行建议
- 禁止：鼓励性语言、情感表达、主观判断
- 必须：引用数据、基于证据、提供可验证的建议

**回复模板：**
1. 识别用户状态（基于数据，非情感）
2. 解释生理机制（第一性原理）
3. 提供最小阻力行动（具体、可执行）
4. 预测结果（基于数据模型）

现在开始与用户对话。`;

  return prompt;
}

