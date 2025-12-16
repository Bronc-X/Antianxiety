'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Check, Moon, Wind, Clock, Dumbbell } from 'lucide-react';
import { MotionButton } from '@/components/motion/MotionButton';

type TaskType = 'nsdr' | 'sleep' | 'breath' | 'stretch';

interface TaskSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  taskType: TaskType;
  taskTitle: string;
  duration: number; // 秒
}

// 呼吸动画组件 - 4-4-4-4 盒式呼吸
function BreathingAnimation({ phase, count }: { phase: 'inhale' | 'hold1' | 'exhale' | 'hold2'; count: number }) {
  const phaseText = {
    inhale: '吸气',
    hold1: '屏息',
    exhale: '呼气',
    hold2: '屏息'
  };
  
  const phaseColors = {
    inhale: 'from-teal-400 to-cyan-500',
    hold1: 'from-blue-400 to-indigo-500',
    exhale: 'from-purple-400 to-pink-500',
    hold2: 'from-indigo-400 to-blue-500'
  };
  
  const scale = phase === 'inhale' ? 1.5 : phase === 'exhale' ? 0.9 : (phase === 'hold1' ? 1.5 : 0.9);
  
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-teal-50 flex flex-col items-center justify-center">
      {/* 背景波纹 */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-teal-200"
          style={{ width: 200 + i * 60, height: 200 + i * 60 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
      
      {/* 主呼吸球 */}
      <motion.div
        className={`w-36 h-36 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center relative z-10`}
        animate={{ 
          scale,
          boxShadow: phase === 'inhale' || phase === 'hold1' 
            ? '0 0 80px rgba(20, 184, 166, 0.6)' 
            : '0 0 40px rgba(20, 184, 166, 0.3)'
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {/* 倒计时数字 */}
        <motion.span
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold text-white"
        >
          {count}
        </motion.span>
      </motion.div>
      
      {/* 阶段文字 */}
      <motion.div 
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center"
      >
        <p className="text-2xl font-semibold text-teal-600">{phaseText[phase]}</p>
        <p className="text-sm text-teal-500 mt-1">4-4-4-4 盒式呼吸</p>
      </motion.div>
    </div>
  );
}

// 睡眠准备动画 - 昏暗温馨
function SleepAnimation({ progress }: { progress: number }) {
  const tips = [
    { icon: '🌙', text: '调暗房间灯光' },
    { icon: '📱', text: '放下手机，远离屏幕' },
    { icon: '🛏️', text: '躺下，放松身体' },
    { icon: '🧘', text: '深呼吸，清空思绪' },
    { icon: '😴', text: '闭上眼睛，准备入睡' }
  ];
  const currentTip = Math.floor((progress / 100) * tips.length) % tips.length;
  
  // 使用固定的星星位置
  const stars = React.useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      left: (i * 37 + 13) % 100,
      top: (i * 23 + 7) % 60,
      delay: (i * 0.3) % 3,
      duration: 2 + (i % 3),
      size: i % 3 === 0 ? 2 : 1
    })), []
  );
  
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900">
      {/* 星星 */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
      
      {/* 流星 */}
      <motion.div
        className="absolute w-20 h-0.5 bg-gradient-to-r from-white to-transparent"
        style={{ top: '20%', left: '60%', rotate: 45 }}
        animate={{
          x: [-100, 200],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 5,
        }}
      />
      
      {/* 月亮 */}
      <motion.div
        className="absolute top-6 right-6 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200"
        animate={{
          boxShadow: ['0 0 40px rgba(253, 224, 71, 0.4)', '0 0 70px rgba(253, 224, 71, 0.6)', '0 0 40px rgba(253, 224, 71, 0.4)'],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Moon className="w-10 h-10 text-amber-500 absolute top-5 left-5" />
        {/* 月亮光晕 */}
        <motion.div
          className="absolute -inset-4 rounded-full bg-yellow-200/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
      
      {/* 提示文字 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <motion.div
          key={currentTip}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <span className="text-3xl">{tips[currentTip].icon}</span>
        </motion.div>
        <motion.p 
          key={`text-${currentTip}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/90 text-lg font-medium"
        >
          {tips[currentTip].text}
        </motion.p>
        <p className="text-white/50 text-xs mt-2">睡眠准备中...</p>
      </div>
    </div>
  );
}


// NSDR 休息动画 - 波浪放松
function NSDRAnimation({ progress }: { progress: number }) {
  const tips = [
    '找一个舒适的姿势躺下',
    '闭上眼睛，放松面部肌肉',
    '感受身体与地面的接触',
    '让思绪自然流动，不做评判',
    '保持清醒，享受深度放松'
  ];
  const currentTip = Math.floor((progress / 100) * tips.length) % tips.length;
  
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100 via-blue-100 to-indigo-100">
      {/* 多层波浪 */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0"
          style={{
            bottom: -20 + i * 5,
            height: 80,
            background: `linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, ${0.08 + i * 0.06}) 100%)`,
            borderRadius: '50% 50% 0 0',
          }}
          animate={{
            y: [0, -15, 0],
            scaleX: [1, 1.02, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* 漂浮的圆点 */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-blue-300/40"
          style={{
            left: `${10 + i * 12}%`,
            top: '40%',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
          }}
        />
      ))}
      
      {/* 中心图标 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-28 h-28 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: ['0 10px 40px rgba(59, 130, 246, 0.2)', '0 10px 60px rgba(59, 130, 246, 0.4)', '0 10px 40px rgba(59, 130, 246, 0.2)'],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="w-12 h-12 text-blue-500" />
          </motion.div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-5 left-0 right-0 text-center px-4">
        <motion.p 
          key={currentTip}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-blue-700 text-sm font-medium"
        >
          {tips[currentTip]}
        </motion.p>
        <p className="text-blue-400 text-xs mt-1">NSDR · 非睡眠深度休息</p>
      </div>
    </div>
  );
}

// 拉伸动画
function StretchAnimation({ progress }: { progress: number }) {
  const poses = [
    { name: '颈部放松', icon: '🧘', tip: '缓慢转动头部，左右各5次' },
    { name: '肩部环绕', icon: '💪', tip: '向前向后各转动10次' },
    { name: '手臂伸展', icon: '🙆', tip: '双臂向上伸展，保持15秒' },
    { name: '腰部扭转', icon: '🔄', tip: '坐姿扭转，左右各保持10秒' },
    { name: '腿部拉伸', icon: '🦵', tip: '前屈触脚，保持20秒' }
  ];
  const currentPose = Math.floor((progress / 100) * poses.length) % poses.length;
  
  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* 背景装饰 */}
      <motion.div
        className="absolute top-4 left-4 w-20 h-20 rounded-full bg-orange-200/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-4 w-16 h-16 rounded-full bg-amber-200/30"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      {/* 动态圆环 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-36 h-36 rounded-full border-4 border-orange-200"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-28 h-28 rounded-full border-4 border-amber-300"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-20 h-20 rounded-full border-4 border-orange-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        
        {/* 中心图标 */}
        <motion.div 
          className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span
            key={currentPose}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-2xl"
          >
            {poses[currentPose].icon}
          </motion.span>
        </motion.div>
      </div>
      
      {/* 进度指示器 */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-2">
        {poses.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i <= currentPose ? 'bg-orange-500' : 'bg-orange-200'
            }`}
          />
        ))}
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center px-4">
        <motion.p 
          key={currentPose}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-orange-700 text-lg font-semibold"
        >
          {poses[currentPose].name}
        </motion.p>
        <motion.p 
          key={`tip-${currentPose}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-orange-500 text-sm mt-1"
        >
          {poses[currentPose].tip}
        </motion.p>
      </div>
    </div>
  );
}


export function TaskSessionModal({
  isOpen,
  onClose,
  onComplete,
  taskType,
  taskTitle,
  duration: propDuration
}: TaskSessionModalProps) {
  // 确保 duration 有效，默认 5 分钟
  const duration = propDuration && !isNaN(propDuration) && propDuration > 0 ? propDuration : 300;
  
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathCount, setBreathCount] = useState(4); // 呼吸倒计时
  const [isCompleted, setIsCompleted] = useState(false);
  
  // 当 duration 变化时重置
  useEffect(() => {
    setTimeLeft(duration);
    setIsCompleted(false);
    setIsRunning(false);
  }, [duration, isOpen]);
  
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  
  // 倒计时
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);
  
  // 呼吸节奏 (4-4-4-4) 带倒计时
  useEffect(() => {
    if (!isRunning || taskType !== 'breath') return;
    
    const phases: ('inhale' | 'hold1' | 'exhale' | 'hold2')[] = ['inhale', 'hold1', 'exhale', 'hold2'];
    let phaseIndex = 0;
    let countDown = 4;
    
    // 每秒更新倒计时
    const countTimer = setInterval(() => {
      countDown--;
      if (countDown <= 0) {
        countDown = 4;
        phaseIndex = (phaseIndex + 1) % 4;
        setBreathPhase(phases[phaseIndex]);
      }
      setBreathCount(countDown === 0 ? 4 : countDown);
    }, 1000);
    
    return () => clearInterval(countTimer);
  }, [isRunning, taskType]);
  
  // 重置
  const handleReset = () => {
    setTimeLeft(duration);
    setIsRunning(false);
    setIsCompleted(false);
    setBreathPhase('inhale');
  };
  
  // 完成
  const handleComplete = () => {
    onComplete();
    onClose();
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 渲染对应动画
  const renderAnimation = () => {
    switch (taskType) {
      case 'breath':
        return <BreathingAnimation phase={breathPhase} count={breathCount} />;
      case 'sleep':
        return <SleepAnimation progress={progress} />;
      case 'nsdr':
        return <NSDRAnimation progress={progress} />;
      case 'stretch':
        return <StretchAnimation progress={progress} />;
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">{taskTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* 动画区域 */}
          <div className="p-6">
            {renderAnimation()}
          </div>
          
          {/* 进度和时间 */}
          <div className="px-6 pb-4">
            {/* 进度条 */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            
            {/* 时间显示 */}
            <div className="text-center">
              <span className="text-4xl font-bold text-gray-800 font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          
          {/* 控制按钮 */}
          <div className="p-6 pt-2 flex gap-3">
            {isCompleted ? (
              <MotionButton
                onClick={handleComplete}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium"
                hapticFeedback
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  完成任务
                </span>
              </MotionButton>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
                
                <MotionButton
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-4 rounded-xl font-medium ${
                    isRunning 
                      ? 'bg-gray-200 text-gray-700' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  }`}
                  hapticFeedback
                >
                  <span className="flex items-center justify-center gap-2">
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        开始
                      </>
                    )}
                  </span>
                </MotionButton>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TaskSessionModal;
