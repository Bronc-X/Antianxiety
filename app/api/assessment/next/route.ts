import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import {
  AssessmentRequestSchema,
  QuestionStep,
  ReportStep,
  AnswerRecord,
  Condition,
} from '@/types/assessment';
import { storeReport, storeAssessmentToMemory } from '@/lib/assessment/report-storage';
import {
  checkRedFlags,
  generateEmergencyResponse,
  logRedFlagEvent,
} from '@/lib/assessment/red-flag';
import { aiClient, getModelPriority, logModelCall } from '@/lib/ai/model-config';

// 固定推理优先级（不依赖环境变量）
const MODEL_CANDIDATES = getModelPriority('reasoning');

const AIQuestionSchema = z.object({
  should_generate_report: z.boolean().describe('True if confident enough (>80%) or asked 12+ questions'),
  confidence: z.number().min(0).max(100).describe('Current diagnostic confidence 0-100'),
  question: z
    .object({
      text: z.string().describe('The question text in the specified language'),
      type: z.enum(['single_choice', 'multiple_choice', 'boolean', 'scale']),
      options: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
            description: z.string().optional(),
          }),
        )
        .optional()
        .describe('Options for choice types, 2-6 options, must include "I don\'t know"'),
      category: z.enum(['location', 'severity', 'timing', 'associated', 'triggers']),
    })
    .optional(),
  report: z
    .object({
      conditions: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          probability: z.number().min(0).max(100),
          matched_symptoms: z.array(z.string()),
        }),
      ),
      urgency: z.enum(['emergency', 'urgent', 'routine', 'self_care']),
      next_steps: z.array(
        z.object({
          action: z.string(),
          icon: z.string(),
        }),
      ),
    })
    .optional(),
});

