import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * 直接注册 API - 绕过邮件验证
 * 使用 admin API 创建已验证的用户
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 创建 admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 使用 admin API 创建已验证的用户
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // 直接标记邮箱已验证
      user_metadata: {
        signup_method: 'email',
      },
    });

    if (createError) {
      console.error('创建用户失败:', createError);
      
      // 处理常见错误
      if (createError.message?.includes('already registered') || 
          createError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: createError.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!newUser?.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // 返回成功，前端会用密码登录
    return NextResponse.json({
      success: true,
      userId: newUser.user.id,
      message: 'Account created successfully',
    });

  } catch (error) {
    const err = error as Error;
    console.error('注册 API 错误:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
