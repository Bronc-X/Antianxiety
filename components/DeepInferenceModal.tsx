'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, BookOpen, Lightbulb, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useDeepInference } from '@/hooks/domain/useDeepInference';

interface Citation {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  relevance: string;
}

interface DeepInferenceData {
  sections: {
    dataAnalysis: {
      title: string;
      content: string;
      metrics: { name: string; value: string; trend: string }[];
    };
    inferenceLogic: {
      title: string;
      steps: { step: number; description: string; reasoning: string }[];
    };
    scientificBasis: {
      title: string;
      citations: Citation[];
    };
    conclusions: {
      title: string;
      findings: string[];
      recommendations: string[];
    };
  };
}

interface DeepInferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: any;
  recentLogs: any[];
}

export default function DeepInferenceModal({
  isOpen,
  onClose,
  analysisResult,
  recentLogs,
}: DeepInferenceModalProps) {
  const { fetchInference } = useDeepInference();
  const [data, setData] = useState<DeepInferenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dataAnalysis');

  useEffect(() => {
    if (isOpen && !data) {
      fetchDeepInference();
    }
  }, [isOpen]);

  const fetchDeepInference = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchInference({ analysisResult, recentLogs });

      if (!result) {
        throw new Error('获取推演数据失败');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'dataAnalysis', label: '数据分析', icon: <Brain className="w-4 h-4" /> },
    { id: 'inferenceLogic', label: '推理逻辑', icon: <ChevronRight className="w-4 h-4" /> },
    { id: 'scientificBasis', label: '科学依据', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'conclusions', label: '结论建议', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-4 md:inset-10 bg-white rounded-3xl z-50 overflow-hidden flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-[#E7E1D6]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F2F7F5] rounded-xl">
                  <Brain className="w-6 h-6 text-[#0B3D2E]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0B3D2E]">AI 深度推演</h2>
                  <p className="text-sm text-[#0B3D2E]/60">基于科学文献的健康状态分析</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#F2F7F5] rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-[#0B3D2E]" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 侧边导航 */}
              <div className="w-48 border-r border-[#E7E1D6] p-4 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-[#0B3D2E] text-white'
                        : 'text-[#0B3D2E] hover:bg-[#F2F7F5]'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </div>

              {/* 主内容 */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="w-8 h-8 text-[#0B3D2E] animate-spin" />
                    <p className="text-[#0B3D2E]/60">正在生成深度推演...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={fetchDeepInference}
                      className="px-4 py-2 bg-[#0B3D2E] text-white rounded-xl"
                    >
                      重试
                    </button>
                  </div>
                ) : data ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {activeSection === 'dataAnalysis' && (
                        <DataAnalysisSection data={data.sections.dataAnalysis} />
                      )}
                      {activeSection === 'inferenceLogic' && (
                        <InferenceLogicSection data={data.sections.inferenceLogic} />
                      )}
                      {activeSection === 'scientificBasis' && (
                        <ScientificBasisSection data={data.sections.scientificBasis} />
                      )}
                      {activeSection === 'conclusions' && (
                        <ConclusionsSection data={data.sections.conclusions} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DataAnalysisSection({ data }: { data: DeepInferenceData['sections']['dataAnalysis'] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#0B3D2E]">{data.title}</h3>
      <p className="text-[#0B3D2E]/70 leading-relaxed">{data.content}</p>
      
      <div className="grid grid-cols-2 gap-4">
        {data.metrics.map((metric, index) => (
          <div key={index} className="p-4 bg-[#F2F7F5] rounded-2xl">
            <div className="text-sm text-[#0B3D2E]/60 mb-1">{metric.name}</div>
            <div className="text-xl font-semibold text-[#0B3D2E]">{metric.value}</div>
            <div className="text-xs text-[#0B3D2E]/50 mt-1">{metric.trend}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InferenceLogicSection({ data }: { data: DeepInferenceData['sections']['inferenceLogic'] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#0B3D2E]">{data.title}</h3>
      
      <div className="space-y-4">
        {data.steps.map((step) => (
          <div key={step.step} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[#0B3D2E] text-white rounded-full flex items-center justify-center text-sm font-semibold">
              {step.step}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[#0B3D2E] mb-1">{step.description}</h4>
              <p className="text-sm text-[#0B3D2E]/70 leading-relaxed">{step.reasoning}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScientificBasisSection({ data }: { data: DeepInferenceData['sections']['scientificBasis'] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#0B3D2E]">{data.title}</h3>
      
      <div className="space-y-4">
        {data.citations.map((citation) => (
          <div key={citation.id} className="p-4 border border-[#E7E1D6] rounded-2xl">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-[#0B3D2E] mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#0B3D2E]">{citation.title}</h4>
                <p className="text-sm text-[#0B3D2E]/60 mt-1">
                  {citation.authors} · {citation.journal} · {citation.year}
                </p>
                <p className="text-sm text-[#0B3D2E]/70 mt-2 italic">
                  相关性：{citation.relevance}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConclusionsSection({ data }: { data: DeepInferenceData['sections']['conclusions'] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold text-[#0B3D2E]">{data.title}</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-[#0B3D2E] mb-3">主要发现</h4>
          <div className="space-y-2">
            {data.findings.map((finding, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#F2F7F5] rounded-xl">
                <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[#0B3D2E]/80">{finding}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-[#0B3D2E] mb-3">改善建议</h4>
          <div className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-emerald-800">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
