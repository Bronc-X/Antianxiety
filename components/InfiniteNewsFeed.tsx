"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const mockNewsEn = [
  { id: 1, title: "Neural Networks Achieve Consciousness Threshold in Lab Tests", desc: "Breakthrough research demonstrates emergent self-awareness patterns in large-scale neural architectures", category: "AI Research", date: "2025.12.06", matchScore: 97, summary: "Researchers observed consciousness-like emergent behavior in large-scale neural networks. The study shows that when network scale reaches a certain threshold, self-referential and metacognitive abilities emerge.", url: "https://pubmed.ncbi.nlm.nih.gov/example1" },
  { id: 2, title: "Mitochondrial Optimization Protocol Shows 40% Energy Boost", desc: "New cellular intervention targets ATP production pathways for enhanced metabolic efficiency", category: "Biotech", date: "2025.12.05", matchScore: 94, summary: "By targeting mitochondrial complexes I and II, researchers developed a new intervention that significantly increases cellular ATP production. Clinical trials show 40% improvement in energy levels with no significant side effects.", url: "https://www.nature.com/articles/example2" },
  { id: 3, title: "Brain-Computer Interface Reaches 10Gbps Data Transfer", desc: "Neural implant technology achieves unprecedented bandwidth for direct cortical communication", category: "Neurotech", date: "2025.12.04", matchScore: 88, summary: "Next-generation neural implants using optogenetics achieve 10Gbps data transfer rates. This breakthrough enables high-fidelity thought-machine interaction, bringing new hope for paralyzed patients.", url: "https://www.science.org/doi/example3" },
  { id: 4, title: "Cellular Regeneration Reverses Aging Markers by 15 Years", desc: "Epigenetic reprogramming successfully restores youthful gene expression patterns", category: "Longevity", date: "2025.12.03", matchScore: 82, summary: "Through partial epigenetic reprogramming, researchers successfully reversed the biological age of human cells by 15 years. The technique maintains cellular functional characteristics without full dedifferentiation.", url: "https://www.semanticscholar.org/paper/example4" },
];

const mockNewsZh = [
  { id: 1, title: "神经网络在实验室测试中达到意识阈值", desc: "突破性研究展示大规模神经架构中涌现的自我意识模式", category: "AI研究", date: "2025.12.06", matchScore: 97, summary: "研究人员在大规模神经网络中观察到了类似意识的涌现行为。该研究表明，当网络规模达到一定阈值时，会出现自我参照和元认知能力。这对理解人类意识的本质具有重要意义。", url: "https://pubmed.ncbi.nlm.nih.gov/example1" },
  { id: 2, title: "线粒体优化协议显示40%能量提升", desc: "新型细胞干预靶向ATP生产途径以增强代谢效率", category: "生物技术", date: "2025.12.05", matchScore: 94, summary: "通过靶向线粒体复合物I和II，研究人员开发出一种新型干预方案，可显著提升细胞ATP产量。临床试验显示参与者报告精力水平提升40%，且无明显副作用。", url: "https://www.nature.com/articles/example2" },
  { id: 3, title: "脑机接口数据传输速率达10Gbps", desc: "神经植入技术实现前所未有的直接皮层通信带宽", category: "神经科技", date: "2025.12.04", matchScore: 88, summary: "新一代神经植入设备采用光遗传学技术，实现了10Gbps的数据传输速率。这一突破使得高保真度的思维-机器交互成为可能，为瘫痪患者带来新希望。", url: "https://www.science.org/doi/example3" },
  { id: 4, title: "细胞再生逆转衰老标记15年", desc: "表观遗传重编程成功恢复年轻基因表达模式", category: "长寿研究", date: "2025.12.03", matchScore: 82, summary: "通过部分表观遗传重编程技术，研究人员成功将人类细胞的生物年龄逆转15年。该技术不涉及完全去分化，保持了细胞的功能特性，为抗衰老治疗开辟新途径。", url: "https://www.semanticscholar.org/paper/example4" },
];

