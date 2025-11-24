import BrainAnatomyVisualization from '@/components/BrainAnatomyVisualization';

export default function BrainVizPreviewPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-medium text-[#0B3D2E] mb-2">
            神经科学可视化系统
          </h1>
          <p className="text-[#0B3D2E]/60">
            Neural Science Visualization System - Medical Research Grade
          </p>
        </div>
        
        <BrainAnatomyVisualization />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">交互说明</h3>
            <ul className="text-sm text-[#0B3D2E]/70 space-y-2">
              <li>• 悬停在脑区节点上查看详细信息</li>
              <li>• 观察神经通路的实时信号传递</li>
              <li>• 切换视角查看不同解剖平面</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">科学依据</h3>
            <p className="text-sm text-[#0B3D2E]/70">
              基于最新神经科学研究，精确标注HPA轴、迷走神经等关键通路，
              展示代谢性焦虑的神经生物学机制。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E1D6]">
            <h3 className="font-medium text-[#0B3D2E] mb-2">应用场景</h3>
            <ul className="text-sm text-[#0B3D2E]/70 space-y-2">
              <li>• AI分析报告可视化</li>
              <li>• 用户教育与科普</li>
              <li>• 干预效果展示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
