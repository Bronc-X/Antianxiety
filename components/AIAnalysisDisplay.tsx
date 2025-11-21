'use client';

interface AIAnalysisDisplayProps {
  analysis: {
    metabolic_rate_estimate?: string;
    cortisol_pattern?: string;
    sleep_quality?: string;
    recovery_capacity?: string;
    stress_resilience?: string;
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

export default function AIAnalysisDisplay({ analysis, plan }: AIAnalysisDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E7E1D6] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">生理分析结果</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-[#FAF6EF] rounded-lg">
            <div className="text-xs text-[#0B3D2E]/60 mb-1">代谢率</div>
            <div className="font-medium text-[#0B3D2E]">{analysis.metabolic_rate_estimate || '-'}</div>
          </div>
          <div className="p-3 bg-[#FAF6EF] rounded-lg">
            <div className="text-xs text-[#0B3D2E]/60 mb-1">皮质醇模式</div>
            <div className="font-medium text-[#0B3D2E]">{analysis.cortisol_pattern || '-'}</div>
          </div>
          <div className="p-3 bg-[#FAF6EF] rounded-lg">
            <div className="text-xs text-[#0B3D2E]/60 mb-1">睡眠质量</div>
            <div className="font-medium text-[#0B3D2E]">{analysis.sleep_quality || '-'}</div>
          </div>
          <div className="p-3 bg-[#FAF6EF] rounded-lg">
            <div className="text-xs text-[#0B3D2E]/60 mb-1">恢复能力</div>
            <div className="font-medium text-[#0B3D2E]">{analysis.recovery_capacity || '-'}</div>
          </div>
        </div>

        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">优势</div>
            <div className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="text-sm text-green-700 flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <div>
            <div className="text-sm font-medium text-[#0B3D2E] mb-2">需要关注</div>
            <div className="space-y-1">
              {analysis.risk_factors.map((r, i) => (
                <div key={i} className="text-sm text-orange-700 flex items-start">
                  <span className="mr-2">⚠</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#E7E1D6] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#0B3D2E] mb-4">AI 推荐方案</h2>
        
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
            <div className="text-sm font-medium text-[#0B3D2E] mb-3">微习惯建议</div>
            <div className="space-y-4">
              {plan.micro_habits.map((habit, i) => (
                <div key={i} className="p-4 bg-[#FAF6EF] rounded-lg">
                  <div className="font-medium text-[#0B3D2E] mb-2">{habit.name}</div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-[#0B3D2E]/60">触发：</span>{habit.cue}</div>
                    <div><span className="text-[#0B3D2E]/60">行为：</span>{habit.response}</div>
                    <div><span className="text-[#0B3D2E]/60">时机：</span>{habit.timing}</div>
                    <div className="text-xs text-[#0B3D2E]/60 mt-2">{habit.rationale}</div>
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
