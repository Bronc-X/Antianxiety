'use client';

import { useState, useEffect } from 'react';

interface AIAnalysisDisplayProps {
  analysis: {
    metabolic_rate_estimate?: string;
    cortisol_pattern?: string;
    sleep_quality?: string;
    recovery_capacity?: string;
    stress_resilience?: string;
    energy_stability?: string;
    inflammation_risk?: string;
    hormonal_balance?: string;
    cardiovascular_health?: string;
    risk_factors?: string[];
    strengths?: string[];
    confidence_score?: number;
  };
  plan: {
    core_principles?: string[];
    micro_habits?: Array<{
      name: string;
      cue: string;
      response: string;
      timing: string;
      rationale: string;
    }>;
    avoidance_behaviors?: string[];
    monitoring_approach?: string;
    expected_timeline?: string;
  };
}

const getScoreColor = (value: string | undefined, type: 'positive' | 'negative' = 'positive') => {
  if (!value) return 'text-gray-400';
  const isGood = type === 'positive' 
    ? ['high', 'good', 'stable', 'balanced', 'low'].includes(value)
    : ['low', 'normal'].includes(value);
  const isBad = type === 'positive'
    ? ['low', 'poor', 'unstable', 'imbalanced', 'high', 'needs_attention'].includes(value)
    : ['elevated', 'high'].includes(value);
  return isGood ? 'text-green-600' : isBad ? 'text-orange-600' : 'text-blue-600';
};

const getScorePercentage = (value: string | undefined) => {
  const scoreMap: Record<string, number> = {
    'low': 35, 'poor': 35, 'unstable': 40, 'imbalanced': 40, 'needs_attention': 35,
    'medium': 60, 'fair': 60, 'moderate': 60, 'normal': 75,
    'high': 85, 'good': 85, 'stable': 85, 'balanced': 85
  };
  return scoreMap[value || ''] || 50;
};

const translateValue = (value: string | undefined) => {
  const translations: Record<string, string> = {
    'low': '较低', 'medium': '中等', 'high': '较高',
    'poor': '较差', 'fair': '一般', 'good': '良好',
    'unstable': '不稳定', 'moderate': '中等', 'stable': '稳定',
    'imbalanced': '失衡', 'balanced': '平衡',
    'needs_attention': '需关注', 'elevated': '偏高', 'normal': '正常'
  };
  return translations[value || ''] || value;
};

