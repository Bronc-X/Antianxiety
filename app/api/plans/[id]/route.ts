import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;
    
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
    
    if (!planId) {
      return NextResponse.json(
        { success: false, error: '缺少计划ID' },
        { status: 400 }
      );
    }
    
    // 删除计划（只能删除自己的）
    const { error: deleteError } = await supabase
      .from('user_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('删除计划失败:', deleteError);
      return NextResponse.json(
        { success: false, error: '删除失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
    
  } catch (error) {
    console.error('删除计划时出错:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
