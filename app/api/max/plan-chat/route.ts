/**
 * Max Plan Chat API
 * 
 * 处理 Max 协助制定计划的对话交互
 * 支持 init、respond、generate、skip 动作
 * 
 * @module app/api/max/plan-chat/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { aggregatePlanData } from '@/lib/max/plan-data-aggregator';
import { generateQuestionsFromDataStatus, getNextQuestion, parseQuestionResponse, MAX_QUESTIONS } from '@/lib/max/question-generator';
import { generatePlan, generateFallbackPlan } from '@/lib/max/plan-generator';
import type {
  PlanChatRequest,
  PlanChatResponse,
  ChatMessage,
  PlanItemDraft,
  DataStatus,
  QuestionType,
} from '@/types/max-plan';

export const runtime = 'edge';

// 会话存储（生产环境应使用 Redis）
const sessions = new Map<string, SessionData>();

interface SessionData {
  userId: string;
  createdAt: Date;
  dataStatus: DataStatus;
  askedQuestions: QuestionType[];
  userResponses: Record<string, string>;
  planItems: PlanItemDraft[];
  language: 'zh' | 'en';
}

// 会话过期时间（30分钟）
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // 验证用户登录
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      );
    }

    // 解析请求
    const body: PlanChatRequest = await request.json();
    const { action, message, sessionId, questionId, language: requestLanguage } = body;

    // 优先使用请求中的语言，其次使用 header，最后默认中文
    const langHeader = request.headers.get('X-Language-Preference') || request.headers.get('accept-language') || '';
    const language: 'zh' | 'en' = requestLanguage || (langHeader.startsWith('en') ? 'en' : 'zh');

    // 清理过期会话
    cleanupExpiredSessions();

    switch (action) {
      case 'init':
        return handleInit(user.id, language, supabase);
      
      case 'respond':
        return handleRespond(sessionId, questionId, message, language);
      
      case 'generate':
        return handleGenerate(sessionId, language, supabase);
      
      case 'skip':
        return handleSkip(sessionId, language);
      
      default:
        return NextResponse.json(
          { success: false, error: '无效的操作类型' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[MaxPlanChat] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '服务暂时不可用，请稍后再试',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 处理初始化请求
 */
async function handleInit(
  userId: string,
  language: 'zh' | 'en',
  supabase: SupabaseClient
): Promise<NextResponse<PlanChatResponse>> {
  // 聚合用户数据
  const aggregatedData = await aggregatePlanData(userId, supabase);
  const { dataStatus } = aggregatedData;

  // 创建会话
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  sessions.set(sessionId, {
    userId,
    createdAt: new Date(),
    dataStatus,
    askedQuestions: [],
    userResponses: {},
    planItems: [],
    language,
  });

  // 生成欢迎消息
  const messages: ChatMessage[] = [];
  
  // Max 的欢迎语
  messages.push(createMaxMessage(
    language === 'zh' 
      ? '你好！我是 Max，很高兴能帮你制定一个适合你的健康计划。让我先看看你的情况...'
      : "Hi! I'm Max, and I'm here to help you create a personalized health plan. Let me take a look at your situation...",
    language
  ));

  // 数据分析结果
  const analysisMessage = buildAnalysisMessage(dataStatus, language);
  messages.push(createMaxMessage(analysisMessage, language));

  // 判断下一步
  const questions = generateQuestionsFromDataStatus(dataStatus, language);
  
  if (questions.length > 0) {
    // 需要问问题
    const firstQuestion = questions[0];
    messages.push(createMaxMessage(firstQuestion.text, language, firstQuestion.options));
    
    // 记录已问的问题
    const session = sessions.get(sessionId)!;
    session.askedQuestions.push(firstQuestion.type);

    return NextResponse.json({
      success: true,
      sessionId,
      messages,
      dataStatus,
      nextAction: 'question',
    });
  }

  // 数据充足，直接生成计划
  messages.push(createMaxMessage(
    language === 'zh'
      ? '你的数据很完整，我来为你生成一个个性化的计划...'
      : 'Your data is complete. Let me generate a personalized plan for you...',
    language
  ));

  return NextResponse.json({
    success: true,
    sessionId,
    messages,
    dataStatus,
    nextAction: 'generate',
  });
}