const BASELINE_QUESTIONS = [
  {
    id: 'baseline_sex',
    text_zh: '您的生理性别是？',
    text_en: 'What is your biological sex?',
    type: 'single_choice' as const,
    options: [
      { value: 'female', label_zh: '女性', label_en: 'Female' },
      { value: 'male', label_zh: '男性', label_en: 'Male' },
    ],
    category: 'demographics' as const,
  },
  {
    id: 'baseline_age',
    text_zh: '您的年龄是？',
    text_en: 'How old are you?',
    type: 'single_choice' as const,
    options: [
      { value: '0-17', label_zh: '17岁以下', label_en: 'Under 18' },
      { value: '18-29', label_zh: '18-29岁', label_en: '18-29' },
      { value: '30-44', label_zh: '30-44岁', label_en: '30-44' },
      { value: '45-59', label_zh: '45-59岁', label_en: '45-59' },
      { value: '60-74', label_zh: '60-74岁', label_en: '60-74' },
      { value: '75+', label_zh: '75岁以上', label_en: '75 or older' },
    ],
    category: 'demographics' as const,
  },
  {
    id: 'baseline_smoking',
    text_zh: '您吸烟吗？',
    text_en: 'Do you smoke?',
    type: 'single_choice' as const,
    options: [
      { value: 'never', label_zh: '从不吸烟', label_en: 'Never smoked' },
      { value: 'former', label_zh: '已戒烟', label_en: 'Former smoker' },
      { value: 'current', label_zh: '目前吸烟', label_en: 'Current smoker' },
    ],
    category: 'history' as const,
  },
];

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = AssessmentRequestSchema.safeParse(body);

    if (!parsed.success || !parsed.data.session_id) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: '请求格式有误' } },
        { status: 400 },
      );
    }

    const { session_id, answer, language } = parsed.data;

    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: '找不到您的评估会话' } },
        { status: 404 },
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('assessment_sessions').update({ status: 'expired' }).eq('id', session_id);

      return NextResponse.json(
        { success: false, error: { code: 'SESSION_EXPIRED', message: '您的评估会话已过期' } },
        { status: 410 },
      );
    }

    const history: AnswerRecord[] = session.history || [];
    if (answer) {
      // 🔑 从当前步骤获取问题文本，确保 AI 能看到完整的问答历史
      const currentQuestionText = session.current_question_text || answer.question_id;
      history.push({
        question_id: answer.question_id,
        question_text: currentQuestionText,
        value: answer.value,
        input_method: answer.input_method,
        answered_at: new Date().toISOString(),
      });
    }

    const redFlagCheck = checkRedFlags(session.symptoms || [], session.chief_complaint || '', history);

    if (redFlagCheck.triggered && redFlagCheck.pattern) {
      await logRedFlagEvent(
        session_id,
        user.id,
        redFlagCheck.pattern,
        redFlagCheck.matchedTerms || [],
        {
          chief_complaint: session.chief_complaint || '',
          symptoms: session.symptoms || [],
          history,
        },
      );

      return NextResponse.json(
        generateEmergencyResponse(
          session_id,
          redFlagCheck.pattern,
          redFlagCheck.matchedTerms || [],
          language,
          session.country_code || 'CN',
        ),
      );
    }

    await supabase
      .from('assessment_sessions')
      .update({
        history,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (session.phase === 'baseline') {
      const baselineResponse = getNextBaselineQuestion(session_id, history, language);
      if (baselineResponse) {
        return NextResponse.json(baselineResponse);
      }

      await supabase.from('assessment_sessions').update({ phase: 'chief_complaint' }).eq('id', session_id);

      return NextResponse.json({
        step_type: 'question',
        session_id,
        phase: 'chief_complaint',
        question: {
          id: 'chief_complaint',
          text: language === 'zh' ? '您今天哪里不舒服？' : 'What brings you here today?',
          description:
            language === 'zh'
              ? '请描述您的主要症状，例如：头痛、胸闷、膝盖痛...'
              : 'Please describe your main symptom, e.g., headache, chest tightness, knee pain...',
          type: 'text',
          progress: 35,
          category: 'associated',
        },
      } as QuestionStep);
    }

    if (session.phase === 'chief_complaint' && answer) {
      await supabase
        .from('assessment_sessions')
        .update({
          chief_complaint: String(answer.value),
          symptoms: [String(answer.value)],
          phase: 'differential',
        })
        .eq('id', session_id);
    }

    const questionCount = history.length;
    const shouldTerminate = questionCount >= 12;

    // 🔑 调试：打印历史记录，确认 AI 能看到完整问答
    console.log(`📊 问答历史 (${questionCount} 条):`);
    history.forEach((h, i) => {
      console.log(`  Q${i + 1}: ${h.question_text || h.question_id} → A: ${JSON.stringify(h.value)}`);
    });

    console.log(`🤖 调用 AI 生成问题，模型优先级: ${MODEL_CANDIDATES.join(' → ')}`);
    logModelCall(MODEL_CANDIDATES[0], 'assessment-next');

    const systemPrompt = buildSystemPrompt(
      { ...session, chief_complaint: session.chief_complaint || (answer ? String(answer.value) : '') },
      history,
      language,
      shouldTerminate,
    );

    let result: Awaited<ReturnType<typeof generateText>>;
    try {
      result = await callLlmWithFallback(systemPrompt);
    } catch (llmError: unknown) {
      const llmInfo = llmError as { message?: string; statusCode?: number; responseBody?: unknown };
      console.error('AI 调用失败，使用兜底问题。', {
        message: llmInfo.message,
        statusCode: llmInfo.statusCode,
        responseBody: llmInfo.responseBody,
      });
      return NextResponse.json(buildFallbackQuestion(session_id, questionCount, language, 'timing'));
    }

    let aiResponse: z.infer<typeof AIQuestionSchema>;
    try {
      let jsonStr = result.text.trim();
      
      // 🔑 处理 thinking 模型的 <think>...</think> 标签
      if (jsonStr.includes('<think>') && jsonStr.includes('</think>')) {
        const thinkEndIndex = jsonStr.indexOf('</think>');
        jsonStr = jsonStr.slice(thinkEndIndex + 8).trim();
      }
      
      // 移除 markdown 代码块
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsedJson = JSON.parse(jsonStr);
      const validated = AIQuestionSchema.safeParse(parsedJson);

      if (!validated.success) {
        console.error('AI 响应格式校验失败:', validated.error);
        return NextResponse.json(buildFallbackQuestion(session_id, questionCount, language, 'timing'));
      }

      aiResponse = validated.data;
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError, 'Raw response:', result.text);
      return NextResponse.json(buildFallbackQuestion(session_id, questionCount, language, 'severity'));
    }

    if (aiResponse.should_generate_report && aiResponse.report) {
      const conditions: Condition[] = aiResponse.report.conditions
        .sort((a, b) => b.probability - a.probability)
        .map((c, i) => ({ ...c, is_best_match: i === 0 }));

      const reportData = {
        conditions,
        urgency: aiResponse.report.urgency,
        next_steps: aiResponse.report.next_steps,
      };

      // 存储报告到数据库
      const storeResult = await storeReport(session_id, user.id, reportData, language);
      if (!storeResult.success) {
        console.error('Failed to store report:', storeResult.error);
      }

      // 存储到 The Brain 记忆系统
      const chiefComplaint = session.chief_complaint || (answer ? String(answer.value) : '');
      const symptoms = session.symptoms || [];
      
      const memoryResult = await storeAssessmentToMemory(
        user.id,
        session_id,
        reportData,
        chiefComplaint,
        symptoms,
        language
      );
      if (!memoryResult.success) {
        console.error('Failed to store to memory:', memoryResult.error);
      }

      const response: ReportStep = {
        step_type: 'report',
        session_id,
        phase: 'report',
        report: {
          conditions,
          urgency: aiResponse.report.urgency,
          next_steps: aiResponse.report.next_steps,
          disclaimer:
            language === 'zh'
              ? '此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请咨询医生。'
              : 'This assessment is for reference only and cannot replace professional medical diagnosis. Please consult a doctor if you have concerns.',
        },
      };

      return NextResponse.json(response);
    }

    if (!aiResponse.question) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_NO_QUESTION', message: 'AI 未生成问题' } },
        { status: 500 },
      );
    }

    let options = aiResponse.question.options || [];
    if ((aiResponse.question.type === 'single_choice' || aiResponse.question.type === 'multiple_choice') && options.length > 0) {
      // 🔑 先过滤掉 AI 可能已经添加的 unknown/none 选项，确保我们统一添加在最后
      options = options.filter(
        (o) => o.value !== 'unknown' && 
               o.value !== 'none_of_above' && 
               !o.label.includes('不知道') && 
               !o.label.includes('以上都不是') &&
               !o.label.toLowerCase().includes("don't know") &&
               !o.label.toLowerCase().includes('none of the above')
      );
      
      // 添加"以上都不是"选项（倒数第二）
      options.push({
        value: 'none_of_above',
        label: language === 'zh' ? '以上都不是' : 'None of the above',
        description: language === 'zh' ? '点击输入您的实际情况' : 'Click to describe your situation',
      });
      
      // 添加"我不知道"选项（最后）
      options.push({
        value: 'unknown',
        label: language === 'zh' ? '我不知道' : "I don't know",
      });
    }

    const questionText = aiResponse.question.text;
    const questionId = `q_${questionCount + 1}`;
    
    // 🔑 保存当前问题文本到 session，下次回答时可以获取
    await supabase
      .from('assessment_sessions')
      .update({
        current_question_text: questionText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    const response: QuestionStep = {
      step_type: 'question',
      session_id,
      phase: 'differential',
      question: {
        id: questionId,
        text: questionText,
        type: aiResponse.question.type,
        options: options.length > 0 ? options : undefined,
        progress: Math.min(35 + questionCount * 5, 95),
        category: aiResponse.question.category,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorInfo = error as { message?: string; statusCode?: number; responseBody?: unknown; cause?: unknown };
    console.error('Assessment next error:', errorInfo);
    console.error('Error details:', {
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      responseBody: errorInfo.responseBody,
      cause: errorInfo.cause,
    });

    if (errorInfo.message?.includes('relation') && errorInfo.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_NOT_SETUP',
            message: '数据库表未创建，请先执行 SQL migration',
          },
        },
        { status: 500 },
      );
    }

    if (errorInfo.statusCode === 403) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_FORBIDDEN',
            message: `AI API 访问被拒绝(403): ${errorInfo.responseBody || '请检查 API 密钥和中转站配置'}`,
          },
        },
        { status: 500 },
      );
    }

    if (errorInfo.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_UNAUTHORIZED', message: 'AI API 密钥无效 (401)' } },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: `服务暂时不可用: ${errorInfo.message || '未知错误'}` } },
      { status: 500 },
    );
  }
}

