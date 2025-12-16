"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// 颜色常量：红色→橙色→绿色渐变
const GRADIENT_CLASS = "bg-gradient-to-t from-[#FF5D5D] via-[#FF9A62] to-[#5A7A4A]";

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
  <div className="flex flex-col justify-between p-6 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-[0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-none rounded-[24px] h-[320px] relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-none transition-all duration-500">
    <div className="z-10 relative">
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed line-clamp-2">{subtitle}</p>
    </div>
    <div className="relative w-full h-40 flex items-end justify-center">
      {children}
    </div>
    <div className="flex items-center text-xs font-semibold text-gray-400 dark:text-neutral-500 group-hover:text-[#FF5D5D] dark:group-hover:text-orange-400 transition-colors cursor-pointer">
      {linkText}
      <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

// --- 左侧：拟物化呼吸滑块 (Skeuomorphic Sliders) ---
const SecuritySliders = () => {
  return (
    <div className="flex items-end justify-between w-full px-4 gap-4 h-full">
      {Array.from({ length: 7 }).map((_, i) => (
        <SliderItem key={i} index={i} total={7} />
      ))}
    </div>
  );
};

const SliderItem = ({ index, total }: { index: number; total: number }) => {
  const variants = {
    animate: {
      height: ["30%", "75%", "30%"],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: index * 0.6,
      },
    },
  };

  return (
    <div className="relative w-full h-full flex justify-center">
      {/* 轨道 */}
      <div className="w-3 h-full bg-gray-100 dark:bg-neutral-800 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden relative">
        {/* 彩色填充条 */}
        <motion.div
          variants={variants}
          animate="animate"
          className={`absolute bottom-0 w-full rounded-full ${GRADIENT_CLASS} opacity-90`}
        />
      </div>
      {/* 旋钮 */}
      <motion.div
        variants={variants}
        animate="animate"
        className="absolute bottom-0 w-8 h-full pointer-events-none"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.15)] border border-gray-50 z-20" />
      </motion.div>
    </div>
  );
};

// --- 右侧：数据律动柱 (Rhythmic Bars) ---
const DataFrequencyBars = () => {
  return (
    <div className="flex items-end justify-between w-full px-2 gap-2 h-full">
      {Array.from({ length: 13 }).map((_, i) => (
        <BarItem key={i} index={i} />
      ))}
    </div>
  );
};

const BarItem = ({ index }: { index: number }) => {
  const variants = {
    animate: {
      height: [`${20 + Math.random() * 10}%`, `${40 + Math.random() * 40}%`, `${20 + Math.random() * 10}%`],
      transition: {
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
        delay: index * 0.2,
      },
    },
  };

  return (
    <div className="w-full h-full flex items-end bg-transparent rounded-t-full overflow-hidden">
      <motion.div
        variants={variants}
        animate="animate"
        className={`w-full rounded-t-md ${GRADIENT_CLASS}`}
      />
    </div>
  );
};

export function HealthDashboardWidget() {
  const { t } = useI18n();
  
  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
        <CardShell
          title={t('health.emotionMonitor')}
          subtitle={t('health.emotionMonitorDesc')}
          linkText={t('health.viewReport')}
        >
          <SecuritySliders />
        </CardShell>
        <CardShell
          title={t('health.dopamineAnalysis')}
          subtitle={t('health.dopamineAnalysisDesc')}
          linkText={t('health.viewTrend')}
        >
          <DataFrequencyBars />
        </CardShell>
      </div>
    </section>
  );
}
