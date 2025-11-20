import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'edge';

/**
 * Web3钱包认证API
 * 使用钱包地址进行认证
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: '钱包地址无效' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 检查是否已存在该钱包地址的用户
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示未找到记录，这是正常的
      console.error('检查用户时出错:', checkError);
    }

    // 如果用户已存在，使用钱包地址作为邮箱登录
    // 注意：这需要预先创建账户，或者使用自定义认证流程
    // 这里使用一个简化的方式：使用钱包地址作为唯一标识符
    
    // 生成一个基于钱包地址的邮箱
    const email = `${address.toLowerCase()}@web3.local`;
    
    // 尝试登录（如果用户不存在会失败）
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: address.toLowerCase(), // 使用地址作为密码
    });

    if (signInError) {
      // 如果登录失败，尝试注册新用户
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: address.toLowerCase(),
        options: {
          data: {
            wallet_address: address.toLowerCase(),
            auth_type: 'web3',
          },
        },
      });

      if (signUpError) {
        return NextResponse.json(
          { error: signUpError.message || 'Web3钱包登录失败' },
          { status: 400 }
        );
      }

      // 注册成功，创建profile记录
      if (signUpData.user) {
        await supabase.from('profiles').insert({
          id: signUpData.user.id,
          wallet_address: address.toLowerCase(),
        });
      }

      return NextResponse.json({
        success: true,
        user: signUpData.user,
        session: signUpData.session,
      });
    }

    // 登录成功
    return NextResponse.json({
      success: true,
      user: signInData.user,
      session: signInData.session,
    });
  } catch (error) {
    console.error('Web3钱包认证错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