async function callLlmWithFallback(systemPrompt: string) {
  let lastError: unknown = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`🔄 尝试模型: ${modelName}`);
      return await generateText({
        model: aiClient(modelName),
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Generate the next step based on the assessment context. Return ONLY valid JSON, no markdown code blocks.',
          },
        ],
      });
    } catch (err: unknown) {
      lastError = err;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const statusCode = (err as { statusCode?: number })?.statusCode;
      console.error(`❌ 模型 ${modelName} 失败:`, { message: errorMessage, statusCode });
    }
  }

  throw lastError || new Error('所有模型均调用失败');
}

function buildFallbackQuestion(
  sessionId: string,
  questionCount: number,
  language: string,
  variant: 'timing' | 'severity',
): QuestionStep {
  if (variant === 'severity') {
    return {
      step_type: 'question',
      session_id: sessionId,
      phase: 'differential',
      question: {
        id: `q_${questionCount + 1}`,
        text: language === 'zh' ? '症状的严重程度如何？' : 'How severe are your symptoms?',
        type: 'scale',
        min: 1,
        max: 10,
        progress: Math.min(35 + questionCount * 5, 95),
        category: 'severity',
      },
    };
  }

  return {
    step_type: 'question',
    session_id: sessionId,
    phase: 'differential',
    question: {
      id: `q_${questionCount + 1}`,
      text: language === 'zh' ? '您的症状持续多长时间了？' : 'How long have you had these symptoms?',
      type: 'single_choice',
      options: [
        { value: 'hours', label: language === 'zh' ? '几小时以内' : 'A few hours' },
        { value: 'days', label: language === 'zh' ? '几天' : 'A few days' },
        { value: 'weeks', label: language === 'zh' ? '几周' : 'A few weeks' },
        { value: 'months', label: language === 'zh' ? '几个月或更长' : 'Months or longer' },
        { value: 'unknown', label: language === 'zh' ? '我不知道' : "I don't know" },
      ],
      progress: Math.min(35 + questionCount * 5, 95),
      category: 'timing',
    },
  };
}

