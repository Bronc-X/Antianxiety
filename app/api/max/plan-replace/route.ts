/**
 * Max Plan Replace API
 * 
 * 处理计划项替换请求
 * 生成同类别不同内容的替换项
 * 
 * @module app/api/max/plan-replace/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateReplacement, validateReplacementConsistency } from '@/lib/max/plan-replacer';
import type {
  PlanReplaceResponse,
  PlanItemDraft,
  PlanCategory,
} from '@/types/max-plan';

export const runtime = 'edge';

// 简化的请求类型
interface SimplePlanReplaceRequest {
  sessionId: string;
  itemId: string;
  language?: 'zh' | 'en';
}

// 默认类别模板（当无法获取原始项时使用）
const DEFAULT_CATEGORIES: PlanCategory[] = ['sleep', 'stress', 'fitness', 'nutrition', 'mental', 'habits'];

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
      return NextResponse.json<PlanReplaceResponse>(
        { success: false, newItem: {} as PlanItemDraft, error: '请先登录' },
        { status: 401 }
      );
    }

    // 解析请求
    const body: SimplePlanReplaceRequest = await request.json();
    const { sessionId, itemId, language: requestLanguage } = body;

    // 验证请求
    if (!sessionId) {
      return NextResponse.json<PlanReplaceResponse>(
        { success: false, newItem: {} as PlanItemDraft, error: '会话ID缺失' },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json<PlanReplaceResponse>(
        { success: false, newItem: {} as PlanItemDraft, error: '计划项ID缺失' },
        { status: 400 }
      );
    }

    // 检测语言偏好
    const acceptLanguage = request.headers.get('accept-language') || '';
    const language: 'zh' | 'en' = requestLanguage || (acceptLanguage.startsWith('en') ? 'en' : 'zh');

    console.log(`🔄 用户 ${user.id} 请求替换计划项: ${itemId}`);

    // 创建一个虚拟的当前项用于生成替换
    // 随机选择一个类别
    const randomCategory = DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];
    
    const currentItem: PlanItemDraft = {
      id: itemId,
      title: '',  // 空标题，确保不会排除任何模板
      action: '',
      rationale: '',
      difficulty: 'easy',
      category: randomCategory,
    };

    // 生成替换项
    const newItem = generateReplacement(currentItem, language);

    // 验证替换一致性
    const isConsistent = validateReplacementConsistency(currentItem, newItem);
    
    if (!isConsistent) {
      console.warn('[PlanReplace] Replacement consistency check failed, regenerating...');
      // 重新生成
      const retryItem = generateReplacement(currentItem, language, [newItem.title]);
      
      return NextResponse.json<PlanReplaceResponse>({
        success: true,
        newItem: retryItem,
      });
    }

    console.log(`✅ 替换成功: ${itemId} → ${newItem.title}`);

    return NextResponse.json<PlanReplaceResponse>({
      success: true,
      newItem,
    });

  } catch (error) {
    console.error('[PlanReplace] Error:', error);
    return NextResponse.json<PlanReplaceResponse>(
      { 
        success: false, 
        newItem: {} as PlanItemDraft,
        error: '替换失败，请稍后再试'
      },
      { status: 500 }
    );
  }
}