// 根据匹配度返回对应的绿色
const getMatchScoreColor = (score: number): string => {
  if (score >= 96) return '#166534'; // 96-100: 深绿 green-800
  if (score >= 91) return '#15803d'; // 91-95: 中深绿 green-700
  if (score >= 86) return '#16a34a'; // 86-90: 中绿 green-600
  return '#22c55e'; // 80-85: 浅绿 green-500
};

const getMatchScoreBg = (score: number): string => {
  if (score >= 96) return 'rgba(22, 101, 52, 0.15)'; // 96-100
  if (score >= 91) return 'rgba(21, 128, 61, 0.12)'; // 91-95
  if (score >= 86) return 'rgba(22, 163, 74, 0.10)'; // 86-90
  return 'rgba(34, 197, 94, 0.08)'; // 80-85
};

interface InfiniteNewsFeedProps {
  language?: string;
  variant?: 'terminal' | 'minimal' | 'card' | 'calm';
}

export default function InfiniteNewsFeed({ language = 'en', variant = 'calm' as const }: InfiniteNewsFeedProps) {
  // 强制使用 calm variant，忽略其他值
  const actualVariant = 'calm';
  const loadingRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const baseNews = language === 'zh' ? mockNewsZh : mockNewsEn;
  
  const [items, setItems] = useState(baseNews);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadMore = () => {
    if (isLoading) return;
    setIsLoading(true);
    setTimeout(() => {
      const currentLength = items.length;
      const nextBatch = baseNews.map((item, i) => ({ 
        ...item, 
        id: item.id + currentLength + i * 100
      }));
      setItems(prev => [...prev, ...nextBatch]);
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.5 }
    );
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    return () => observer.disconnect();
  }, [items]);

  // Calm variant - 符合项目 UI 风格，顶部底部渐变淡出
  // 始终使用 calm variant
  if (true) {
    return (
      <div className="h-full flex flex-col relative bg-gradient-to-b from-[#FFFDF8] to-white dark:from-neutral-900 dark:to-neutral-950">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E7E1D6] dark:border-neutral-800 bg-gradient-to-r from-[#FFFDF8] to-white dark:from-neutral-900 dark:to-neutral-900 z-20 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0B3D2E] dark:text-white">
              {language === 'zh' ? '为你精选' : 'Curated For You'}
            </h3>
            <span className="text-xs text-[#9CAF88] dark:text-neutral-400 font-mono">
              {new Date().toISOString().split('T')[0]}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            {language === 'zh' 
              ? '基于你的健康画像，从 PubMed、Semantic Scholar 等学术源精选' 
              : 'Based on your health profile, curated from PubMed, Semantic Scholar & more'}
          </p>
        </div>

        {/* Scrollable content with top/bottom fade masks */}
        <div className="flex-1 relative overflow-hidden">
          {/* Top fade overlay - 使用 CSS 类处理深色模式 */}
          <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-b from-[#FFFDF8] to-transparent dark:from-neutral-900 dark:to-transparent" />
          
          {/* Bottom fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 bg-gradient-to-t from-white to-transparent dark:from-neutral-950 dark:to-transparent" />

          {/* Scrollable area */}
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overscroll-contain py-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>
            
            {items.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const scoreColor = getMatchScoreColor(item.matchScore);
              const scoreBg = getMatchScoreBg(item.matchScore);
              
              return (
                <motion.div
                  key={`${item.id}-${index}`}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.5,
                    delay: (index % 4) * 0.08,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="group cursor-pointer px-5 py-4 hover:bg-[#FAF6EF]/60 dark:hover:bg-neutral-800/60 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex flex-col gap-2">
                    {/* 标题行：标题 + 匹配度 */}
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-base font-medium text-[#0B3D2E] dark:text-white group-hover:text-[#9CAF88] dark:group-hover:text-neutral-300 transition-colors duration-200 leading-snug flex-1">
                        {item.title}
                      </h4>
                      {/* 匹配度评分 */}
                      <span 
                        className="flex-shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md"
                        style={{ color: scoreColor, backgroundColor: scoreBg }}
                      >
                        {language === 'zh' ? '匹配' : 'Match'} {item.matchScore}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed line-clamp-2">{item.desc}</p>
                    
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[11px] font-mono text-[#9CAF88] border border-[#E7E1D6] px-2 py-0.5 rounded group-hover:border-[#9CAF88] group-hover:bg-[#9CAF88]/10 transition-colors">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-gray-400">{item.date}</span>
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {isExpanded ? '▲ 收起' : '▼ 展开'}
                      </span>
                    </div>
                    
                    {/* 展开内容 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 border-t border-[#E7E1D6]/50">
                            {/* 概述 */}
                            <p className="text-sm text-[#0B3D2E]/80 dark:text-neutral-300 leading-relaxed mb-3">
                              {item.summary}
                            </p>
                            {/* 来源链接 */}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs text-[#9CAF88] hover:text-[#7A9A6A] transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              {language === 'zh' ? '查看原文' : 'View Source'}
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="mt-4 h-px w-full bg-[#E7E1D6]/50" />
                </motion.div>
              );
            })}

            {/* Loading trigger */}
            <div ref={loadingRef} className="h-20 flex items-center justify-center w-full">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="absolute w-12 h-12 bg-[#9CAF88]/20 rounded-full blur-xl" />
                    <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin relative z-10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Terminal variant
  if (variant === 'terminal') {
    return (
      <div className="terminal-container relative h-full overflow-hidden rounded-xl" style={{ backgroundColor: '#050505' }}>
        <div className="absolute top-0 left-0 right-0 z-30 px-6 py-4" style={{ backgroundColor: '#050505' }}>
          <span style={{ color: '#00ff41' }}>&gt; {language === 'zh' ? '研究动态' : 'RESEARCH_FEED'}</span>
        </div>
        <div 
          className="absolute top-12 left-0 right-0 h-20 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to bottom, #050505 0%, transparent 100%)' }}
        />
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-20"
          style={{ background: 'linear-gradient(to top, #050505 0%, transparent 100%)' }}
        />
        <div ref={scrollRef} className="h-full overflow-y-auto pt-16 pb-16 overscroll-contain" style={{ scrollbarWidth: 'none' }}>
          {items.map((item, index) => (
            <motion.div key={`${item.id}-${index}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="py-5 px-6 group">
              <div style={{ color: '#00aa2a' }} className="text-xs mb-2">[{item.category}] :: {item.date}</div>
              <h3 style={{ color: '#00ff41' }} className="text-base group-hover:text-[#00ff88] transition-colors">{item.title}</h3>
              <div className="mt-4 text-[10px] tracking-[0.2em]" style={{ color: '#00aa2a' }}>- - - - - - - - - - - - - - -</div>
            </motion.div>
          ))}
          <div ref={loadingRef} className="h-24 flex items-center justify-center">
            {isLoading && <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#00ff41' }} />}
          </div>
        </div>
      </div>
    );
  }

  // Card / Minimal variants
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[#E7E1D6]">
        <h3 className="text-lg font-semibold text-[#0B3D2E]">{language === 'zh' ? '研究动态' : 'Research Feed'}</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        {items.map((item, index) => (
          <motion.div key={`${item.id}-${index}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-5 py-4 hover:bg-gray-50">
            <h4 className="text-base font-medium text-[#0B3D2E]">{item.title}</h4>
            <span className="text-xs text-gray-400 mt-2 inline-block">{item.category}</span>
            <div className="mt-3 h-px bg-gray-100" />
          </motion.div>
        ))}
        <div ref={loadingRef} className="h-16 flex items-center justify-center">
          {isLoading && <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin" />}
        </div>
      </div>
    </div>
  );
}
