'use client';

import React, { useState, useEffect, useCallback, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// 抽卡效果 Hook - 跟随光标的 3D 倾斜动画
function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 50 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);
  
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const sheenY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };
  
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  
  return { ref, rotateX, rotateY, sheenX, sheenY, handleMouseMove, handleMouseLeave };
}

// 金句数据 - 品牌核心理念
const WISDOM_QUOTES = [
  {
    text: "在生活中保持规律和有序，是为了在工作中展现狂野与独创。",
    textEn: "Be regular and orderly in your life, so that you may be violent and original in your work.",
    source: "福楼拜 · 致 Gertrud Tennant 的信 (1876)",
    sourceEn: "Gustave Flaubert · Letter to Gertrud Tennant (1876)"
  },
  {
    text: "内环境的恒常性，是自由与独立生命的必要条件。",
    textEn: "The constancy of the internal environment is the condition for free and independent life.",
    source: "克洛德·贝尔纳 ·《实验医学研究导论》(1865)",
    sourceEn: "Claude Bernard · Introduction to Experimental Medicine (1865)"
  },
  {
    text: "投资应该像看着油漆变干，或看着草生长一样枯燥。如果你想要刺激，拿800块去拉斯维加斯。",
    textEn: "Investing should be more like watching paint dry or watching grass grow. If you want excitement, take $800 and go to Las Vegas.",
    source: "保罗·萨缪尔森 · 诺贝尔经济学奖得主",
    sourceEn: "Paul Samuelson · Nobel Laureate in Economics"
  },
  {
    text: "我们信仰上帝。除此之外，其他人请拿数据说话。",
    textEn: "In God we trust. All others must bring data.",
    source: "戴明 · 全面质量管理之父",
    sourceEn: "W. Edwards Deming · Father of TQM"
  },
  {
    text: "大脑不是用来思考的，而是用来为你身体的预算进行配平的。",
    textEn: "Your brain is not for thinking. It's for running a budget for your body.",
    source: "丽莎·巴雷特 ·《关于大脑的七又二分之一堂课》",
    sourceEn: "Lisa Feldman Barrett · Seven and a Half Lessons About the Brain"
  },
  {
    text: "人类所有的不幸，都源于人无法独自在房间里安静地坐着。",
    textEn: "All of humanity's problems stem from man's inability to sit quietly in a room alone.",
    source: "帕斯卡 ·《思想录》",
    sourceEn: "Blaise Pascal · Pensées"
  },
  {
    text: "在刺激与回应之间，存在一个空间。那个空间里，藏着我们选择回应方式的力量。",
    textEn: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    source: "维克多·弗兰克 ·《活出意义来》",
    sourceEn: "Viktor Frankl · Man's Search for Meaning"
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
  const { language } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { ref, rotateX, rotateY, sheenX, sheenY, handleMouseMove, handleMouseLeave } = useCardTilt();

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
    <div className={`relative overflow-hidden ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { handleMouseLeave(); setIsHovered(false); }}
        onMouseEnter={() => setIsHovered(true)}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
      >
        {/* 光泽层 - 跟随光标 */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl overflow-hidden"
          style={{ background: `radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255,255,255,0.3) 0%, transparent 50%)` }}
        />
        
        {/* 边缘光效 */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `linear-gradient(135deg, rgba(251,191,36,0.3) 0%, transparent 50%, rgba(249,115,22,0.2) 100%)` }}
        />

        <div className="bg-gradient-to-r from-white to-amber-50/60 dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 border border-amber-200/60 dark:border-neutral-700 relative shadow-sm">
          {/* 装饰图标 */}
          <div className="absolute top-3 right-3 opacity-20">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
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
              {/* 主文字 - 悬停时有高级渐变和发光效果 */}
              <motion.p 
                className="text-base font-medium leading-relaxed mb-3 tracking-wide"
                animate={isHovered ? {
                  textShadow: '0 2px 8px rgba(11,61,46,0.15)',
                  letterSpacing: '0.04em',
                  backgroundImage: 'linear-gradient(135deg, #0B3D2E 0%, #1a5a42 50%, #0B3D2E 100%)',
                } : {
                  textShadow: '0 0 0px transparent',
                  letterSpacing: '0.015em',
                  backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #1a1a1a 100%)',
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                "{language === 'en' ? currentQuote.textEn : currentQuote.text}"
              </motion.p>
              {/* 来源 - 悬停时淡入更明显 */}
              <motion.p 
                className="text-xs font-medium tracking-wider"
                animate={isHovered ? {
                  opacity: 1,
                  y: 0,
                  color: '#0B3D2E',
                } : {
                  opacity: 0.7,
                  y: 0,
                  color: '#4a4a4a',
                }}
                transition={{ duration: 0.3 }}
              >
                — {language === 'en' ? currentQuote.sourceEn : currentQuote.source}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={prevQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="上一条"
          >
            <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                    ? 'bg-amber-500 dark:bg-amber-400 w-4' 
                    : 'bg-amber-200 dark:bg-neutral-600 hover:bg-amber-300 dark:hover:bg-neutral-500'
                }`}
                aria-label={`跳转到第 ${idx + 1} 条`}
              />
            ))}
          </div>
          
          <button
            onClick={nextQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="下一条"
          >
            <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

export default WisdomCarousel;
