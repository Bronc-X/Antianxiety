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
