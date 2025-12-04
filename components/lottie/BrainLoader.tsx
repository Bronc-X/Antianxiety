'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLottie } from '@/hooks/useLottie';

interface BrainLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showDetails?: boolean;
}

export function BrainLoader({ size = 'md', text, showDetails = false }: BrainLoaderProps) {
  const { animationData, lottieRef, isLoading } = useLottie('/lottie/brain.json');

  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-[10px]' },
    md: { container: 'w-24 h-24', text: 'text-xs' },
    lg: { container: 'w-32 h-32', text: 'text-sm' },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-3">
      <div className={`${config.container} relative`}>
        {/* 外层脉冲环 */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            }}
            animate={{
              scale: [1, 1.5 + i * 0.2],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Lottie 动画或备用动画 */}
        {!isLoading && animationData ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={true}
            className="w-full h-full relative z-10"
          />
        ) : (
          <motion.div
            className="w-full h-full rounded-full"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #0B3D2E 100%)',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
            }}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 20px rgba(34, 197, 94, 0.3)',
                '0 0 40px rgba(34, 197, 94, 0.6)',
                '0 0 20px rgba(34, 197, 94, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* 装饰性光晕 */}
        <motion.div
          className="absolute inset-0 rounded-full -z-10"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 文字 */}
      <motion.p
        className={`${config.text} text-[#0B3D2E]/70 font-mono text-center`}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {text || 'Neuromind analyzing...'}
        {showDetails && (
          <>
            <br />
            <span className="text-[10px] opacity-70">Verifying scientific consensus</span>
          </>
        )}
      </motion.p>
    </div>
  );
}

export default BrainLoader;
