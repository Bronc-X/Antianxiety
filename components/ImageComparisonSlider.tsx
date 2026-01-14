"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { MoveHorizontal, Check } from "lucide-react";

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;
  slideText?: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export default function ImageComparisonSlider({
  beforeImage,
  afterImage,
  onComplete,
  onProgressChange,
  slideText = "Slide to Activate Energy",
}: ImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const x = useMotionValue(0);

  // 初始化和监听窗口大小
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      // 初始位置设为 15% 处，给用户一种"还需要努力"的暗示
      x.set(containerRef.current.offsetWidth * 0.15);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        if (isCompleted) {
          x.set(containerRef.current.offsetWidth);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCompleted, x]);

  // 监听拖拽进度
  useEffect(() => {
    const unsubscribe = x.on("change", (latestX) => {
      if (containerWidth === 0 || isCompleted) return;

      const progress = latestX / containerWidth;
      
      // 通知父组件进度变化
      onProgressChange?.(Math.max(0, Math.min(1, progress)));

      // 如果拖拽超过 95%，视为完成
      if (progress > 0.95) {
        setIsCompleted(true);
        // 自动吸附到 100%
        animate(x, containerWidth, { type: "spring", stiffness: 300, damping: 30 });

        // 触发手机震动 (Haptic Feedback)
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }

        if (onComplete) onComplete();
      }
    });

    return () => unsubscribe();
  }, [containerWidth, isCompleted, onComplete, onProgressChange, x]);

  // 动态计算裁切
  const clipPathRight = useTransform(x, (value) => {
    const rightInset = containerWidth - value;
    return `inset(0 ${Math.max(0, rightInset)}px 0 0)`;
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden select-none shadow-2xl ${
        isCompleted ? "cursor-default" : "cursor-ew-resize"
      } group ring-4 transition-all duration-700 ${
        isCompleted ? "ring-[#9CAF88]/50 scale-[1.02]" : "ring-transparent"
      }`}
    >
      {/* 1. 底层：黑白 (Before) */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
      {beforeImage && (
        <Image
          src={beforeImage}
          alt="Before"
          fill
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none filter grayscale brightness-75 contrast-125"
        />
      )}

      {/* 2. 顶层：彩色 (After) */}
      <motion.div
        style={{ clipPath: clipPathRight }}
        className="absolute inset-0 w-full h-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
        {afterImage && (
          <Image
            src={afterImage}
            alt="After"
            fill
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* 完成时的高光扫过效果 */}
        {isCompleted && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        )}
      </motion.div>

      {/* 3. 拖拽手柄 */}
      <motion.div
        style={{ x }}
        drag={isCompleted ? false : "x"}
        dragConstraints={{ left: 0, right: containerWidth }}
        dragElastic={0}
        dragMomentum={false}
        className="absolute top-0 bottom-0 z-30 w-1 -ml-[2px] h-full"
      >
        {/* 白线：完成后消失 */}
        {!isCompleted && (
          <div className="w-1 h-full bg-white/80 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
        )}

        {/* 按钮：完成后变形 */}
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center transition-colors duration-300 ${
            isCompleted ? "bg-[#9CAF88] text-white" : "bg-[#FAF6EF] text-[#2C2C2C]"
          }`}
          whileHover={!isCompleted ? { scale: 1.1 } : {}}
          whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        >
          {isCompleted ? <Check size={28} strokeWidth={3} /> : <MoveHorizontal size={24} />}
        </motion.div>
      </motion.div>

      {/* 引导文字：完成后淡出 */}
      <motion.div
        animate={{ opacity: isCompleted ? 0 : 1 }}
        className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-20"
      >
        <span className="bg-[#2C2C2C]/70 backdrop-blur-md text-[#E8DFD0] px-4 py-2 rounded-full text-sm font-medium tracking-wide border border-[#C4A77D]/30">
          {slideText}
        </span>
      </motion.div>
    </div>
  );
}
