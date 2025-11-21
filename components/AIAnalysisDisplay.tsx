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

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">Health Analysis Report</h1>
            <p className="text-slate-600">AI-powered personalized health assessment</p>
          </div>
          <div className="border border-slate-200 px-4 py-2 rounded-lg bg-slate-50">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">Confidence</div>
            <div className="text-2xl font-semibold text-slate-900">{analysis.confidence_score}%</div>
          </div>
        </div>
        
        {analysis.confidence_reasons && analysis.confidence_reasons.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Analysis Basis</div>
            <div className="grid grid-cols-2 gap-2">
              {analysis.confidence_reasons.map((reason, i) => (
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
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Health Metrics Overview</h2>
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
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Detailed Health Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'metabolic_rate_estimate', label: 'Metabolic Rate' },
            { key: 'cortisol_pattern', label: 'Cortisol Pattern' },
            { key: 'sleep_quality', label: 'Sleep Quality' },
            { key: 'recovery_capacity', label: 'Recovery Capacity' },
            { key: 'stress_resilience', label: 'Stress Resilience' },
            { key: 'energy_stability', label: 'Energy Stability' },
            { key: 'inflammation_risk', label: 'Inflammation Risk' },
            { key: 'cardiovascular_health', label: 'Cardiovascular Health' }
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
                      {translateValue(value)}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {score}
                  </div>
                </div>
                
                {details && (
                  <div className="space-y-3 text-sm pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Analysis</div>
                      <div className="text-slate-700 leading-relaxed">{details.reason}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Target</div>
                      <div className="text-slate-700 leading-relaxed">{details.target}</div>
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
            <div className="text-base font-semibold text-slate-900 mb-4">Strengths to Maintain</div>
            <div className="space-y-2">
              {analysis.strengths.map((s, i) => (
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
            <div className="text-base font-semibold text-slate-900 mb-4">Areas for Improvement</div>
            <div className="space-y-2">
              {analysis.risk_factors.map((r, i) => (
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
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Personalized Action Plan</h2>
            <p className="text-slate-600">{plan.micro_habits.length} micro-habits tailored for you</p>
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
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Trigger</span>
                        <span className="text-slate-700 flex-1">{habit.cue}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Action</span>
                        <span className="text-slate-900 font-medium flex-1">{habit.response}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Timing</span>
                        <span className="text-slate-700 flex-1">{habit.timing}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-700">Rationale: </span>{habit.rationale}
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
          Edit Health Parameters
        </button>
      </div>
    </div>
  );
}
