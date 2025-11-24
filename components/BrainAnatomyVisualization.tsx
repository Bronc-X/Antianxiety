'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Zap, Activity, AlertCircle } from 'lucide-react';

/**
 * 高级大脑3D解剖图动画组件
 * 专业医学研究级别的神经科学可视化
 * 符合 No More Anxious 品牌风格：深绿色 #0B3D2E + 米白色 #FAF6EF
 */

interface BrainRegion {
  id: string;
  name: string;
  chineseName: string;
  function: string;
  neurotransmitters: string[];
  position: { x: number; y: number };
  color: string;
  size: number;
}

const brainRegions: BrainRegion[] = [
  {
    id: 'prefrontal',
    name: 'Prefrontal Cortex',
    chineseName: '前额叶皮层',
    function: '执行功能、决策、情绪调控',
    neurotransmitters: ['多巴胺', '去甲肾上腺素'],
    position: { x: 30, y: 35 },
    color: '#0B3D2E',
    size: 80
  },
  {
    id: 'amygdala',
    name: 'Amygdala',
    chineseName: '杏仁核',
    function: '恐惧反应、情绪记忆',
    neurotransmitters: ['皮质醇', 'GABA'],
    position: { x: 50, y: 55 },
    color: '#DC2626',
    size: 40
  },
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    chineseName: '海马体',
    function: '记忆形成、空间导航',
    neurotransmitters: ['乙酰胆碱', '血清素'],
    position: { x: 55, y: 48 },
    color: '#2563EB',
    size: 50
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    chineseName: '下丘脑',
    function: 'HPA轴调控、昼夜节律',
    neurotransmitters: ['CRH', 'ACTH'],
    position: { x: 45, y: 58 },
    color: '#F59E0B',
    size: 35
  },
  {
    id: 'vagus',
    name: 'Vagus Nerve',
    chineseName: '迷走神经',
    function: '副交感神经、心率变异性',
    neurotransmitters: ['乙酰胆碱'],
    position: { x: 50, y: 75 },
    color: '#10B981',
    size: 30
  },
  {
    id: 'pfc-dlpfc',
    name: 'Dorsolateral PFC',
    chineseName: '背外侧前额叶',
    function: '工作记忆、认知控制',
    neurotransmitters: ['多巴胺'],
    position: { x: 28, y: 30 },
    color: '#6366F1',
    size: 45
  }
];

// 神经通路连接
const neuralPathways = [
  { from: 'prefrontal', to: 'amygdala', label: '情绪调控通路', type: 'inhibitory' },
  { from: 'amygdala', to: 'hypothalamus', label: 'HPA轴激活', type: 'excitatory' },
  { from: 'hippocampus', to: 'prefrontal', label: '记忆-决策环路', type: 'bidirectional' },
  { from: 'hypothalamus', to: 'vagus', label: '自主神经控制', type: 'excitatory' }
];

