'use client';

import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

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
    confidence_reasons?: string[];
    analysis_details?: {
      [key: string]: {
        reason: string;
        target: string;
      };
    };
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

const getScoreValue = (value: string | undefined) => {
  const scoreMap: Record<string, number> = {
    'low': 40, 'poor': 35, 'unstable': 40, 'imbalanced': 40, 'needs_attention': 35, 'elevated': 45,
    'medium': 65, 'fair': 60, 'moderate': 65, 'normal': 75,
    'high': 90, 'good': 85, 'stable': 90, 'balanced': 90
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
    const duration = 2500;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgress(100);
        setTimeout(() => setIsLoading(false), 400);
        clearInterval(timer);
      } else {
        setProgress(currentProgress);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
        <div className="relative w-48 h-48">
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
            style={{
              animation: 'breathe 3.5s ease-in-out infinite',
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.6), 0 0 100px rgba(99, 102, 241, 0.3)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full border-4 border-blue-400"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}
          />
          <div 
            className="absolute inset-0 rounded-full border-4 border-indigo-400"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1.25s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white tracking-tight">{Math.round(progress)}%</div>
              <div className="text-sm text-white/90 mt-2 font-medium">分析中</div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI 正在深度分析您的健康数据
          </div>
          <div className="text-base text-gray-600 max-w-md px-4">
            {
              progress < 25 ? '🔍 解析生理基础指标' :
              progress < 50 ? '📊 评估8维健康状况' :
              progress < 75 ? '🎯 生成个性化建议' : '✨ 完成专属健康报告'
            }
          </div>
        </div>
      </div>
    );
  }

  const radarData = [
    { metric: '代谢率', value: getScoreValue(analysis.metabolic_rate_estimate), fullMark: 100 },
    { metric: '睡眠质量', value: getScoreValue(analysis.sleep_quality), fullMark: 100 },
    { metric: '恢复能力', value: getScoreValue(analysis.recovery_capacity), fullMark: 100 },
    { metric: '压力韧性', value: getScoreValue(analysis.stress_resilience), fullMark: 100 },
    { metric: '精力稳定', value: getScoreValue(analysis.energy_stability), fullMark: 100 },
    { metric: '心血管', value: getScoreValue(analysis.cardiovascular_health), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">您的专属健康报告</h1>
            <p className="text-blue-100 text-lg">基于AI深度学习的个性化健康分析</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="text-sm font-medium">置信度</div>
            <div className="text-2xl font-bold">{analysis.confidence_score}%</div>
          </div>
        </div>
        
        {analysis.confidence_reasons && analysis.confidence_reasons.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-4">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>📋</span>
              <span>置信度评估依据</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {analysis.confidence_reasons.map((reason, i) => (
                <div key={i} className="text-sm text-blue-50 flex items-start gap-2">
                  <span className="text-blue-300">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">健康全景雷达</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 14 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
              <Radar name="当前状态" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8维指标详情 */}
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">8维健康指标详解</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'metabolic_rate_estimate', label: '代谢率', icon: '🔥', color: 'blue' },
            { key: 'cortisol_pattern', label: '皮质醇模式', icon: '⚡', color: 'purple' },
            { key: 'sleep_quality', label: '睡眠质量', icon: '😴', color: 'indigo' },
            { key: 'recovery_capacity', label: '恢复能力', icon: '💪', color: 'green' },
            { key: 'stress_resilience', label: '压力韧性', icon: '🧠', color: 'teal' },
            { key: 'energy_stability', label: '精力稳定性', icon: '⚡', color: 'yellow' },
            { key: 'inflammation_risk', label: '炎症风险', icon: '🛡️', color: 'red' },
            { key: 'cardiovascular_health', label: '心血管健康', icon: '❤️', color: 'pink' }
          ].map((item) => {
            const value = analysis[item.key as keyof typeof analysis] as string;
            const details = analysis.analysis_details?.[item.key];
            const score = getScoreValue(value);
            
            return (
              <div key={item.key} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-800">{item.label}</div>
                      <div className={`text-sm font-medium ${
                        score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {translateValue(value)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {score}
                  </div>
                </div>
                
                {details && (
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-800 mb-1">📝 分析原因</div>
                      <div className="text-gray-700">{details.reason}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-green-800 mb-1">🎯 目标值</div>
                      <div className="text-gray-700">{details.target}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 优势与改善 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-2 border-green-200 shadow-lg">
            <div className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span>继续保持</span>
            </div>
            <div className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 border-2 border-orange-200 shadow-lg">
            <div className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span>需要改善</span>
            </div>
            <div className="space-y-2">
              {analysis.risk_factors.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                  <span className="text-orange-500 font-bold">!</span>
                  <span className="text-gray-700">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 微习惯 */}
      {plan.micro_habits && plan.micro_habits.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 border-2 border-indigo-200 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {plan.micro_habits.length}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">专属微习惯方案</h2>
              <p className="text-gray-600">为您量身定制的健康行动计划</p>
            </div>
          </div>
          <div className="space-y-4">
            {plan.micro_habits.map((habit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{habit.name}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">触发</span>
                        <span className="text-gray-700 flex-1">{habit.cue}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">行动</span>
                        <span className="text-gray-800 font-semibold flex-1">{habit.response}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">时机</span>
                        <span className="text-gray-700 flex-1">{habit.timing}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600 leading-relaxed">
                        💡 <span className="font-medium">原理：</span>{habit.rationale}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修改按钮 */}
      <div className="text-center">
        <button
          onClick={() => window.location.href = '/assistant?edit=true'}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          修改健康参数
        </button>
      </div>
    </div>
  );
}
