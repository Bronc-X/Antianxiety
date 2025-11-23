import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface CompletePlanRequest {
  planId: string;
  completionDate?: string; // 可选，默认今天
  status: 'completed' | 'partial' | 'skipped';
  completedItems?: any;
  notes?: string;
  feelingScore?: number; // 1-5分
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
    const body: CompletePlanRequest = await request.json();
    const { planId, completionDate, status, completedItems, notes, feelingScore } = body;
    
    if (!planId || !status) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      );
    }
    
    // 验证该计划属于当前用户
    const { data: plan, error: planError } = await supabase
      .from('user_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json(
        { error: '计划不存在或无权访问' },
        { status: 403 }
      );
    }
    
    // 使用今天的日期（如果未提供）
    const dateToUse = completionDate || new Date().toISOString().split('T')[0];
    
    console.log(`📝 用户 ${user.id} 记录计划 ${planId} 的执行情况: ${status}`);
    
    // 插入或更新完成记录
    const { data: completion, error: insertError } = await supabase
      .from('user_plan_completions')
      .upsert(
        {
          user_id: user.id,
          plan_id: planId,
          completion_date: dateToUse,
          status,
          completed_items: completedItems || null,
          notes: notes || null,
          feeling_score: feelingScore || null,
        },
        {
          onConflict: 'user_id,plan_id,completion_date',
        }
      )
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 记录执行状态失败:', insertError);
      return NextResponse.json(
        { error: '记录失败', details: insertError.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ 成功记录执行状态`);
    
    return NextResponse.json({
      success: true,
      data: {
        completion,
      },
    });
    
  } catch (error) {
    console.error('❌ 记录执行状态API错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