export default function BrainAnatomyVisualization() {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [viewMode, setViewMode] = useState<'sagittal' | 'coronal' | '3d'>('sagittal');

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <div className="w-full h-full min-h-[600px] bg-[#FAF6EF] rounded-[2rem] p-8 relative overflow-hidden border border-[#E7E1D6]">
      
      {/* 背景网格 - 医学影像风格 */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(11, 61, 46, 0.3) 25%, rgba(11, 61, 46, 0.3) 26%, transparent 27%, transparent 74%, rgba(11, 61, 46, 0.3) 75%, rgba(11, 61, 46, 0.3) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(11, 61, 46, 0.3) 25%, rgba(11, 61, 46, 0.3) 26%, transparent 27%, transparent 74%, rgba(11, 61, 46, 0.3) 75%, rgba(11, 61, 46, 0.3) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* 顶部控制栏 */}
      <div className="relative z-20 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0B3D2E] rounded-lg">
            <Brain className="w-5 h-5 text-[#FAF6EF]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[#0B3D2E]">脑区活动解析</h3>
            <p className="text-xs text-[#0B3D2E]/50">Neural Activity Mapping</p>
          </div>
        </div>

        {/* 视角切换 */}
        <div className="flex gap-2">
          {(['sagittal', 'coronal', '3d'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                viewMode === mode 
                  ? 'bg-[#0B3D2E] text-[#FAF6EF]' 
                  : 'bg-white text-[#0B3D2E]/60 hover:bg-[#0B3D2E]/10'
              }`}
            >
              {mode === 'sagittal' ? '矢状面' : mode === 'coronal' ? '冠状面' : '3D视图'}
            </button>
          ))}
        </div>
      </div>

      {/* 主要大脑可视化区域 */}
      <div className="relative z-10 flex gap-8">
        
        {/* 左侧：大脑SVG图 */}
        <div className="flex-1 relative">
          <svg 
            viewBox="0 0 400 400" 
            className="w-full h-full"
            style={{
              transform: isRotating ? `rotateY(${pulsePhase * 0.5}deg)` : 'none',
              transition: 'transform 0.5s ease-out'
            }}
          >
            {/* 大脑轮廓 - 矢状面 */}
            <g className="brain-outline">
              <path
                d="M 150 80 Q 120 100, 120 140 Q 115 180, 125 220 Q 130 260, 150 290 Q 180 310, 220 305 Q 260 300, 280 275 Q 295 250, 295 220 Q 298 180, 290 140 Q 285 100, 260 80 Q 230 65, 200 65 Q 170 65, 150 80 Z"
                fill="none"
                stroke="#0B3D2E"
                strokeWidth="3"
                opacity="0.3"
              />
              
              {/* 大脑皮层纹理 */}
              <path
                d="M 160 100 Q 155 110, 158 120 Q 161 130, 165 140"
                stroke="#0B3D2E"
                strokeWidth="2"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M 180 90 Q 175 100, 178 115 Q 181 130, 185 145"
                stroke="#0B3D2E"
                strokeWidth="2"
                fill="none"
                opacity="0.2"
              />
              <path
                d="M 200 85 Q 195 95, 198 110 Q 201 125, 205 140"
                stroke="#0B3D2E"
                strokeWidth="2"
                fill="none"
                opacity="0.2"
              />

              {/* 胼胝体 (Corpus Callosum) */}
              <ellipse
                cx="200"
                cy="200"
                rx="60"
                ry="15"
                fill="#0B3D2E"
                opacity="0.15"
              />
            </g>

            {/* 脑区标注点 */}
            {brainRegions.map((region, index) => {
              const isActive = activeRegion === region.id;
              const pulse = Math.sin((pulsePhase + index * 10) * 0.1) * 0.3 + 0.7;
              
              return (
                <g key={region.id}>
                  {/* 脉动圆圈 */}
                  <circle
                    cx={region.position.x * 4}
                    cy={region.position.y * 4}
                    r={region.size * 0.8 * pulse}
                    fill={region.color}
                    opacity={isActive ? 0.3 : 0.1}
                    className="transition-all duration-300"
                  />
                  
                  {/* 核心点 */}
                  <circle
                    cx={region.position.x * 4}
                    cy={region.position.y * 4}
                    r={region.size * 0.3}
                    fill={region.color}
                    opacity={isActive ? 1 : 0.6}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setActiveRegion(region.id)}
                    onMouseLeave={() => setActiveRegion(null)}
                  />

                  {/* 活动指示环 */}
                  {isActive && (
                    <circle
                      cx={region.position.x * 4}
                      cy={region.position.y * 4}
                      r={region.size * 0.5}
                      fill="none"
                      stroke={region.color}
                      strokeWidth="2"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        from={region.size * 0.5}
                        to={region.size * 0.8}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* 标注线 */}
                  {isActive && (
                    <g>
                      <line
                        x1={region.position.x * 4}
                        y1={region.position.y * 4}
                        x2={region.position.x * 4 + 40}
                        y2={region.position.y * 4 - 30}
                        stroke={region.color}
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <circle
                        cx={region.position.x * 4 + 40}
                        cy={region.position.y * 4 - 30}
                        r="3"
                        fill={region.color}
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* 神经通路连接线 */}
            {neuralPathways.map((pathway, index) => {
              const fromRegion = brainRegions.find(r => r.id === pathway.from);
              const toRegion = brainRegions.find(r => r.id === pathway.to);
              if (!fromRegion || !toRegion) return null;

              const isPathwayActive = activeRegion === pathway.from || activeRegion === pathway.to;
              const dashOffset = (pulsePhase * 2) % 100;

              return (
                <g key={`pathway-${index}`}>
                  <path
                    d={`M ${fromRegion.position.x * 4} ${fromRegion.position.y * 4} 
                        Q ${(fromRegion.position.x + toRegion.position.x) * 2} ${(fromRegion.position.y + toRegion.position.y) * 1.5}
                        ${toRegion.position.x * 4} ${toRegion.position.y * 4}`}
                    stroke={pathway.type === 'inhibitory' ? '#DC2626' : pathway.type === 'excitatory' ? '#10B981' : '#6366F1'}
                    strokeWidth={isPathwayActive ? '3' : '1.5'}
                    fill="none"
                    opacity={isPathwayActive ? 0.8 : 0.2}
                    strokeDasharray="8 4"
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300"
                  >
                    {isPathwayActive && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="100"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                </g>
              );
            })}
          </svg>

          {/* 脑电波动效果 */}
          <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20">
            <svg viewBox="0 0 400 80" className="w-full h-full">
              <path
                d={`M 0 40 ${Array.from({ length: 40 }, (_, i) => {
                  const x = i * 10;
                  const y = 40 + Math.sin((pulsePhase + i * 5) * 0.1) * 15;
                  return `L ${x} ${y}`;
                }).join(' ')}`}
                stroke="#0B3D2E"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* 右侧：信息面板 */}
        <div className="w-80 space-y-4">
          
          {/* 活跃脑区详情 */}
          {activeRegion ? (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#0B3D2E] shadow-lg">
              {(() => {
                const region = brainRegions.find(r => r.id === activeRegion);
                if (!region) return null;
                
                return (
                  <>
                    <div className="flex items-start gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: region.color + '20' }}
                      >
                        <Activity className="w-5 h-5" style={{ color: region.color }} />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#0B3D2E]">{region.chineseName}</h4>
                        <p className="text-xs text-[#0B3D2E]/50">{region.name}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-[#0B3D2E]/60 uppercase tracking-wide">功能</span>
                        <p className="text-sm text-[#0B3D2E] mt-1">{region.function}</p>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-[#0B3D2E]/60 uppercase tracking-wide">关键神经递质</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {region.neurotransmitters.map(nt => (
                            <span 
                              key={nt}
                              className="px-2 py-1 bg-[#FAF6EF] text-[#0B3D2E] text-xs rounded-lg border border-[#E7E1D6]"
                            >
                              {nt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white/50 rounded-2xl p-5 border border-[#E7E1D6] text-center">
              <AlertCircle className="w-8 h-8 text-[#0B3D2E]/30 mx-auto mb-2" />
              <p className="text-sm text-[#0B3D2E]/60">悬停在脑区上查看详情</p>
            </div>
          )}

          {/* 实时活动指标 */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E1D6]">
            <h4 className="text-sm font-medium text-[#0B3D2E] mb-4">实时神经活动</h4>
            <div className="space-y-3">
              {['多巴胺水平', '皮质醇波动', 'HRV变异性'].map((metric, index) => {
                const value = 40 + Math.sin((pulsePhase + index * 20) * 0.1) * 30;
                return (
                  <div key={metric}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#0B3D2E]/70">{metric}</span>
                      <span className="font-medium text-[#0B3D2E]">{value.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-[#FAF6EF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#0B3D2E] to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 神经通路图例 */}
          <div className="bg-white rounded-2xl p-5 border border-[#E7E1D6]">
            <h4 className="text-sm font-medium text-[#0B3D2E] mb-3">神经通路类型</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#10B981]" />
                <span className="text-xs text-[#0B3D2E]/70">兴奋性通路</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#DC2626]" />
                <span className="text-xs text-[#0B3D2E]/70">抑制性通路</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#6366F1]" />
                <span className="text-xs text-[#0B3D2E]/70">双向通路</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部时间轴 */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[#E7E1D6]">
        <div className="flex items-center justify-between text-xs text-[#0B3D2E]/50">
          <span>实时监测</span>
          <span className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            神经活动强度：{(50 + Math.sin(pulsePhase * 0.1) * 30).toFixed(0)}%
          </span>
          <span>更新频率：50Hz</span>
        </div>
      </div>
    </div>
  );
}
