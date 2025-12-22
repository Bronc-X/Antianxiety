'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, MotionProps } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 导出按钮按下时的缩放比例常量
export const MOTION_BUTTON_TAP_SCALE = 0.95;

// 创建一个 motion 版本的 Shadcn Button
const MotionBtn = motion(Button);

export interface MotionButtonProps extends React.ComponentProps<typeof Button> {
  hapticFeedback?: boolean;
  glowEffect?: boolean;
  magneticEffect?: boolean;
  whileHover?: MotionProps['whileHover'];
  whileTap?: MotionProps['whileTap'];
  transition?: MotionProps['transition'];
  initial?: MotionProps['initial'];
  animate?: MotionProps['animate'];
  exit?: MotionProps['exit'];
  variants?: MotionProps['variants'];
}

export function MotionButton({
  children,
  className,
  hapticFeedback = true,
  glowEffect = false,
  magneticEffect = false,
  onClick,
  ...props
}: MotionButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // 磁性效果的 motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  // 3D 倾斜效果
  const rotateX = useTransform(springY, [-20, 20], [5, -5]);
  const rotateY = useTransform(springX, [-20, 20], [-5, 5]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // 只有在原生平台(Android/iOS)才触发震动，避免浏览器报错
    if (hapticFeedback && Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (err) {
        // 忽略震动错误
      }
    }
    onClick?.(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magneticEffect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="relative inline-block"
      style={magneticEffect ? { x: springX, y: springY } : undefined}
    >
      {/* 发光效果背景 */}
      {glowEffect && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-xl opacity-0"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
          }}
          animate={{
            opacity: isPressed ? 0.6 : 0,
            scale: isPressed ? 1.2 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* @ts-ignore - Framer Motion 类型兼容性处理 */}
      <MotionBtn
        whileHover={{
          scale: 1.02,
          boxShadow: glowEffect
            ? '0 10px 40px -10px rgba(34, 197, 94, 0.5)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
        whileTap={{ scale: 0.95 }}
        style={magneticEffect ? { rotateX, rotateY, transformPerspective: 600 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className={cn(
          "relative overflow-hidden active:scale-95 transition-all",
          glowEffect && "shadow-lg hover:shadow-xl",
          className
        )}
        {...props}
      >
        {/* 涟漪效果层 */}
        <motion.span
          className="absolute inset-0 bg-white/20"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={isPressed ? { scale: 2.5, opacity: 0 } : { scale: 0, opacity: 0.5 }}
          transition={{ duration: 0.5 }}
          style={{ borderRadius: '50%', transformOrigin: 'center' }}
        />

        {/* 光泽扫过效果 */}
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />

        <span className="relative z-10">{children}</span>
      </MotionBtn>
    </motion.div>
  );
}
