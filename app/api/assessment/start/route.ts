import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { AssessmentRequestSchema, QuestionStep, AssessmentSession } from '@/types/assessment';

const BASELINE_QUESTIONS = {
  biological_sex: {
    id: 'baseline_sex',
    text_zh: '您的生理性别是？',
    text_en: 'What is your biological sex?',
    description_zh: '生理性别是某些疾病的风险因素，您的回答对于准确评估很重要。',
    description_en: 'Biological sex is a risk factor for some conditions. Your answer is necessary for an accurate assessment.',
    type: 'single_choice' as const,
    options: [
      { value: 'female', label_zh: '女性', label_en: 'Female', icon: '♀' },
      { value: 'male', label_zh: '男性', label_en: 'Male', icon: '♂' },
    ],
    category: 'demographics' as const,
  },
  age: {
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
  smoking: {
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
};

type BaselineQuestion = (typeof BASELINE_QUESTIONS)[keyof typeof BASELINE_QUESTIONS];

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: `认证错误: ${authError.message}` } },
        { status: 401 },
      );
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const parsed = AssessmentRequestSchema.safeParse(body);

    const language = parsed.success ? parsed.data.language : 'zh';
    const countryCode = parsed.success ? parsed.data.country_code : 'CN';

    let existingSession: AssessmentSession | null = null;
    try {
      const { data, error } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        existingSession = data as AssessmentSession;
      }
    } catch (e) {
      console.log('Could not check existing sessions:', e);
    }

    if (existingSession) {
      return restoreSession(existingSession, language);
    }

    let healthProfile = null;
    try {
      const { data } = await supabase
        .from('ai_memory')
        .select('content, metadata')
        .eq('user_id', user.id)
        .eq('metadata->>type', 'health_profile')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      healthProfile = data;
    } catch {
      console.log('Health profile not found, continuing without it');
    }

    let demographics = {};
    if (healthProfile?.content) {
      try {
        demographics = JSON.parse(healthProfile.content);
      } catch {
        console.log('Could not parse health profile content');
      }
    }

    const { data: newSession, error: createError } = await supabase
      .from('assessment_sessions')
      .insert({
        user_id: user.id,
        phase: 'baseline',
        status: 'active',
        demographics,
        language,
        country_code: countryCode,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create session:', createError);

      if (createError.message?.includes('relation') || createError.code === '42P01') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_NOT_SETUP',
              message: '数据库表未创建，请先执行 SQL migration (assessment_sessions)',
            },
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: `创建会话失败: ${createError.message}` } },
        { status: 500 },
      );
    }

    if (!newSession) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '创建会话失败，未返回数据' } },
        { status: 500 },
      );
    }

    const firstQuestion = BASELINE_QUESTIONS.biological_sex;
    const response: QuestionStep = {
      step_type: 'question',
      session_id: newSession.id,
      phase: 'baseline',
      question: {
        id: firstQuestion.id,
        text: language === 'zh' ? firstQuestion.text_zh : firstQuestion.text_en,
        description: language === 'zh' ? firstQuestion.description_zh : firstQuestion.description_en,
        type: firstQuestion.type,
        options: firstQuestion.options.map((opt) => ({
          value: opt.value,
          label: language === 'zh' ? opt.label_zh : opt.label_en,
          icon: opt.icon,
        })),
        progress: 5,
        category: firstQuestion.category,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorInfo = error as { message?: string; code?: string; stack?: string };
    console.error('Assessment start error:', errorInfo);
    console.error('Error stack:', errorInfo.stack);

    if (errorInfo.message?.includes('relation') && errorInfo.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_NOT_SETUP', message: '数据库表未创建，请先执行 SQL migration' },
        },
        { status: 500 },
      );
    }

    if (errorInfo.code === '42501' || errorInfo.message?.includes('policy')) {
      return NextResponse.json(
        { success: false, error: { code: 'RLS_ERROR', message: '数据库权限错误，请检查 RLS 策略' } },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: `服务暂时不可用: ${errorInfo.message || '未知错误'}` } },
      { status: 500 },
    );
  }
}

function restoreSession(session: AssessmentSession, language: string): NextResponse {
  const history = session.history || [];
  const answeredQuestionIds = history.map((h) => h.question_id);

  let nextQuestion: BaselineQuestion | undefined;
  let progress = 5;

  if (session.phase === 'baseline') {
    const baselineOrder = ['biological_sex', 'age', 'smoking'] as const;
    for (const key of baselineOrder) {
      const q = BASELINE_QUESTIONS[key];
      if (!answeredQuestionIds.includes(q.id)) {
        nextQuestion = q;
        progress = baselineOrder.indexOf(key) * 10 + 5;
        break;
      }
    }
  }

  if (!nextQuestion) {
    return NextResponse.json({
      step_type: 'question',
      session_id: session.id,
      phase: 'chief_complaint',
      question: {
        id: 'chief_complaint',
        text: language === 'zh' ? '您今天哪里不舒服？' : 'What brings you here today?',
        description:
          language === 'zh'
            ? '请描述您的主要症状，例如：头痛、胸闷、膝盖痛...'
            : 'Please describe your main symptom, e.g., headache, chest tightness, knee pain...',
        type: 'symptom_search',
        progress: 35,
        category: 'associated',
      },
    } as QuestionStep);
  }

  const response: QuestionStep = {
    step_type: 'question',
    session_id: session.id,
    phase: 'baseline',
    question: {
      id: nextQuestion.id,
      text: language === 'zh' ? nextQuestion.text_zh : nextQuestion.text_en,
      description: language === 'zh' ? nextQuestion.description_zh : nextQuestion.description_en,
      type: nextQuestion.type,
      options: nextQuestion.options.map((opt) => ({
        value: opt.value,
        label: language === 'zh' ? opt.label_zh : opt.label_en,
        icon: opt.icon,
      })),
      progress,
      category: nextQuestion.category,
    },
  };

  return NextResponse.json(response);
}
