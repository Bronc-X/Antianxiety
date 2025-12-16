'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Code2, ExternalLink } from 'lucide-react';

// ------------------------------------------
// 1. 静态数据生成 (模拟视频内容)
// ------------------------------------------
const generateItems = (baseId: number) => [
  {
    id: baseId + 1,
    title: "Motion 12.23 revolutionizes staggered animations",
    desc: "delayChildren now accepts stagger() function enabling advanced timing control for variant children",
    tag: "Motion"
  },
  {
    id: baseId + 2,
    title: "Layout animation performance breakthrough",
    desc: "New optimization writes directly to element.style, reducing render overhead by 40%",
    tag: "Performance"
  },
  {
    id: baseId + 3,
    title: "React 19 compatibility officially confirmed",
    desc: "Motion library successfully tested with latest React version, strict mode issues resolved",
    tag: "React"
  },
  {
    id: baseId + 4,
    title: "WAAPI animations get linear() easing upgrade",
    desc: "Custom easing functions now compile to native CSS linear() for hardware acceleration",
    tag: "Animation"
  }
];

export default function TestInfiniteFeedPage() {
  // 初始数据
  const [items, setItems] = useState(generateItems(0));
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // 2. 加载更多逻辑
  // ------------------------------------------
  const loadMore = () => {
    if (isLoading) return;
    setIsLoading(true);

    // 模拟 1.5秒 网络请求
    setTimeout(() => {
      const newItems = generateItems(items.length);
      setItems(prev => [...prev, ...newItems]);
      setIsLoading(false);
    }, 1500);
  };

  // 监听滚动到底部
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.5 } // 露出一半时触发
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [items]); // 依赖 items 变化重新绑定

  return (
    // 外层容器：强制深色背景，强制最小高度，防止黑屏
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      {/* ------------------------------------------
          Part A: 顶部导航栏 (还原视频上方 UI)
      ------------------------------------------ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-14 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Examples</span>
          </div>
          <span className="text-zinc-600">/</span>
          <span className="text-white">Infinite loading</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors">
            <ExternalLink size={14} />
            Open in Cursor
          </button>
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Code2 size={16} />
          </button>
        </div>
      </nav>

      {/* ------------------------------------------
          Part B: 主内容区域
      ------------------------------------------ */}
      <main className="pt-32 pb-20 max-w-2xl mx-auto px-6">
        {/* 大标题 "News" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <h1 className="text-7xl font-bold tracking-tighter text-white mb-4">News</h1>
          <p className="text-zinc-500 text-lg">
            The latest news from <br /> the world of Motion
          </p>
        </motion.div>

        {/* 列表内容 */}
        <div className="space-y-12">
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${index}`} // 确保 key 唯一
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: (index % 4) * 0.1, // 经典的交错动画
                ease: "easeOut"
              }}
              className="group cursor-pointer"
            >
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors duration-300">
                  {item.title}
                </h2>
                <p className="text-zinc-500 text-lg leading-relaxed">{item.desc}</p>
                {/* 极简的标签 */}
                <div className="flex pt-1">
                  <span className="text-xs font-mono text-zinc-600 border border-zinc-800 px-2 py-1 rounded group-hover:border-emerald-500/30 group-hover:text-emerald-500/70 transition-colors">
                    {item.tag}
                  </span>
                </div>
              </div>
              {/* 分割线 */}
              <div className="mt-8 h-px w-full bg-zinc-900" />
            </motion.div>
          ))}
        </div>

        {/* ------------------------------------------
            Part C: 底部加载动画 (还原视频里的绿圈)
        ------------------------------------------ */}
        <div ref={loadingRef} className="h-32 flex items-center justify-center w-full mt-4">
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="relative flex items-center justify-center"
              >
                {/* 1. 光晕背景 */}
                <div className="absolute w-12 h-12 bg-emerald-500/20 rounded-full blur-xl" />
                {/* 2. 转圈图标 */}
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
