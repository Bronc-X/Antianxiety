'use client';

import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

type Language = 'en' | 'zh';

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
    risk_factors_en?: string[];
    strengths_en?: string[];
    confidence_reasons_en?: string[];
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

const translateValue = (value: string | undefined, lang: Language) => {
  const translations: Record<string, { en: string; zh: string }> = {
    'low': { en: 'Low', zh: '较低' },
    'medium': { en: 'Medium', zh: '中等' },
    'high': { en: 'High', zh: '较高' },
    'poor': { en: 'Poor', zh: '较差' },
    'fair': { en: 'Fair', zh: '一般' },
    'good': { en: 'Good', zh: '良好' },
    'unstable': { en: 'Unstable', zh: '不稳定' },
    'moderate': { en: 'Moderate', zh: '中等' },
    'stable': { en: 'Stable', zh: '稳定' },
    'imbalanced': { en: 'Imbalanced', zh: '失衡' },
    'balanced': { en: 'Balanced', zh: '平衡' },
    'needs_attention': { en: 'Needs Attention', zh: '需关注' },
    'elevated': { en: 'Elevated', zh: '偏高' },
    'normal': { en: 'Normal', zh: '正常' }
  };
  const translation = translations[value || ''];
  return translation ? translation[lang] : value;
};

export default function AIAnalysisDisplay({ analysis, plan }: AIAnalysisDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  
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
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-8 bg-white">
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
        <div className="relative w-40 h-40">
          <div 
            className="absolute inset-0 rounded-full bg-slate-800"
            style={{
              animation: 'breathe 3.5s ease-in-out infinite',
              boxShadow: '0 0 40px rgba(15, 23, 42, 0.3)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-slate-400"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-slate-300"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1.25s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-semibold text-white tracking-tight">{Math.round(progress)}%</div>
              <div className="text-xs text-white/80 mt-1 font-medium uppercase tracking-wider">Processing</div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-xl font-semibold text-slate-900">
            Analyzing your health data
          </div>
          <div className="text-sm text-slate-600 max-w-md px-4">
            {
              progress < 25 ? 'Parsing physiological indicators' :
              progress < 50 ? 'Evaluating 8-dimensional health status' :
              progress < 75 ? 'Generating personalized recommendations' : 'Completing analysis report'
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

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">{t('Health Analysis Report', '健康分析报告')}</h1>
            <p className="text-slate-600">{t('AI-powered personalized health assessment', '基于AI的个性化健康评估')}</p>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="mr-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={t('Switch to Chinese', '切换到英文')}
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="border border-slate-200 px-4 py-2 rounded-lg bg-slate-50">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('Confidence', '置信度')}</div>
            <div className="text-2xl font-semibold text-slate-900">{analysis.confidence_score}%</div>
          </div>
        </div>
        
        {analysis.confidence_reasons && analysis.confidence_reasons.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">{t('Analysis Basis', '分析依据')}</div>
            <div className="grid grid-cols-2 gap-2">
              {(language === 'en' ? analysis.confidence_reasons_en : analysis.confidence_reasons)?.map((reason, i) => (
                <div key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">·</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">{t('Health Metrics Overview', '健康指标概览')}</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 13 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
              <Radar name="Current Status" dataKey="value" stroke="#0f172a" fill="#0f172a" fillOpacity={0.1} strokeWidth={2} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '6px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8维指标详情 */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">{t('Detailed Health Metrics', '详细健康指标')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'metabolic_rate_estimate', label: t('Metabolic Rate', '代谢率') },
            { key: 'cortisol_pattern', label: t('Cortisol Pattern', '皮质醇模式') },
            { key: 'sleep_quality', label: t('Sleep Quality', '睡眠质量') },
            { key: 'recovery_capacity', label: t('Recovery Capacity', '恢复能力') },
            { key: 'stress_resilience', label: t('Stress Resilience', '压力韧性') },
            { key: 'energy_stability', label: t('Energy Stability', '精力稳定性') },
            { key: 'inflammation_risk', label: t('Inflammation Risk', '炎症风险') },
            { key: 'cardiovascular_health', label: t('Cardiovascular Health', '心血管健康') }
          ].map((item) => {
            const value = analysis[item.key as keyof typeof analysis] as string;
            const details = analysis.analysis_details?.[item.key];
            const score = getScoreValue(value);
            
            return (
              <div key={item.key} className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      {translateValue(value, language)}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {score}
                  </div>
                </div>
                
                {details && (
                  <div className="space-y-3 text-sm pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('ANALYSIS', '分析')}</div>
                      <div className="text-slate-700 leading-relaxed">{language === 'en' ? details.reason_en : details.reason}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('TARGET', '目标')}</div>
                      <div className="text-slate-700 leading-relaxed">{language === 'en' ? details.target_en : details.target}</div>
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
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="text-base font-semibold text-slate-900 mb-4">{t('Strengths to Maintain', '继续保持')}</div>
            <div className="space-y-2">
              {(language === 'en' ? analysis.strengths_en : analysis.strengths)?.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="text-slate-400 mt-1">·</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="text-base font-semibold text-slate-900 mb-4">{t('Areas for Improvement', '需要改善')}</div>
            <div className="space-y-2">
              {(language === 'en' ? analysis.risk_factors_en : analysis.risk_factors)?.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="text-slate-400 mt-1">·</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 微习惯 */}
      {plan.micro_habits && plan.micro_habits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{t('Personalized Action Plan', '个性化行动方案')}</h2>
            <p className="text-slate-600">{t(`${plan.micro_habits.length} micro-habits tailored for you`, `为您定制的 ${plan.micro_habits.length} 个微习惯`)}</p>
          </div>
          <div className="space-y-4">
            {plan.micro_habits.map((habit, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{habit.name}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('TRIGGER', '触发')}</span>
                        <span className="text-slate-700 flex-1">{habit.cue}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('ACTION', '行动')}</span>
                        <span className="text-slate-900 font-medium flex-1">{habit.response}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('TIMING', '时机')}</span>
                        <span className="text-slate-700 flex-1">{habit.timing}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-700">{t('Rationale', '原理')}: </span>{habit.rationale}
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
          className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          {t('Edit Health Parameters', '修改健康参数')}
        </button>
      </div>
    </div>
  );
}
