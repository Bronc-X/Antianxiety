// lib/health-logic.ts
import { UserStateAnalysis, RecommendedTask, EnrichedDailyLog, UserMode, PrimaryConcern } from '@/types/logic';

// Metabolic Profile from Onboarding Questionnaire
export interface MetabolicProfile {
  energy_pattern?: 'crash_afternoon' | 'stable' | 'variable';
  sleep_pattern?: 'cortisol_imbalance' | 'normal' | 'occasional_issue';
  body_pattern?: 'metabolic_slowdown' | 'slight_change' | 'healthy';
  stress_pattern?: 'low_tolerance' | 'medium_tolerance' | 'high_tolerance';
  psychology?: 'frustrated' | 'curious' | 'successful';
  overall_score?: number;
  severity?: 'high' | 'medium' | 'low';
}

/**
 * 1. 状态翻译机
 * 完全基于数据分析，不受用户目标影响
 */
export function determineUserMode(
  latestLog: EnrichedDailyLog | null
): UserStateAnalysis {
  const defaultState: UserStateAnalysis = {
    mode: 'BALANCED',
    label: '平衡模式',
    color: 'text-emerald-700',
    batteryLevel: 80,
    insight: '数据积累中，保持当前节奏即可。',
    permissionToRest: false,
  };

  if (!latestLog) return defaultState;

  // 兼容两种字段名：sleep_hours 或 sleep_duration_minutes
  const sleepHours = latestLog.sleep_hours 
    ? Number(latestLog.sleep_hours) 
    : latestLog.sleep_duration_minutes 
    ? Number(latestLog.sleep_duration_minutes) / 60 
    : 7;
  
  const stress = Number(latestLog.stress_level) || 5;
  const hrv = Number(latestLog.hrv) || 50;

  // 逻辑 A: 恢复模式 (强行接管)
  if (sleepHours < 6 || stress > 7) {
    return {
      mode: 'RECOVERY',
      label: '恢复模式',
      color: 'text-amber-600',
      batteryLevel: 45,
      insight: sleepHours < 6 
        ? '检测到深度睡眠不足，皮质醇水平可能偏高。' 
        : '当前压力负荷已接近临界值。',
      permissionToRest: true,
    };
  }

  // 逻辑 B: 巅峰模式
  if (sleepHours > 7.5 && stress < 4) {
    return {
      mode: 'PRIME',
      label: '巅峰模式',
      color: 'text-[#0B3D2E]', 
      batteryLevel: 95,
      insight: '身心电量充足，是突破瓶颈的最佳时机。',
      permissionToRest: false,
    };
  }

  // 逻辑 C: 平衡模式
  return {
    ...defaultState,
    batteryLevel: 75,
    insight: '各项生理指标处于稳态。',
  };
}

/**
 * 2. 智能任务引擎 (升级版)
 * 结合 [身体状态] + [用户长期目标] + [代谢档案] + [每日日志]
 * 
 * ⚠️ CRITICAL: 数据完整性原则
 * - 如果没有真实日志数据（latestLog === null），返回基线任务
 * - 不使用问卷答案伪造睡眠/压力数据来判断 mode
 */
