import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    
    const payload = {
      id: user.id,
      username: user.id.slice(0, 8),
      gender: body.gender || null,
      birth_date: body.birth_date || null,
      height_cm: body.height_cm || null,
      weight_kg: body.weight_kg || null,
      activity_level: body.activity_level || null,
      body_fat_percentage: body.body_fat_percentage || null,
      primary_goal: body.primary_goal || null,
      target_weight_kg: body.target_weight_kg || null,
      weekly_goal_rate: body.weekly_goal_rate || null,
      sleep_hours: body.sleep_hours || null,
      stress_level: body.stress_level || null,
      energy_level: body.energy_level || null,
      exercise_frequency: body.exercise_frequency || null,
      caffeine_intake: body.caffeine_intake || null,
      alcohol_intake: body.alcohol_intake || null,
      smoking_status: body.smoking_status || null,
      ai_profile_completed: true,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('保存失败:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
