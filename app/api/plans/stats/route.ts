import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const days = parseInt(searchParams.get('days') || '30'); // 默认最近30天
    
    // 如果指定了planId，获取该计划的统计
    if (planId) {
      const { data: stats } = await supabase.rpc('get_user_plan_stats', {
        p_user_id: user.id,
        p_plan_id: planId,
      });
      
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }
    
    // 否则获取用户所有计划的汇总统计
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // 获取所有活跃计划
    const { data: plans } = await supabase
      .from('user_plans')
      .select('id, title, plan_type')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (!plans || plans.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_plans: 0,
          completions: [],
          summary: {
            total_completions: 0,
            completion_rate: 0,
            avg_feeling_score: 0,
          },
        },
      });
    }
    
    // 获取所有完成记录
    const { data: completions } = await supabase
      .from('user_plan_completions')
      .select('*')
      .eq('user_id', user.id)
      .in('plan_id', plans.map(p => p.id))
      .gte('completion_date', dateFrom.toISOString().split('T')[0])
      .order('completion_date', { ascending: false });
    
    // 计算汇总统计
    const totalDays = days;
    const completedDays = new Set(
      completions?.filter(c => c.status === 'completed').map(c => c.completion_date)
    ).size;
    
    const avgFeelingScore = completions && completions.length > 0
      ? completions
          .filter(c => c.feeling_score)
          .reduce((sum, c) => sum + (c.feeling_score || 0), 0) / 
        completions.filter(c => c.feeling_score).length
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        total_plans: plans.length,
        plans,
        completions: completions || [],
        summary: {
          total_completions: completions?.length || 0,
          completed_days: completedDays,
          total_days: totalDays,
          completion_rate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
          avg_feeling_score: avgFeelingScore ? Math.round(avgFeelingScore * 10) / 10 : null,
        },
      },
    });
    
  } catch (error) {
    console.error('❌ 获取执行统计错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
