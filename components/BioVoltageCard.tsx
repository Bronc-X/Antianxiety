'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBioVoltageRecommendation, getTechniqueDetails } from '@/lib/bio-voltage';
import { Zap } from 'lucide-react';

interface BioVoltageCardProps {
  stressLevel: number;
  energyLevel?: number;
  className?: string;
  onStartPractice?: () => void;
}

// Bio-Voltage 高级呼吸动画组件
function BioVoltageAnimation({ energyLevel = 5 }: { energyLevel?: number }) {
  // 根据能量等级调整动画速度和颜色
  const animationDuration = 4 - (energyLevel / 10) * 1.5; // 能量越高，呼吸越快
  const glowIntensity = 0.3 + (energyLevel / 10) * 0.4;
  
  // 能量颜色映射
  const getEnergyColor = (level: number) => {
    if (level >= 7) return { primary: '#22c55e', secondary: '#10b981' }; // 绿色 - 高能量
    if (level >= 4) return { primary: '#eab308', secondary: '#f59e0b' }; // 黄色 - 中等
    return { primary: '#ef4444', secondary: '#f97316' }; // 红色 - 低能量
  };
  
  const colors = getEnergyColor(energyLevel);
  
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* 最外层 - 能量场波纹 */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${colors.primary}`,
            opacity: 0,
          }}
          animate={{
            scale: [1, 2.5],
            opacity: [glowIntensity, 0],
          }}
          transition={{
            duration: animationDuration * 1.5,
            repeat: Infinity,
            delay: i * (animationDuration / 3),
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* 外圈 - 旋转光环 */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${colors.primary}40, transparent, ${colors.secondary}40, transparent)`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: animationDuration * 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* 中圈 - 呼吸脉动 */}
      <motion.div
        className="absolute inset-3 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.primary}30 0%, ${colors.secondary}10 50%, transparent 70%)`,
          boxShadow: `0 0 30px ${colors.primary}40`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* 内圈 - 核心能量球 */}
      <motion.div
        className="absolute inset-5 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: `0 0 20px ${colors.primary}60, inset 0 0 15px rgba(255,255,255,0.3)`,
        }}
        animate={{
          scale: [1, 1.08, 1],
          boxShadow: [
            `0 0 20px ${colors.primary}60, inset 0 0 15px rgba(255,255,255,0.3)`,
            `0 0 35px ${colors.primary}80, inset 0 0 20px rgba(255,255,255,0.5)`,
            `0 0 20px ${colors.primary}60, inset 0 0 15px rgba(255,255,255,0.3)`,
          ],
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* 能量粒子 */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: colors.primary,
            left: '50%',
            top: '50%',
            boxShadow: `0 0 6px ${colors.primary}`,
          }}
          animate={{
            x: [0, Math.cos((i * 60 * Math.PI) / 180) * 35, 0],
            y: [0, Math.sin((i * 60 * Math.PI) / 180) * 35, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: animationDuration * 1.2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* 中心图标 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: animationDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Zap className="w-6 h-6 text-white drop-shadow-lg" />
        </motion.div>
      </div>
      
      {/* 能量数值显示 */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold"
        style={{ color: colors.primary }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {energyLevel}/10
      </motion.div>
    </div>
  );
}

export function BioVoltageCard({ 
  stressLevel, 
  energyLevel = 5, 
  className = '',
  onStartPractice 
}: BioVoltageCardProps) {
  const recommendation = getBioVoltageRecommendation(stressLevel, energyLevel);
  const details = getTechniqueDetails(recommendation.technique);
  
  return (
    <Card className={`shadow-sm bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          生物电压调节
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* 动画 */}
          <BioVoltageAnimation energyLevel={energyLevel} />
          
          {/* 推荐内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{recommendation.icon}</span>
              <h3 className="font-semibold text-gray-800">
                {recommendation.titleZh}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {recommendation.descriptionZh}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                {recommendation.duration_minutes} 分钟
              </span>
            </div>
          </div>
        </div>
        
        {/* 步骤提示 */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-3 border-t border-gray-100"
        >
          <p className="text-xs text-gray-500 mb-2">快速指南：</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {details.stepsZh.slice(0, 2).map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {step}
              </li>
            ))}
          </ul>
        </motion.div>
        
        {/* 开始按钮 */}
        {onStartPractice && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartPractice}
            className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            开始练习
          </motion.button>
        )}
      </CardContent>
    </Card>
  );
}

export default BioVoltageCard;
