"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// --- 辅助组件：卡片外壳 ---
const CardShell = ({
  title,
  subtitle,
  children,
  linkText = "了解更多安全信息",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  linkText?: string;
}) => {
  return (
    <div className="flex flex-col justify-between p-8 bg-white border border-gray-100 shadow-sm rounded-3xl h-[420px] overflow-hidden relative group hover:shadow-md transition-shadow duration-300">
      <div className="z-10 relative">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[90%]">
          {subtitle}
        </p>
        <div className="mt-6 flex items-center text-sm font-medium text-gray-600 cursor-pointer hover:text-orange-500 transition-colors">
          {linkText}
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
      {/* 动画区域容器 */}
      <div className="mt-auto relative w-full h-48 flex items-end justify-center">
        {children}
      </div>
    </div>
  );
};

// --- 左侧动画：呼吸滑块 (Sliders) ---
const SecuritySliders = () => {
  // 生成8个滑块的配置
  const sliders = Array.from({ length: 8 });

  return (
    <div className="flex items-end justify-between w-full px-2 gap-3 h-full pb-4">
      {sliders.map((_, i) => (
        <SliderItem key={i} index={i} />
      ))}
    </div>
  );
};


const SliderItem = ({ index }: { index: number }) => {
  // 为每个滑块生成稍微不同的动画参数，制造"有机"的波动感
  const heightVariants = {
    animate: {
      height: [
        `${20 + (index * 5) % 40}%`, // 起始高度
        `${60 + (index * 7) % 30}%`, // 中间高度
        `${30 + (index * 3) % 40}%`  // 结束高度
      ],
      transition: {
        duration: 3 + (index * 0.2), // 持续时间错开
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
        delay: index * 0.1, // 启动延迟错开
      },
    },
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-full flex items-end overflow-hidden group">
      {/* 灰色轨道背景 */}
      <div className="absolute inset-0 bg-gray-100/50" />
      {/* 彩色填充条 + 顶部的圆钮 */}
      <motion.div
        variants={heightVariants}
        animate="animate"
        className="w-full bg-gradient-to-t from-orange-400 to-rose-500 relative rounded-b-full"
      >
        {/* 白色圆钮 (Knob) */}
        <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[calc(100%-4px)] aspect-square bg-white rounded-full shadow-sm z-10" />
      </motion.div>
    </div>
  );
};

// --- 右侧动画：数据频率柱状图 (Frequency Bars) ---
const DataFrequencyBars = () => {
  const bars = Array.from({ length: 16 });

  return (
    <div className="flex items-end justify-between w-full px-2 gap-1.5 h-full pb-6">
      {bars.map((_, i) => (
        <BarItem key={i} index={i} />
      ))}
    </div>
  );
};

const BarItem = ({ index }: { index: number }) => {
  // 使用确定性的动画参数避免 SSR hydration 问题
  const baseHeight1 = 15 + ((index * 7) % 20);
  const baseHeight2 = 40 + ((index * 11) % 50);
  const baseHeight3 = 20 + ((index * 5) % 20);
  const duration = 2 + ((index * 3) % 15) / 10;

  const barVariants = {
    animate: {
      height: [
        `${baseHeight1}%`,
        `${baseHeight2}%`,
        `${baseHeight3}%`
      ],
      transition: {
        duration: duration,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
        delay: index * 0.05,
      },
    },
  };

  return (
    <motion.div
      variants={barVariants}
      animate="animate"
      className="w-full bg-gradient-to-t from-orange-400 to-rose-500 rounded-t-sm rounded-b-sm opacity-90"
    />
  );
};


// --- 主导出组件 ---
export default function HealthDashboardWidget() {
  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* 左卡片：情绪波动监测 */}
        <CardShell
          title="情绪波动监测"
          subtitle="通过先进的生物反馈协议，实时追踪您的焦虑水平与心率变异性(HRV)，数据安全加密。"
          linkText="查看详细报告"
        >
          <SecuritySliders />
        </CardShell>

        {/* 右卡片：多巴胺水平分析 */}
        <CardShell
          title="多巴胺水平分析"
          subtitle="基于您的运动数据与睡眠质量，智能生成每日神经递质趋势图，助您科学调节状态。"
          linkText="查看趋势分析"
        >
          <DataFrequencyBars />
        </CardShell>
      </div>
    </div>
  );
}