/**
 * 处理用户回答
 */
async function handleRespond(
  sessionId: string | undefined,
  questionId: string | undefined,
  message: string | undefined,
  language: 'zh' | 'en'
): Promise<NextResponse<PlanChatResponse>> {
  void language;
  if (!sessionId || !sessions.has(sessionId)) {
    return NextResponse.json(
      { success: false, error: '会话已过期，请重新开始', sessionId: '', messages: [], dataStatus: { hasInquiryData: false, hasCalibrationData: false, hasHrvData: false }, nextAction: 'complete' as const },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId)!;
  // 使用会话锁定的语言
  const sessionLang = session.language;
  const messages: ChatMessage[] = [];

  // 记录用户回答
  if (questionId && message) {
    // 从 questionId 提取问题类型
    const questionType = questionId.split('_')[1] as QuestionType;
    session.userResponses[questionType] = message;
    
    // 解析回答
    parseQuestionResponse(questionType, message);
  }

  // 注意：不再返回用户消息，前端已经添加了

  // 检查是否需要更多问题
  if (session.askedQuestions.length < MAX_QUESTIONS) {
    const nextQuestion = getNextQuestion(
      session.askedQuestions,
      session.dataStatus,
      sessionLang
    );

    if (nextQuestion) {
      // 添加过渡语
      const transitions = sessionLang === 'zh'
        ? ['好的，了解了。', '明白了。', '收到。']
        : ['Got it.', 'I see.', 'Understood.'];
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      
      messages.push(createMaxMessage(transition, sessionLang));
      messages.push(createMaxMessage(nextQuestion.text, sessionLang, nextQuestion.options));
      
      session.askedQuestions.push(nextQuestion.type);

      return NextResponse.json({
        success: true,
        sessionId,
        messages,
        dataStatus: session.dataStatus,
        nextAction: 'question',
      });
    }
  }

  // 问题问完了，准备生成计划
  messages.push(createMaxMessage(
    sessionLang === 'zh'
      ? '谢谢你的回答！根据你的情况，我来为你制定一个专属计划...'
      : 'Thanks for your answers! Based on your situation, let me create a personalized plan for you...',
    sessionLang
  ));

  return NextResponse.json({
    success: true,
    sessionId,
    messages,
    dataStatus: session.dataStatus,
    nextAction: 'generate',
  });
}

/**
 * 处理生成计划请求
 */
async function handleGenerate(
  sessionId: string | undefined,
  language: 'zh' | 'en',
  supabase: SupabaseClient
): Promise<NextResponse<PlanChatResponse>> {
  if (!sessionId || !sessions.has(sessionId)) {
    return NextResponse.json(
      { success: false, error: '会话已过期，请重新开始', sessionId: '', messages: [], dataStatus: { hasInquiryData: false, hasCalibrationData: false, hasHrvData: false }, nextAction: 'complete' as const },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId)!;
  // 使用会话锁定的语言
  const sessionLang = session.language;
  const messages: ChatMessage[] = [];

  try {
    // 重新聚合数据（确保最新）
    const aggregatedData = await aggregatePlanData(session.userId, supabase);
    
    // 生成计划
    let planItems: PlanItemDraft[];
    
    try {
      planItems = await generatePlan(
        aggregatedData,
        session.userResponses,
        sessionLang,
        'deepseek'
      );
    } catch {
      // AI 失败，使用备用计划
      console.warn('[MaxPlanChat] AI generation failed, using fallback');
      planItems = generateFallbackPlan(aggregatedData, session.userResponses, sessionLang);
    }

    // 保存到会话
    session.planItems = planItems;

    // 生成介绍消息
    messages.push(createMaxMessage(
      sessionLang === 'zh'
        ? `好的，我为你准备了 ${planItems.length} 个行动建议。每个都是根据你的情况精心挑选的，你可以点击"换一个"来替换不喜欢的项目。`
        : `Great! I've prepared ${planItems.length} action items for you. Each one is carefully selected based on your situation. You can tap "Replace" to swap any item you don't like.`,
      sessionLang
    ));

    return NextResponse.json({
      success: true,
      sessionId,
      messages,
      planItems,
      dataStatus: session.dataStatus,
      nextAction: 'review',
    });

  } catch (error) {
    console.error('[MaxPlanChat] Generate error:', error);
    
    messages.push(createMaxMessage(
      sessionLang === 'zh'
        ? '抱歉，生成计划时遇到了一点问题。让我用备用方案为你准备...'
        : 'Sorry, I encountered an issue generating the plan. Let me prepare a backup for you...',
      sessionLang
    ));

    // 使用备用计划
    const aggregatedData = await aggregatePlanData(session.userId, supabase);
    const fallbackItems = generateFallbackPlan(aggregatedData, session.userResponses, sessionLang);
    session.planItems = fallbackItems;

    return NextResponse.json({
      success: true,
      sessionId,
      messages,
      planItems: fallbackItems,
      dataStatus: session.dataStatus,
      nextAction: 'review',
    });
  }
}

/**
 * 处理跳过问题请求
 */
async function handleSkip(
  sessionId: string | undefined,
  language: 'zh' | 'en'
): Promise<NextResponse<PlanChatResponse>> {
  void language;
  if (!sessionId || !sessions.has(sessionId)) {
    return NextResponse.json(
      { success: false, error: '会话已过期，请重新开始', sessionId: '', messages: [], dataStatus: { hasInquiryData: false, hasCalibrationData: false, hasHrvData: false }, nextAction: 'complete' as const },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId)!;
  // 使用会话锁定的语言
  const sessionLang = session.language;
  const messages: ChatMessage[] = [];

  messages.push(createMaxMessage(
    sessionLang === 'zh'
      ? '没问题，我会根据现有信息为你生成计划。'
      : "No problem, I'll generate a plan based on the available information.",
    sessionLang
  ));

  return NextResponse.json({
    success: true,
    sessionId,
    messages,
    dataStatus: session.dataStatus,
    nextAction: 'generate',
  });
}

// ============================================
// 辅助函数
// ============================================

/**
 * 创建 Max 消息
 */
function createMaxMessage(
  content: string,
  language: 'zh' | 'en',
  options?: { label: string; value: string }[]
): ChatMessage {
  return {
    id: `msg_max_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    role: 'max',
    content,
    timestamp: new Date(),
    options,
  };
}

/**
 * 构建数据分析消息
 */
function buildAnalysisMessage(dataStatus: DataStatus, language: 'zh' | 'en'): string {
  const parts: string[] = [];

  if (language === 'zh') {
    if (dataStatus.hasInquiryData && dataStatus.inquirySummary) {
      parts.push(`📋 ${dataStatus.inquirySummary}`);
    }
    if (dataStatus.hasCalibrationData && dataStatus.calibrationSummary) {
      parts.push(`📊 ${dataStatus.calibrationSummary}`);
    }
    if (dataStatus.hasHrvData && dataStatus.hrvSummary) {
      parts.push(`💓 ${dataStatus.hrvSummary}`);
    }

    if (parts.length === 0) {
      return '我注意到你还没有太多健康数据记录，没关系，让我问你几个简单的问题来更好地了解你。';
    }

    return `我看到了你的一些数据：\n${parts.join('\n')}\n\n为了给你更精准的建议，我想再了解一下...`;
  }

  // English
  if (dataStatus.hasInquiryData && dataStatus.inquirySummary) {
    parts.push(`📋 ${dataStatus.inquirySummary}`);
  }
  if (dataStatus.hasCalibrationData && dataStatus.calibrationSummary) {
    parts.push(`📊 ${dataStatus.calibrationSummary}`);
  }
  if (dataStatus.hasHrvData && dataStatus.hrvSummary) {
    parts.push(`💓 ${dataStatus.hrvSummary}`);
  }

  if (parts.length === 0) {
    return "I notice you don't have much health data recorded yet. No worries, let me ask you a few simple questions to better understand you.";
  }

  return `I can see some of your data:\n${parts.join('\n')}\n\nTo give you more accurate recommendations, I'd like to know a bit more...`;
}

/**
 * 清理过期会话
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt.getTime() > SESSION_EXPIRY_MS) {
      sessions.delete(id);
    }
  }
}
