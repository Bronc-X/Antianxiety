import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface CompletePlanRequest {
  planId: string;
  completionDate?: string; // 可选，默认今天
  status: 'completed' | 'partial' | 'skipped' | 'archived';
  completedItems?: any;
  notes?: string;
  feelingScore?: number; // 1-5分
}

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
    
    // 解析请求
    const body: CompletePlanRequest = await request.json();
    const { planId, completionDate, status, completedItems, notes, feelingScore } = body;
    
    if (!planId || !status) {
      return NextResponse.json(
        { error: '缺少必需参数' },
        { status: 400 }
      );
    }
    
    // 验证该计划属于当前用户
    const { data: plan, error: planError } = await supabase
      .from('user_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json(
        { error: '计划不存在或无权访问' },
        { status: 403 }
      );
    }
    
    // 使用今天的日期（如果未提供）
    const dateToUse = completionDate || new Date().toISOString().split('T')[0];
    
    console.log(`📝 用户 ${user.id} 记录计划 ${planId} 的执行情况: ${status}`);
    
    // 如果是归档操作，直接更新计划状态为 completed
    if (status === 'archived') {
      const { error: archiveError } = await supabase
        .from('user_plans')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .eq('user_id', user.id);
      
      if (archiveError) {
        console.error('❌ 归档计划失败:', archiveError);
        return NextResponse.json(
          { error: '归档失败', details: archiveError.message },
          { status: 500 }
        );
      }
      
      console.log(`✅ 成功归档计划 ${planId}`);
      
      return NextResponse.json({
        success: true,
        data: {
          archived: true,
          planId,
        },
      });
    }
    
    // 1. 先获取当前计划的 content
    const { data: currentPlan, error: getPlanError } = await supabase
      .from('user_plans')
      .select('content')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();
    
    if (getPlanError) {
      console.error('❌ 获取计划内容失败:', getPlanError);
    }
    
    // 2. 更新 user_plans.content 中的 items 完成状态
    if (currentPlan && completedItems && Array.isArray(completedItems)) {
      try {
        const content = typeof currentPlan.content === 'string' 
          ? JSON.parse(currentPlan.content) 
          : currentPlan.content || {};
        
        // 确保 content.items 存在
        if (!content.items) {
          content.items = content.actions || [];
        }
        
        console.log(`📋 当前 content.items 数量: ${content.items.length}`);
        console.log(`📋 completedItems 数量: ${completedItems.length}`);
        console.log(`📋 completedItems:`, JSON.stringify(completedItems));
        
        // 更新每个 item 的完成状态
        content.items = content.items.map((item: any, index: number) => {
          // 生成当前 item 的可能 ID
          const itemId = item.id?.toString() || `${planId}-${index}`;
          
          // 在 completedItems 中查找匹配的项
          const matchedItem = completedItems.find((ci: { id: string; completed: boolean }) => {
            const ciId = ci.id?.toString();
            return ciId === itemId || 
                   ciId === `${planId}-${index}` || 
                   ciId === index.toString() ||
                   ciId === item.id?.toString();
          });
          
          // 如果没找到精确匹配，尝试按索引匹配
          const itemByIndex = completedItems[index];
          
          const isCompleted = matchedItem?.completed ?? itemByIndex?.completed ?? item.completed;
          
          console.log(`  Item ${index}: id=${itemId}, matched=${!!matchedItem}, byIndex=${!!itemByIndex}, completed=${isCompleted}`);
          
          return {
            ...item,
            id: itemId,
            completed: isCompleted === true,
            status: isCompleted ? 'completed' : 'pending',
          };
        });
        
        // 计算进度
        const completedCount = content.items.filter((i: any) => i.completed === true).length;
        const progress = content.items.length > 0 
          ? Math.round((completedCount / content.items.length) * 100) 
          : 0;
        
        console.log(`📋 更新后的 content.items:`, JSON.stringify(content.items));
        console.log(`📋 计算的进度: ${progress}%`);
        
        // 更新 user_plans 表 - 使用对象而不是字符串
        const { error: updateError } = await supabase
          .from('user_plans')
          .update({ 
            content: content,  // 直接传对象，让 Supabase 处理 JSON 序列化
            updated_at: new Date().toISOString(),
            // 如果全部完成，更新状态
            ...(progress === 100 ? { status: 'completed' } : {}),
          })
          .eq('id', planId)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('❌ 更新计划内容失败:', updateError);
        } else {
          console.log(`✅ 成功更新计划内容，进度: ${progress}%`);
        }
      } catch (parseError) {
        console.error('❌ 解析计划内容失败:', parseError);
      }
    }
    
    // 3. 插入或更新完成记录（用于历史追踪）- 这是可选的
    try {
      const { data: completion, error: insertError } = await supabase
        .from('user_plan_completions')
        .upsert(
          {
            user_id: user.id,
            plan_id: planId,
            completion_date: dateToUse,
            status,
            completed_items: completedItems || null,
            notes: notes || null,
            feeling_score: feelingScore || null,
          },
          {
            onConflict: 'user_id,plan_id,completion_date',
          }
        )
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ 记录执行状态失败（非致命）:', insertError);
      } else {
        console.log(`✅ 成功记录执行状态到 user_plan_completions`);
      }
    } catch (completionError) {
      // 忽略 user_plan_completions 的错误，因为主要更新已完成
      console.error('❌ user_plan_completions 操作失败（非致命）:', completionError);
    }
    
    console.log(`✅ 计划更新完成`);
    
    return NextResponse.json({
      success: true,
      data: {
        updated: true,
        planId,
      },
    });
    
  } catch (error) {
    console.error('❌ 记录执行状态API错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
