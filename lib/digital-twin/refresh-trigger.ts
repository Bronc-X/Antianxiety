/**
 * Digital Twin Refresh Trigger
 * 
 * 在每日校准完成后触发数字孪生分析刷新
 * 
 * @module lib/digital-twin/refresh-trigger
 */

import { getDataCollectionStatus } from './data-aggregator';

// ============================================
// Types
// ============================================

export interface RefreshTriggerResult {
  triggered: boolean;
  reason: string;
  analysisId?: string;
}

// ============================================
// Constants
// ============================================

/** 最小校准次数才触发分析 */
const MIN_CALIBRATIONS_FOR_ANALYSIS = 3;

/** 分析冷却时间（毫秒）- 6 小时 */
const ANALYSIS_COOLDOWN_MS = 6 * 60 * 60 * 1000;

// ============================================
// Functions
// ============================================

/**
 * 检查是否应该触发数字孪生分析
 * 
 * @param userId - 用户 ID
 * @returns 是否应该触发分析
 */
export async function shouldTriggerAnalysis(userId: string): Promise<{
  shouldTrigger: boolean;
  reason: string;
}> {
  try {
    // 检查数据收集状态
    const status = await getDataCollectionStatus(userId);
    
    if (!status.isReady) {
      return {
        shouldTrigger: false,
        reason: `数据收集中 (${status.progress}%)`,
      };
    }
    
    // 检查是否有足够的校准数据
    if (status.calibrationCount < MIN_CALIBRATIONS_FOR_ANALYSIS) {
      return {
        shouldTrigger: false,
        reason: `校准次数不足 (${status.calibrationCount}/${MIN_CALIBRATIONS_FOR_ANALYSIS})`,
      };
    }
    
    return {
      shouldTrigger: true,
      reason: '数据已就绪，可以触发分析',
    };
  } catch (error) {
    console.error('❌ 检查分析触发条件失败:', error);
    return {
      shouldTrigger: false,
      reason: '检查失败',
    };
  }
}

/**
 * 触发数字孪生分析（客户端调用）
 * 
 * @param forceRefresh - 是否强制刷新
 * @returns 触发结果
 */
export async function triggerDigitalTwinAnalysis(
  forceRefresh: boolean = false
): Promise<RefreshTriggerResult> {
  try {
    const response = await fetch('/api/digital-twin/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceRefresh }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      return {
        triggered: false,
        reason: data.error || '分析请求失败',
      };
    }
    
    const data = await response.json();
    
    return {
      triggered: true,
      reason: '分析已触发',
      analysisId: data.analysisId,
    };
  } catch (error) {
    console.error('❌ 触发分析失败:', error);
    return {
      triggered: false,
      reason: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 在每日校准完成后调用此函数
 * 会在后台触发数字孪生分析（如果条件满足）
 * 
 * @param userId - 用户 ID
 */
export async function onCalibrationComplete(userId: string): Promise<void> {
  try {
    const { shouldTrigger, reason } = await shouldTriggerAnalysis(userId);
    
    if (shouldTrigger) {
      console.log('🔄 每日校准完成，触发数字孪生分析...');
      
      // 异步触发分析，不阻塞校准流程
      triggerDigitalTwinAnalysis(false).then(result => {
        if (result.triggered) {
          console.log('✅ 数字孪生分析已触发:', result.analysisId);
        } else {
          console.log('⚠️ 数字孪生分析未触发:', result.reason);
        }
      }).catch(err => {
        console.error('❌ 触发分析时出错:', err);
      });
    } else {
      console.log('ℹ️ 跳过数字孪生分析:', reason);
    }
  } catch (error) {
    // 不要让分析触发失败影响校准流程
    console.error('❌ onCalibrationComplete 错误:', error);
  }
}
