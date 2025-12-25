/**
 * Personalized Health Plan Generation API
 * 
 * Generates personalized health plans based on user's unified profile.
 * Uses AI to create actionable, tailored recommendations.
 * 
 * POST /api/user/generate-plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUnifiedProfile } from '@/lib/user-profile-aggregator';

export const runtime = 'nodejs';

interface PlanItem {
    title: string;
    action: string;
    science: string;
    difficulty: number; // 1-5
    category: string;
}

interface GeneratedPlan {
    title: string;
    description: string;
    items: PlanItem[];
    basedOn: string[]; // What profile data was used
    generatedAt: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get unified profile
        const profile = await getUnifiedProfile(user.id);

        if (!profile) {
            return NextResponse.json(
                { error: 'No profile found. Complete daily check-ins first.' },
                { status: 400 }
            );
        }

        console.log(`📋 [Generate Plan] User: ${user.id}`);
        console.log(`   Goals: ${profile.health_goals?.length || 0}`);
        console.log(`   Mood Trend: ${profile.recent_mood_trend}`);
        console.log(`   Concerns: ${profile.health_concerns?.join(', ')}`);

        // Build plan based on profile
        const planItems: PlanItem[] = [];
        const basedOn: string[] = [];

        // 1. Goals-based recommendations
        if (profile.health_goals && profile.health_goals.length > 0) {
            basedOn.push('健康目标');

            for (const goal of profile.health_goals.slice(0, 3)) {
                const item = generateItemForGoal(goal.category, goal.goal_text);
                if (item) planItems.push(item);
            }
        }

        // 2. Mood-based recommendations
        if (profile.recent_mood_trend) {
            basedOn.push('情绪趋势');

            if (profile.recent_mood_trend === 'declining') {
                planItems.push({
                    title: '情绪调节呼吸',
                    action: '每天进行5分钟箱式呼吸(吸4秒-屏4秒-呼4秒-屏4秒)',
                    science: '箱式呼吸可以激活副交感神经系统，降低皮质醇水平',
                    difficulty: 1,
                    category: 'mental',
                });
            } else if (profile.recent_mood_trend === 'improving') {
                planItems.push({
                    title: '保持正向动力',
                    action: '每晚记录3件今日感恩的事',
                    science: '感恩练习已被证明可以增强多巴胺和血清素水平',
                    difficulty: 1,
                    category: 'mental',
                });
            }
        }

        // 3. Lifestyle-based recommendations
        if (profile.lifestyle_factors) {
            basedOn.push('生活习惯');

            if (profile.lifestyle_factors.stress_level === 'high') {
                planItems.push({
                    title: '压力释放运动',
                    action: '每天15分钟中等强度运动(快走/游泳)',
                    science: '有氧运动可以降低皮质醇并释放内啡肽',
                    difficulty: 2,
                    category: 'fitness',
                });
            }

            if (profile.lifestyle_factors.sleep_hours && profile.lifestyle_factors.sleep_hours < 7) {
                planItems.push({
                    title: '睡眠时长优化',
                    action: '每周提前15分钟入睡，目标7小时',
                    science: '渐进式调整对昼夜节律冲击更小，更易坚持',
                    difficulty: 2,
                    category: 'sleep',
                });
            }
        }

        // 4. Health concerns-based recommendations
        if (profile.health_concerns && profile.health_concerns.length > 0) {
            basedOn.push('健康关注点');

            if (profile.health_concerns.includes('失眠') || profile.health_concerns.includes('睡眠问题')) {
                planItems.push({
                    title: '睡前蓝光管理',
                    action: '睡前1小时停止使用电子设备，切换到暖光',
                    science: '蓝光抑制褪黑素分泌，影响入睡质量',
                    difficulty: 2,
                    category: 'sleep',
                });
            }

            if (profile.health_concerns.includes('焦虑') || profile.health_concerns.includes('紧张')) {
                planItems.push({
                    title: 'NSDR练习',
                    action: '每天进行10分钟非睡眠深度休息(YouTube搜NSDR)',
                    science: 'NSDR可以在清醒状态下触发副交感神经恢复',
                    difficulty: 2,
                    category: 'mental',
                });
            }
        }

        // Ensure at least some items
        if (planItems.length === 0) {
            planItems.push({
                title: '每日状态记录',
                action: '每天完成每日校准，记录睡眠和情绪',
                science: '自我监测是行为改变的第一步，提高健康意识',
                difficulty: 1,
                category: 'habits',
            });
        }

        const plan: GeneratedPlan = {
            title: `${new Date().toLocaleDateString('zh-CN')} 个性化计划`,
            description: `基于你的${basedOn.join('、')}生成的专属计划`,
            items: planItems.slice(0, 5), // Max 5 items
            basedOn,
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json({
            success: true,
            plan,
        });

    } catch (error) {
        console.error('[Generate Plan] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

function generateItemForGoal(category: string, goalText: string): PlanItem | null {
    const templates: Record<string, PlanItem> = {
        sleep: {
            title: '睡眠质量优化',
            action: `针对目标「${goalText}」：每晚固定时间入睡，睡前30分钟开始准备`,
            science: '固定作息时间可以强化昼夜节律，提高睡眠效率',
            difficulty: 2,
            category: 'sleep',
        },
        stress: {
            title: '压力管理训练',
            action: `针对目标「${goalText}」：每天2次5分钟正念呼吸`,
            science: '正念练习可以降低杏仁核活动，减少压力反应',
            difficulty: 2,
            category: 'mental',
        },
        fitness: {
            title: '运动习惯建立',
            action: `针对目标「${goalText}」：每周3次30分钟有氧运动`,
            science: '规律运动可以提高心肺功能和基础代谢',
            difficulty: 3,
            category: 'fitness',
        },
        nutrition: {
            title: '营养优化',
            action: `针对目标「${goalText}」：每餐保证蛋白质摄入`,
            science: '足够的蛋白质是肌肉合成和免疫功能的基础',
            difficulty: 2,
            category: 'nutrition',
        },
        mental: {
            title: '心理健康维护',
            action: `针对目标「${goalText}」：每周进行1次深度自我反思`,
            science: '自我反思可以增强元认知能力，提高情绪调节',
            difficulty: 2,
            category: 'mental',
        },
        habits: {
            title: '习惯养成',
            action: `针对目标「${goalText}」：使用习惯堆叠法，与现有习惯绑定`,
            science: '习惯堆叠利用已有神经通路，降低新习惯阻力',
            difficulty: 2,
            category: 'habits',
        },
    };

    return templates[category] || templates['habits'];
}