function getNextBaselineQuestion(sessionId: string, history: AnswerRecord[], language: string): QuestionStep | null {
  const answeredIds = history.map((h) => h.question_id);

  for (let i = 0; i < BASELINE_QUESTIONS.length; i++) {
    const q = BASELINE_QUESTIONS[i];
    if (!answeredIds.includes(q.id)) {
      return {
        step_type: 'question',
        session_id: sessionId,
        phase: 'baseline',
        question: {
          id: q.id,
          text: language === 'zh' ? q.text_zh : q.text_en,
          type: q.type,
          options: q.options.map((opt) => ({
            value: opt.value,
            label: language === 'zh' ? opt.label_zh : opt.label_en,
          })),
          progress: (i + 1) * 10,
          category: q.category,
        },
      };
    }
  }

  return null;
}

type PromptSession = {
  demographics?: unknown;
  chief_complaint?: string | null;
  symptoms?: string[] | null;
};

function buildSystemPrompt(
  session: PromptSession,
  history: AnswerRecord[],
  language: string,
  shouldTerminate: boolean,
): string {
  const langInstruction = language === 'zh'
    ? '请用中文生成问题和报告内容。'
    : 'Generate questions and report content in English.';

  return `You are Bio-Ledger Assessment Engine, an expert medical AI performing differential diagnosis.

## LANGUAGE
${langInstruction}

## PATIENT CONTEXT
Demographics: ${JSON.stringify(session.demographics)}
Chief Complaint: "${session.chief_complaint || 'Not specified'}"
Confirmed Symptoms: ${JSON.stringify(session.symptoms || [])}

## CONVERSATION HISTORY
${history.map((h, i) => `Q${i + 1}: ${h.question_text || h.question_id}\nA${i + 1}: ${JSON.stringify(h.value)}`).join('\n\n')}

## RULES
1. Ask ONE clear, specific question at a time
2. Use Bayesian reasoning: adjust probabilities based on each answer
3. Question types:
   - single_choice: Pick one from 2-6 options (MUST include "I don't know")
   - multiple_choice: Select multiple symptoms
   - boolean: Yes/No questions
   - scale: 1-10 severity rating
4. Categories: location, severity, timing, associated (symptoms), triggers
5. ${shouldTerminate ? 'You MUST generate a report now (12+ questions asked).' : 'Generate report when confidence > 80% or after 10-12 questions.'}
6. **CRITICAL: NEVER repeat a question that has already been asked!** Review the CONVERSATION HISTORY carefully before generating a new question. Each question must explore a NEW aspect of the patient's condition.
7. If the patient answers "none_of_above" or provides a custom answer starting with "custom:", this means the previous options didn't match their situation. You MUST:
   - Acknowledge their input
   - Adjust your diagnostic direction significantly
   - Ask about completely different symptoms or aspects
   - Consider the custom description as important new information

## REPORT REQUIREMENTS
When generating a report:
- List 2-4 possible conditions ranked by probability
- Include matched symptoms for each condition
- Set urgency based on ACTUAL severity:
  * emergency: Life-threatening (chest pain + shortness of breath, severe bleeding, loss of consciousness)
  * urgent: Needs attention within 24h (high fever >39°C, severe pain, infection signs)
  * routine: Can wait for scheduled appointment (chronic mild symptoms, general discomfort)
  * self_care: Can be managed at home (common cold, mild headache, minor fatigue) - USE THIS MORE OFTEN for non-serious symptoms!
- **IMPORTANT**: Do NOT default to "routine" or "urgent" for common, non-serious symptoms. Most headaches, mild fatigue, and general discomfort should be "self_care".
- Provide actionable next_steps with icons (🏥 hospital, 💊 medication, 🛏️ rest, 📞 call doctor, 🧘 relaxation, 💧 hydration)

## OUTPUT FORMAT (CRITICAL - MUST FOLLOW EXACTLY)
Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:

For a question:
{"should_generate_report":false,"confidence":30,"question":{"text":"问题文本","type":"single_choice","options":[{"value":"opt1","label":"选项1"},{"value":"opt2","label":"选项2"},{"value":"unknown","label":"我不知道"}],"category":"severity"}}

For a report:
{"should_generate_report":true,"confidence":85,"report":{"conditions":[{"name":"条件名","description":"描述","probability":70,"matched_symptoms":["症状1"]}],"urgency":"routine","next_steps":[{"action":"建议","icon":"🏥"}]}}`;
}
