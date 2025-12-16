/**
 * 用户画像向量化 API
 * 用于生成和更新用户的画像向量
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { updateUserPersonaEmbedding } from '@/lib/userPersona';

export const runtime = 'edge';

/**
 * POST /api/user/persona
 * 更新用户画像向量
 */
export async function POST() {
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

    // 更新用户画像向量
    const result = await updateUserPersonaEmbedding(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '更新用户画像向量失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户画像向量已更新',
    });
  } catch (error) {
    console.error('用户画像向量化 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

