import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'edge';

/**
 * 查询 OpenAI-compatible API 使用情况
 * 注意：不同中转站/平台可能不提供直接的配额查询端点
 * 此接口返回使用建议和说明
 */
export async function GET() {
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

    // 检查 OpenAI-compatible API Key
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      return NextResponse.json({
        error: 'AI 服务未配置',
        message: '请联系管理员配置 OPENAI_API_KEY',
      }, { status: 500 });
    }

    // 多数 OpenAI-compatible 平台不提供统一的配额查询端点
    // 使用情况信息通常在每次 API 调用的响应头中返回
    // 建议用户登录对应平台控制台查看详细使用情况

    return NextResponse.json({
      message: 'OpenAI-compatible API 使用情况查询',
      note: '该平台可能不提供直接的配额查询端点。要查看详细使用情况，请：',
      instructions: [
        '1. 登录你所使用的 API 平台/中转站控制台',
        '2. 进入 API 管理或账单页面',
        '3. 查看您的 API 使用量、剩余配额和账单信息',
        '4. 每次 API 调用的响应头中可能包含速率限制信息（x-ratelimit-remaining 等）',
      ],
      apiKeyConfigured: true,
      suggestion: '你可以在 AI 调用响应头中查看使用情况信息，或登录控制台查看详细配额。',
    });
  } catch (error) {
    console.error('查询 API 使用情况时出错:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
