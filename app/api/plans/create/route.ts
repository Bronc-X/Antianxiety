import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { formatPlanForStorage, type ParsedPlan } from '@/lib/plan-parser';

export const runtime = 'edge';

interface CreatePlanRequest {
  plans: ParsedPlan[];
  sessionId?: string;
}

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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // 验证用户登录
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    // 解析请求
    const body: CreatePlanRequest = await request.json();
    const { plans, sessionId } = body;

    if (!plans || plans.length === 0) {
      return NextResponse.json(
        { error: '方案列表不能为空' },
        { status: 400 }
      );
    }

    console.log(`📝 用户 ${user.id} 创建 ${plans.length} 个方案`);

    // 格式化并插入计划
    const formattedPlans = plans.map(plan => {
      const formatted = formatPlanForStorage(plan);

      // 推断方案类型
      const planType = inferPlanType(plan.content);

      return {
        user_id: user.id,
        source: 'ai_assistant',
        plan_type: planType,
        title: plan.title,
        content: {
          description: plan.content,
          items: formatted.items, // 🆕 Save structured items
          sessionId: sessionId || null,
        },
        difficulty: formatted.difficulty,
        expected_duration_days: formatted.expected_duration_days,
        status: 'active',
      };
    });

    // 批量插入
    const { data: insertedPlans, error: insertError } = await supabase
      .from('user_plans')
      .insert(formattedPlans)
      .select();

    if (insertError) {
      console.error('❌ 插入计划失败:', insertError);
      return NextResponse.json(
        { error: '保存计划失败', details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`✅ 成功创建 ${insertedPlans.length} 个计划`);
    console.log('📊 创建的计划详情:', insertedPlans);

    return NextResponse.json({
      success: true,
      message: `成功保存 ${insertedPlans.length} 个计划`,
      data: {
        plans: insertedPlans,
        count: insertedPlans.length,
      },
    });

  } catch (error) {
    console.error('❌ 创建计划API错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

/**
 * 根据内容推断方案类型
 */
function inferPlanType(content: string): string {
  const lowerContent = content.toLowerCase();

  // 检测关键词
  const hasExercise = /运动|健身|训练|跑步|有氧|抗阻/i.test(content);
  const hasDiet = /饮食|禁食|营养|蛋白质|碳水|脂肪/i.test(content);
  const hasSleep = /睡眠|休息|作息/i.test(content);

  // 综合判断
  const count = [hasExercise, hasDiet, hasSleep].filter(Boolean).length;

  if (count >= 2) return 'comprehensive';
  if (hasExercise) return 'exercise';
  if (hasDiet) return 'diet';
  if (hasSleep) return 'sleep';

  return 'comprehensive';
}