export default function AIAnalysisDisplay({ analysis, plan }: AIAnalysisDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // 模拟AI分析加载过程
    const duration = 2000;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgress(100);
        setTimeout(() => setIsLoading(false), 300);
        clearInterval(timer);
      } else {
        setProgress(currentProgress);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
        <div className="w-32 h-32 relative">
          <div className="absolute inset-0 border-8 border-[#E7E1D6] rounded-full"></div>
          <div 
            className="absolute inset-0 border-8 border-[#0B3D2E] rounded-full transition-all duration-300 ease-out"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${progress >= 12.5 ? '100% 0%' : '50% 0%'}, ${progress >= 37.5 ? '100% 100%' : progress >= 12.5 ? '100% 0%' : '50% 0%'}, ${progress >= 62.5 ? '0% 100%' : progress >= 37.5 ? '100% 100%' : progress >= 12.5 ? '100% 0%' : '50% 0%'}, ${progress >= 87.5 ? '0% 0%' : progress >= 62.5 ? '0% 100%' : progress >= 37.5 ? '100% 100%' : progress >= 12.5 ? '100% 0%' : '50% 0%'}, ${progress >= 87.5 ? '50% 0%' : progress >= 62.5 ? '0% 100%' : progress >= 37.5 ? '100% 100%' : progress >= 12.5 ? '100% 0%' : '50% 0%'})`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold text-[#0B3D2E]">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-lg font-medium text-[#0B3D2E]">
            AI 正在为您分析数据...
          </div>
          <div className="text-sm text-[#0B3D2E]/60">
            {
              progress < 30 ? '解析生理指标' :
              progress < 60 ? '评估健康风险' :
              progress < 90 ? '生成个性化方案' : '完成分析报告'
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-br from-[#0B3D2E] to-[#0a3629] p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">专属健康报告</h2>
          <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
            分析置信度: {analysis.confidence_score}%
          </div>
        </div>
        <p className="text-white/80">基于您的健康数据，AI 已完成深度分析</p>
      </div>
      <div className="rounded-lg border border-[#E7E1D6] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#0B3D2E] mb-6">8维健康指标</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'metabolic_rate_estimate', label: '代谢率', value: analysis.metabolic_rate_estimate },
            { key: 'cortisol_pattern', label: '皮质醇模式', value: analysis.cortisol_pattern, type: 'negative' as const },
            { key: 'sleep_quality', label: '睡眠质量', value: analysis.sleep_quality },
            { key: 'recovery_capacity', label: '恢复能力', value: analysis.recovery_capacity },
            { key: 'stress_resilience', label: '压力韧性', value: analysis.stress_resilience },
            { key: 'energy_stability', label: '精力稳定性', value: analysis.energy_stability },
            { key: 'inflammation_risk', label: '炎症风险', value: analysis.inflammation_risk, type: 'negative' as const },
            { key: 'cardiovascular_health', label: '心血管健康', value: analysis.cardiovascular_health }
          ].map((item) => {
            const percentage = getScorePercentage(item.value);
            const color = getScoreColor(item.value, item.type || 'positive');
            return (
              <div key={item.key} className="p-4 bg-[#FAF6EF] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-[#0B3D2E]">{item.label}</div>
                  <div className={`text-sm font-semibold ${color}`}>
                    {translateValue(item.value)}
                  </div>
                </div>
                <div className="w-full bg-[#E7E1D6] rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      percentage >= 80 ? 'bg-green-500' :
                      percentage >= 60 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-sm font-semibold text-green-800 mb-3">✨ 继续保持</div>
            <div className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="text-sm text-green-700 flex items-start">
                  <span className="mr-2 text-green-500">●</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="text-sm font-semibold text-orange-800 mb-3">⚠️ 需要改善</div>
            <div className="space-y-2">
              {analysis.risk_factors.map((r, i) => (
                <div key={i} className="text-sm text-orange-700 flex items-start">
                  <span className="mr-2 text-orange-500">●</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border-2 border-[#0B3D2E] bg-white p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-[#0B3D2E] rounded-full"></div>
          <h2 className="text-xl font-semibold text-[#0B3D2E]">专属行动方案</h2>
        </div>
        
        {plan.core_principles && plan.core_principles.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">核心原则</div>
            <div className="space-y-2">
              {plan.core_principles.map((p, i) => (
                <div key={i} className="text-sm text-[#0B3D2E]/80 pl-4 border-l-2 border-[#0B3D2E]">
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.micro_habits && plan.micro_habits.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-[#0B3D2E] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0B3D2E] text-white rounded-full flex items-center justify-center text-xs">
                {plan.micro_habits.length}
              </span>
              为您定制的微习惯
            </div>
            <div className="space-y-3">
              {plan.micro_habits.map((habit, i) => (
                <div key={i} className="p-5 bg-gradient-to-r from-[#FAF6EF] to-white rounded-lg border border-[#E7E1D6] hover:border-[#0B3D2E] transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0B3D2E] text-white rounded-full flex items-center justify-center font-semibold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#0B3D2E] mb-3 text-lg">{habit.name}</div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium whitespace-nowrap">触发</span>
                          <span className="text-sm text-[#0B3D2E]/80">{habit.cue}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium whitespace-nowrap">行动</span>
                          <span className="text-sm text-[#0B3D2E]/80 font-medium">{habit.response}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium whitespace-nowrap">时机</span>
                          <span className="text-sm text-[#0B3D2E]/80">{habit.timing}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#E7E1D6]">
                        <div className="text-xs text-[#0B3D2E]/60 leading-relaxed">
                          💡 原理：{habit.rationale}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.avoidance_behaviors && plan.avoidance_behaviors.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">需要避免</div>
            <div className="space-y-1">
              {plan.avoidance_behaviors.map((b, i) => (
                <div key={i} className="text-sm text-red-700">{b}</div>
              ))}
            </div>
          </div>
        )}

        {plan.monitoring_approach && (
          <div className="mb-4">
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">监控方式</div>
            <div className="text-sm text-[#0B3D2E]/80">{plan.monitoring_approach}</div>
          </div>
        )}

        {plan.expected_timeline && (
          <div>
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">预期时间线</div>
            <div className="text-sm text-[#0B3D2E]/80">{plan.expected_timeline}</div>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => window.location.href = '/assistant?edit=true'}
          className="inline-block px-6 py-2 bg-white border border-[#0B3D2E] text-[#0B3D2E] rounded-lg hover:bg-[#FAF6EF] transition-colors"
        >
          修改健康参数
        </button>
      </div>
    </div>
  );
}
