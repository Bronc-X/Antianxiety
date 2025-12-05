'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// 金句数据 - 基于代谢精神病学和认知重构哲学
const WISDOM_QUOTES = [
  {
    text: "真相是抛弃想象后的安慰",
    textEn: "Truth is the comfort after discarding imagination",
    source: "Neuromind 核心哲学"
  },
  {
    text: "你的身体不是在失败，而是在适应",
    textEn: "Your body isn't failing, it's adapting",
    source: "代谢生理学"
  },
  {
    text: "焦虑是想象力的误用",
    textEn: "Anxiety is imagination misapplied",
    source: "认知重构理论"
  },
  {
    text: "线粒体知道什么时候该休息",
    textEn: "Mitochondria know when to rest",
    source: "细胞生物学"
  },
  {
    text: "神经系统的重新校准是智慧，不是软弱",
    textEn: "Nervous system recalibration is wisdom, not weakness",
    source: "迷走神经理论"
  },
  {
    text: "每一次呼吸都是与副交感神经的对话",
    textEn: "Every breath is a conversation with your parasympathetic system",
    source: "呼吸生理学"
  },
  {
    text: "睡眠不足时，你的身体在优先修复",
    textEn: "When sleep-deprived, your body prioritizes repair",
    source: "睡眠科学"
  },
  {
    text: "压力反应是保护机制，不是敌人",
    textEn: "Stress response is a protective mechanism, not an enemy",
    source: "应激生理学"
  }
];

interface WisdomCarouselProps {
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function WisdomCarousel({ 
  autoPlay = true, 
  interval = 8000,
  className = ''
}: WisdomCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextQuote = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % WISDOM_QUOTES.length);
  }, []);

  const prevQuote = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + WISDOM_QUOTES.length) % WISDOM_QUOTES.length);
  }, []);

  // 自动播放
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(nextQuote, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, nextQuote]);

  const currentQuote = WISDOM_QUOTES[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 rounded-2xl p-4 border border-amber-100/50">
        {/* 装饰图标 */}
        <div className="absolute top-3 right-3 opacity-20">
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        
        {/* 金句内容 */}
        <div className="min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-center px-8"
            >
              <p className="text-lg font-light text-[#0B3D2E] leading-relaxed mb-3 tracking-wide">
                "{currentQuote.text}"
              </p>
              <p className="text-sm text-[#0B3D2E]/60 font-light tracking-wider">
                — {currentQuote.source}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={prevQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 transition-colors"
            aria-label="上一条"
          >
            <ChevronLeft className="w-4 h-4 text-amber-600" />
          </button>
          
          {/* 指示器 */}
          <div className="flex gap-1.5">
            {WISDOM_QUOTES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-amber-500 w-4' 
                    : 'bg-amber-200 hover:bg-amber-300'
                }`}
                aria-label={`跳转到第 ${idx + 1} 条`}
              />
            ))}
          </div>
          
          <button
            onClick={nextQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 transition-colors"
            aria-label="下一条"
          >
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WisdomCarousel;
