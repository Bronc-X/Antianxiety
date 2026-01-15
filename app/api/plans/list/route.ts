import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

type PlanContentItem = {
  id?: string | number | null;
  text?: string | null;
  completed?: boolean | string | null;
  status?: string | null;
};

type PlanContent = {
  items?: PlanContentItem[];
};

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
        { error: '请先登录' },
        { status: 401 }
      );
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 查询用户的计划
    let query = supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // 按状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: plans, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('❌ 获取计划失败:', fetchError);
      return NextResponse.json(
        { error: '获取计划失败', details: fetchError.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ 获取到 ${plans?.length || 0} 个计划`);
    
    // 调试：打印第一个计划的 content 详情
    if (plans && plans.length > 0) {
      const firstPlan = plans[0];
      const content = firstPlan.content as PlanContent | null;
      console.log('📋 第一个计划的 content:', JSON.stringify(content, null, 2));
      if (content?.items) {
        console.log('📋 items 详情:', content.items.map((item, i) => ({
          index: i,
          id: item.id,
          text: item.text?.substring(0, 30),
          completed: item.completed,
          status: item.status,
        })));
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        plans: plans || [],
        count: plans?.length || 0,
      },
    });
    
  } catch (error) {
    console.error('❌ 获取计划API错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
