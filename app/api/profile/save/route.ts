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
    
    // 确保正确的类型转换
    const payload: Record<string, unknown> = {
      id: user.id,
      username: user.id.slice(0, 8),
      ai_profile_completed: true,
    };

    // 只添加提供的字段
    if (body.gender !== undefined) payload.gender = body.gender;
    if (body.birth_date !== undefined) payload.birth_date = body.birth_date;
    if (body.age_range !== undefined) payload.age_range = body.age_range;
    if (body.activity_level !== undefined) payload.activity_level = body.activity_level;
    if (body.goal_focus_notes !== undefined) payload.goal_focus_notes = body.goal_focus_notes;
    if (body.work_schedule !== undefined) payload.work_schedule = body.work_schedule;
    if (body.meal_pattern !== undefined) payload.meal_pattern = body.meal_pattern;
    if (body.location !== undefined) payload.location = body.location;
    if (body.daily_checkin_time !== undefined) {
      payload.daily_checkin_time = body.daily_checkin_time
        ? body.daily_checkin_time.length === 5
          ? `${body.daily_checkin_time}:00`
          : body.daily_checkin_time
        : null;
    }
    
    // 浮点数字段
    if (body.height_cm !== undefined && body.height_cm !== null) {
      payload.height_cm = typeof body.height_cm === 'number' ? body.height_cm : parseFloat(body.height_cm);
    }
    if (body.weight_kg !== undefined && body.weight_kg !== null) {
      payload.weight_kg = typeof body.weight_kg === 'number' ? body.weight_kg : parseFloat(body.weight_kg);
    }
    if (body.body_fat_percentage !== undefined && body.body_fat_percentage !== null) {
      payload.body_fat_percentage = typeof body.body_fat_percentage === 'number' ? body.body_fat_percentage : parseFloat(body.body_fat_percentage);
    }
    if (body.target_weight_kg !== undefined && body.target_weight_kg !== null) {
      payload.target_weight_kg = typeof body.target_weight_kg === 'number' ? body.target_weight_kg : parseFloat(body.target_weight_kg);
    }
    if (body.weekly_goal_custom !== undefined && body.weekly_goal_custom !== null) {
      payload.weekly_goal_custom = typeof body.weekly_goal_custom === 'number' ? body.weekly_goal_custom : parseFloat(body.weekly_goal_custom);
    }
    if (body.sleep_hours !== undefined && body.sleep_hours !== null) {
      payload.sleep_hours = typeof body.sleep_hours === 'number' ? body.sleep_hours : parseFloat(body.sleep_hours);
    }
    if (body.exercise_duration_minutes !== undefined && body.exercise_duration_minutes !== null) {
      payload.exercise_duration_minutes = typeof body.exercise_duration_minutes === 'number'
        ? Math.round(body.exercise_duration_minutes)
        : parseInt(body.exercise_duration_minutes, 10);
    }
    
    // 整数字段
    if (body.stress_level !== undefined && body.stress_level !== null) {
      payload.stress_level = typeof body.stress_level === 'number' ? Math.round(body.stress_level) : parseInt(body.stress_level, 10);
    }
    if (body.energy_level !== undefined && body.energy_level !== null) {
      payload.energy_level = typeof body.energy_level === 'number' ? Math.round(body.energy_level) : parseInt(body.energy_level, 10);
    }
    
    // 字符串字段
    if (body.primary_goal !== undefined) payload.primary_goal = body.primary_goal;
    if (body.weekly_goal_rate !== undefined) payload.weekly_goal_rate = body.weekly_goal_rate;
    if (body.exercise_frequency !== undefined) payload.exercise_frequency = body.exercise_frequency;
    if (body.caffeine_intake !== undefined) payload.caffeine_intake = body.caffeine_intake;
    if (body.alcohol_intake !== undefined) payload.alcohol_intake = body.alcohol_intake;
    if (body.smoking_status !== undefined) payload.smoking_status = body.smoking_status;
    if (body.has_fitness_app !== undefined) payload.has_fitness_app = body.has_fitness_app;
    if (body.fitness_app_name !== undefined) payload.fitness_app_name = body.fitness_app_name;
    if (body.can_sync_fitness_data !== undefined) payload.can_sync_fitness_data = body.can_sync_fitness_data;
    
    // 数组字段
    if (body.metabolic_concerns !== undefined) {
      if (Array.isArray(body.metabolic_concerns)) {
        payload.metabolic_concerns = body.metabolic_concerns
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.metabolic_concerns = [];
      }
    }

    if (body.exercise_types !== undefined) {
      if (Array.isArray(body.exercise_types)) {
        payload.exercise_types = body.exercise_types
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.exercise_types = [];
      }
    }

    if (body.primary_focus_topics !== undefined) {
      if (Array.isArray(body.primary_focus_topics)) {
        payload.primary_focus_topics = body.primary_focus_topics
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.primary_focus_topics = [];
      }
    }

    if (body.chronic_conditions !== undefined) {
      if (Array.isArray(body.chronic_conditions)) {
        payload.chronic_conditions = body.chronic_conditions
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.chronic_conditions = [];
      }
    }

    if (body.medical_conditions !== undefined) {
      if (Array.isArray(body.medical_conditions)) {
        payload.medical_conditions = body.medical_conditions
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.medical_conditions = [];
      }
    }

    if (body.medications !== undefined) {
      if (Array.isArray(body.medications)) {
        payload.medications = body.medications
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.medications = [];
      }
    }

    if (body.hobbies !== undefined) {
      if (Array.isArray(body.hobbies)) {
        payload.hobbies = body.hobbies
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
          .slice(0, 20);
      } else {
        payload.hobbies = [];
      }
    }

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
