import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'edge';

/**
 * 查询 DeepSeek API 使用情况
 * 注意：DeepSeek API 可能不提供直接的配额查询端点
 * 此接口返回使用建议和说明
 */
export async function GET(_request: NextRequest) {
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

    // 检查 DeepSeek API Key
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return NextResponse.json({
        error: 'AI 服务未配置',
        message: '请联系管理员配置 DeepSeek API Key',
      }, { status: 500 });
    }

    // DeepSeek API 通常不提供直接的配额查询端点
    // 使用情况信息通常在每次 API 调用的响应头中返回
    // 建议用户登录 DeepSeek 控制台查看详细使用情况

    return NextResponse.json({
      message: 'DeepSeek API 使用情况查询',
      note: 'DeepSeek API 不提供直接的配额查询端点。要查看详细使用情况，请：',
      instructions: [
        '1. 访问 DeepSeek 官网并登录您的账户',
        '2. 进入 API 管理或控制台页面',
        '3. 查看您的 API 使用量、剩余配额和账单信息',
        '4. 每次 API 调用的响应头中可能包含速率限制信息（x-ratelimit-remaining 等）',
      ],
      apiKeyConfigured: true,
      suggestion: '您可以在每次 AI 聊天时查看响应中的使用情况信息，或登录 DeepSeek 控制台查看详细配额。',
    });
  } catch (error) {
    console.error('查询 API 使用情况时出错:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

