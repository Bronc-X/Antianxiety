import BrainAnatomyVisualization from '@/components/BrainAnatomyVisualization';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

export default async function BrainVizPreviewPage() {
  const language = await getServerLanguage();
  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-medium text-[#0B3D2E] mb-2">
            {tr(language, { zh: '神经科学可视化系统', en: 'Neuroscience Visualization' })}
          </h1>
          <p className="text-[#0B3D2E]/60">
            {tr(language, {
              zh: 'Neural Science Visualization System - Medical Research Grade',
              en: 'Neural Science Visualization System - Medical Research Grade',
            })}
          </p>
        </div>
        
        <BrainAnatomyVisualization />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">{tr(language, { zh: '交互说明', en: 'How to interact' })}</h3>
            <ul className="text-sm text-[#0B3D2E]/70 space-y-2">
              <li>{tr(language, { zh: '• 悬停在脑区节点上查看详细信息', en: '• Hover a region node to view details' })}</li>
              <li>{tr(language, { zh: '• 观察神经通路的实时信号传递', en: '• Observe real-time neural pathway signaling' })}</li>
              <li>{tr(language, { zh: '• 切换视角查看不同解剖平面', en: '• Switch views across anatomical planes' })}</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">{tr(language, { zh: '科学依据', en: 'Scientific basis' })}</h3>
            <p className="text-sm text-[#0B3D2E]/70">
              {tr(language, {
                zh: '基于最新神经科学研究，精确标注 HPA 轴、迷走神经等关键通路，展示代谢性焦虑的神经生物学机制。',
                en: 'Based on recent neuroscience research, it highlights key circuits (HPA axis, vagus nerve) to illustrate the neurobiology of metabolic anxiety.',
              })}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">{tr(language, { zh: '应用场景', en: 'Use cases' })}</h3>
            <ul className="text-sm text-[#0B3D2E]/70 space-y-2">
              <li>{tr(language, { zh: '• AI 分析报告可视化', en: '• Visualizing AI reports' })}</li>
              <li>{tr(language, { zh: '• 用户教育与科普', en: '• Education & explainer' })}</li>
              <li>{tr(language, { zh: '• 干预效果展示', en: '• Intervention outcome display' })}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
