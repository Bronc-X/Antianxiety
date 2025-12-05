"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// 颜色常量：提取自原视频的精准渐变
const GRADIENT_CLASS = "bg-gradient-to-t from-[#FF9A62] to-[#FF5D5D]";

const CardShell = ({
  title,
  subtitle,
  children,
  linkText,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  linkText: string;
}) => (
  <div className="flex flex-col justify-between p-8 bg-white border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] rounded-[32px] h-[460px] relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500">
    <div className="z-10 relative">
      <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-[90%] font-medium">
        {subtitle}
      </p>
      <div className="mt-6 flex items-center text-sm font-semibold text-gray-400 group-hover:text-[#FF5D5D] transition-colors cursor-pointer">
        {linkText}
        <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
    <div className="mt-auto relative w-full h-56 flex items-end justify-center pb-2">
      {children}
    </div>
  </div>
);

// --- 左侧：拟物化呼吸滑块 (Skeuomorphic Sliders) ---
const SecuritySliders = () => {
  return (
    <div className="flex items-end justify-between w-full px-4 gap-4 h-full">
      {/* 生成 7 个滑块，数量少一点，间距大一点，更像原版 */}
      {Array.from({ length: 7 }).map((_, i) => (
        <SliderItem key={i} index={i} total={7} />
      ))}
    </div>
  );
};

const SliderItem = ({ index, total }: { index: number; total: number }) => {
  // 核心算法：使用正弦波 (Sine Wave) 模拟自然的起伏，而不是随机数
  // 这样 1,2,3,4 号滑块会像波浪一样传递运动
  const variants = {
    animate: {
      height: ["30%", "75%", "30%"], // 这里的百分比决定了滑动的范围
      transition: {
        duration: 3, // 变慢，原版是很优雅的慢速
        repeat: Infinity,
        ease: "easeInOut" as const,
        // 关键：根据 index 计算延迟，形成波浪，而不是随机乱跳
        delay: index * 0.4,
      },
    },
  };

  return (
    <div className="relative w-full h-full flex justify-center">
      {/* 轨道：增加内阴影 (inset shadow) 制造凹槽感 */}
      <div className="w-3 h-full bg-gray-100 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] overflow-hidden relative">
        {/* 彩色填充条 */}
        <motion.div
          variants={variants}
          animate="animate"
          className={`absolute bottom-0 w-full rounded-full ${GRADIENT_CLASS} opacity-90`}
        />
      </div>
      {/* 旋钮 (Knob)：浮在轨道之上，跟随高度运动 */}
      {/* 注意：为了让旋钮跟填充条对齐，我们需要用同样的 motion value 或者由父级控制。
          为了简化且保持性能，这里我们让旋钮作为 Fill 的子元素，或者用 absolute 定位配合同样的动画。
          最稳健的方法是把 motion 加在父级容器上，或者计算高度。
          下面用一种 trick：让旋钮也是一个 motion div，参数完全一致。
      */}
      <motion.div
        variants={variants}
        animate="animate"
        className="absolute bottom-0 w-8 h-full pointer-events-none" // 这是一个隐形的容器，高度在变
      >
        {/* 真正的旋钮球体 - 位于隐形容器的顶部 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.15)] border border-gray-50 z-20" />
      </motion.div>
    </div>
  );
};


// --- 右侧：数据律动柱 (Rhythmic Bars) ---
const DataFrequencyBars = () => {
  return (
    <div className="flex items-end justify-between w-full px-2 gap-2 h-full">
      {/* 13个柱子 */}
      {Array.from({ length: 13 }).map((_, i) => (
        <BarItem key={i} index={i} />
      ))}
    </div>
  );
};

const BarItem = ({ index }: { index: number }) => {
  // 模拟音频频谱：中间高，两边低，并且在这个基础上波动
  // 使用多重关键帧模拟复杂的"跳动"
  const variants = {
    animate: {
      height: [
        `${20 + Math.random() * 10}%`,
        `${40 + Math.random() * 40}%`,
        `${20 + Math.random() * 10}%`,
      ],
      transition: {
        duration: 1.5 + Math.random(), // 稍微快一点的节奏
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
        delay: index * 0.1,
      },
    },
  };

  return (
    <div className="w-full h-full flex items-end bg-transparent rounded-t-full overflow-hidden">
      <motion.div
        variants={variants}
        animate="animate"
        // 顶部圆角，底部直角（或者微圆角）
        className={`w-full rounded-t-md ${GRADIENT_CLASS}`}
      />
    </div>
  );
};

export default function HealthDashboardWidgetV2() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-[#F8F9FA] min-h-screen flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <CardShell
          title="情绪波动监测"
          subtitle="实时追踪神经递质水平变化，通过生物反馈算法平滑您的焦虑曲线。"
          linkText="查看详细报告"
        >
          <SecuritySliders />
        </CardShell>

        <CardShell
          title="多巴胺水平分析"
          subtitle="基于每日运动量与睡眠深度的多巴胺趋势预测，助您找回掌控感。"
          linkText="查看趋势分析"
        >
          <DataFrequencyBars />
        </CardShell>
      </div>
    </div>
  );
}
