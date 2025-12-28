/**
 * Digital Twin Refresh Trigger
 * 
 * 在每日校准完成后触发数字孪生分析刷新
 * 
 * @module lib/digital-twin/refresh-trigger
 */


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


// ============================================
// Functions
// ============================================


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
    
    if (data.skipped) {
       return {
         triggered: false,
         reason: data.reason || '条件未满足，已跳过',
       };
    }

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
      console.log('🔄 每日校准完成，请求数字孪生分析...');
      
      // 异步触发分析，不阻塞校准流程
      // API 端会自行检查条件 (getDataCollectionStatus)
      triggerDigitalTwinAnalysis(false).then(result => {
        if (result.triggered) {
          console.log('✅ 数字孪生分析已触发:', result.analysisId);
        } else {
          console.log('ℹ️ 数字孪生分析未触发:', result.reason);
        }
      }).catch(err => {
        console.error('❌ 触发分析时出错:', err);
      });
  } catch (error) {
    // 不要让分析触发失败影响校准流程
    console.error('❌ onCalibrationComplete 错误:', error);
  }
}