export function getRecommendedTask(
  mode: UserMode, 
  userConcern: PrimaryConcern,
  metabolicProfile?: MetabolicProfile | null,
  latestLog?: any | null  // 最新的每日日志数据
): RecommendedTask {
  
  // === CRITICAL: 无日志数据时，返回基线任务 ===
  // 不使用代谢档案伪造具体的睡眠/压力数值
  if (!latestLog) {
    return {
      taskName: '呼吸练习 5 分钟',
      duration: '5 分钟',
      icon: 'Wind',
      type: 'BASELINE',
      reason: '⏳ 等待今日健康数据以生成个性化方案。完成今日日记后，AI 将基于你的真实状态推荐最适合的任务。',
      isBaseline: true  // 标记为基线任务
    };
  }
  
  // === 新用户 Fallback: 基于问卷的初始推荐 ===
  // 如果 mode 是默认状态且有代谢档案，使用问卷结果
  if (mode === 'BALANCED' && metabolicProfile) {
    return getRecommendationFromProfile(metabolicProfile);
  }
  
  // === 场景 1: 身体需要恢复 (无视长期目标，强制休息) ===
  if (mode === 'RECOVERY') {
    return {
      taskName: '早睡 45 分钟',
      duration: '今晚 22:15',
      icon: 'Moon',
      type: 'REST',
      reason: '状态检测：你的"身体电池"电量过低，强行运动会适得其反，今日首要任务是补觉。',
    };
  }

  // === 场景 2: 身体状态好 (根据长期目标分配任务) ===
  const concern = userConcern || 'general';

  if (mode === 'PRIME') {
    // 状态好 + 想减肥 = 高强度
    if (typeof concern === 'string' && (concern.includes('weight') || concern.includes('fat') || concern.includes('loss'))) {
      return {
        taskName: 'HIIT 间歇训练',
        duration: '20 分钟',
        icon: 'Activity',
        type: 'ACTIVE',
        reason: '利用今日的高能状态，最大化燃脂效率。',
      };
    }
    
    // 状态好 + 想增肌/力量
    if (typeof concern === 'string' && (concern.includes('muscle') || concern.includes('strength') || concern.includes('gain'))) {
      return {
        taskName: '抗阻力量训练',
        duration: '45 分钟',
        icon: 'Dumbbell',
        type: 'ACTIVE',
        reason: '神经系统募集能力处于巅峰，适合冲击大重量。',
      };
    }

    // 状态好 + 想改善压力
    if (typeof concern === 'string' && concern.includes('stress')) {
      return {
        taskName: 'Zone 2 户外慢跑',
        duration: '30 分钟',
        icon: 'Footprints',
        type: 'ACTIVE',
        reason: '有氧运动有助于清除皮质醇，同时释放内啡肽。',
      };
    }
  }

  // === 场景 3: 平衡状态 (推荐可持续的习惯) ===
  // 根据目标推荐温和任务
  if (typeof concern === 'string') {
    if (concern.includes('sleep')) {
      return {
        taskName: '晚间冥想呼吸',
        duration: '10 分钟',
        icon: 'Moon',
        type: 'BALANCED',
        reason: '建立睡眠前例行程序，帮助激活副交感神经系统。',
      };
    }

    if (concern.includes('stress')) {
      return {
        taskName: 'Box Breathing 练习',
        duration: '15 分钟',
        icon: 'Wind',
        type: 'BALANCED',
        reason: '通过调节呼吸节律，直接影响迷走神经张力。',
      };
    }

    if (concern.includes('energy')) {
      return {
        taskName: '早晨户外阳光暴露',
        duration: '20 分钟',
        icon: 'Sun',
        type: 'BALANCED',
        reason: '重置生物钟，提升日间皮质醇节律。',
      };
    }
  }

  // 默认任务 (万金油)
  return {
    taskName: 'Zone 2 户外快走',
    duration: '30 分钟',
    icon: 'Footprints',
    type: 'ACTIVE',
    reason: '清除代谢废物，维持基础代谢灵活性。',
  };
}

/**
 * 3. 辅助函数：从 dailyLogs 数组中获取最新一条记录
 */
export function getLatestDailyLog(logs: EnrichedDailyLog[]): EnrichedDailyLog | null {
  if (!logs || logs.length === 0) return null;
  
  // 按 log_date 降序排列，取第一条
  const sorted = [...logs].sort((a, b) => 
    new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );
  
  return sorted[0];
}

/**
 * 4. 计算最近7天平均值（供其他地方使用）
 */
export function calculateSevenDayAverage(logs: EnrichedDailyLog[]) {
  const lastSevenLogs = logs
    .filter(log => {
      const logDate = new Date(log.log_date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return logDate >= sevenDaysAgo;
    })
    .slice(0, 7);

  const stressSum = lastSevenLogs.reduce((sum, log) => 
    log.stress_level ? sum + log.stress_level : sum, 0);
  const stressCount = lastSevenLogs.filter(log => log.stress_level).length;
  const avgStress = stressCount > 0 ? stressSum / stressCount : null;

  const sleepSum = lastSevenLogs.reduce((sum, log) => {
    if (log.sleep_hours) return sum + log.sleep_hours;
    if (log.sleep_duration_minutes) return sum + (log.sleep_duration_minutes / 60);
    return sum;
  }, 0);
  const sleepCount = lastSevenLogs.filter(log => 
    log.sleep_hours || log.sleep_duration_minutes
  ).length;
  const avgSleep = sleepCount > 0 ? sleepSum / sleepCount : null;

  const exerciseSum = lastSevenLogs.reduce((sum, log) => 
    log.exercise_duration_minutes ? sum + log.exercise_duration_minutes : sum, 0);
  const exerciseCount = lastSevenLogs.filter(log => log.exercise_duration_minutes).length;
  const avgExercise = exerciseCount > 0 ? exerciseSum / exerciseCount : null;

  return {
    avgStress,
    avgSleep,
    avgExercise,
    sampleSize: lastSevenLogs.length,
  };
}

/**
 * 5. 基于代谢档案生成初始推荐（新用户 Fallback）
 * 当用户还没有日志数据时，使用问卷结果智能推荐
 */
function getRecommendationFromProfile(profile: MetabolicProfile): RecommendedTask {
  // 优先处理最严重的症状
  
  // 1. 皮质醇失衡（凌晨醒来）-> 重置生物钟
  if (profile.sleep_pattern === 'cortisol_imbalance') {
    return {
      taskName: '早晨户外阳光暴露',
      duration: '10 分钟',
      icon: 'Sun',
      type: 'BALANCED',
      reason: '你的问卷显示凌晨3-4点醒来。这通常意味着皮质醇节律紊乱。早晨自然光暴露可以重置生物钟，帮助皮质醇在正确时间达到峰值。',
    };
  }
  
  // 2. 下午能量崩溃 -> 稳定血糖
  if (profile.energy_pattern === 'crash_afternoon') {
    return {
      taskName: '餐后 5 分钟步行',
      duration: '5 分钟',
      icon: 'Footprints',
      type: 'BALANCED',
      reason: '你的问卷显示下午2-4点能量断崖式跌落。这可能与血糖波动有关。餐后轻度活动可以缓冲血糖尖峰，避免随后的崩溃。',
    };
  }
  
  // 3. 压力耐受低 -> 激活副交感神经
  if (profile.stress_pattern === 'low_tolerance') {
    return {
      taskName: 'Box Breathing 练习',
      duration: '5 分钟',
      icon: 'Wind',
      type: 'BALANCED',
      reason: '你的问卷显示压力耐受阈值降低。Box Breathing（方盒呼吸）可以直接激活迷走神经，快速降低交感神经活跃度。',
    };
  }
  
  // 4. 代谢减缓（腰腹脂肪堆积）-> 最低有效剂量运动
  if (profile.body_pattern === 'metabolic_slowdown') {
    return {
      taskName: 'Zone 2 快走',
      duration: '15 分钟',
      icon: 'Footprints',
      type: 'ACTIVE',
      reason: '你的问卷显示代谢减缓迹象。Zone 2有氧（能边走边说话的强度）是燃脂的最佳强度，且不会进一步消耗你已经很低的能量储备。',
    };
  }
  
  // 5. 曾尝试失败且挫败 -> 最小阻力任务
  if (profile.psychology === 'frustrated') {
    return {
      taskName: '睡前 3 分钟呼吸',
      duration: '3 分钟',
      icon: 'Moon',
      type: 'BALANCED',
      reason: '你之前的尝试没有成功，不是你的错。我们从"最小阻力"开始：每晚睡前深呼吸3分钟。这个习惯几乎不可能失败，但会逐步重建你的信念强度。',
    };
  }
  
  // 默认：万金油推荐
  return {
    taskName: '早晨 10 分钟步行',
    duration: '10 分钟',
    icon: 'Footprints',
    type: 'BALANCED',
    reason: '基于你的问卷结果，我们建议从最简单的习惯开始。早晨步行结合了阳光暴露和轻度有氧，能同时改善生物钟和基础代谢。',
  };
}
