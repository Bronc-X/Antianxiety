'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Sparkles, Brain, Activity } from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase-client';

// 健康贴士数据结构
interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: 'sleep' | 'exercise' | 'nutrition' | 'stress' | 'longevity' | 'energy';
  icon: '🧠' | '💪' | '🥗' | '🧘' | '⏰' | '⚡' | '🌱' | '❤️';
  targetCondition?: string; // 针对特定用户状况
  urgencyLevel: 'low' | 'medium' | 'high';
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
}

interface UserProfile {
  age?: number;
  height?: number;
  weight?: number;
  gender?: string;
  current_mode?: string;
}

interface DailyLog {
  sleep_duration_minutes?: number;
  sleep_quality?: string;
  exercise_duration_minutes?: number;
  mood_status?: string;
  stress_level?: number;
}

interface DynamicHealthTipsProps {
  userProfile?: UserProfile;
  recentLogs?: DailyLog[];
  className?: string;
}

// 基础健康贴士库 - 按类别分组
const healthTipsDatabase: HealthTip[] = [
  // 睡眠类 🧠
  {
    id: 'sleep_1',
    title: '7天深度睡眠重建计划',
    content: '睡前2小时调暗所有光源至20%，配合镁离子补充，可将深度睡眠比例提升25%。',
    category: 'sleep',
    icon: '🧠',
    urgencyLevel: 'high',
    targetCondition: 'poor_sleep'
  },
  {
    id: 'sleep_2', 
    title: '皮质醇节律重置法',
    content: '早晨6-8点接触10分钟自然光照，晚10点后严格避免蓝光，21天重建完整昼夜节律。',
    category: 'sleep',
    icon: '⏰',
    urgencyLevel: 'medium'
  },
  {
    id: 'sleep_3',
    title: '温度调节睡眠法',
    content: '卧室温度控制在16-19°C，睡前1小时热水浴提升体表温度，利用温差触发睡意机制。',
    category: 'sleep', 
    icon: '🧠',
    urgencyLevel: 'low'
  },

  // 运动类 💪
  {
    id: 'exercise_1',
    title: 'Zone 2有氧基础重建',
    content: '维持心率在180-年龄的60-70%，每次45分钟，提升线粒体数量和脂肪燃烧效率。',
    category: 'exercise',
    icon: '💪',
    urgencyLevel: 'high',
    targetCondition: 'low_exercise'
  },
  {
    id: 'exercise_2',
    title: '压力释放微运动',
    content: '压力指数>7时，进行5分钟深呼吸+轻度拉伸，激活副交感神经系统。',
    category: 'exercise',
    icon: '🧘',
    urgencyLevel: 'high',
    targetCondition: 'high_stress'
  },
  {
    id: 'exercise_3',
    title: '办公室代谢激活',
    content: '每45分钟站立2分钟+5次深蹲，维持基础代谢率，防止久坐性炎症。',
    category: 'exercise',
    icon: '⚡',
    urgencyLevel: 'medium'
  },

  // 营养类 🥗  
  {
    id: 'nutrition_1',
    title: '间歇性禁食优化方案',
    content: '16:8时间窗口，进食时间延迟至10:00，激活自噬机制清除衰老细胞。',
    category: 'nutrition',
    icon: '🥗',
    urgencyLevel: 'medium'
  },
  {
    id: 'nutrition_2',
    title: '逆龄食材排列组合',
    content: '白藜芦醇+槲皮素+姜黄素，三重抗衰配方，最佳服用时间为空腹期。',
    category: 'nutrition', 
    icon: '🌱',
    urgencyLevel: 'low'
  },
  {
    id: 'nutrition_3',
    title: '蛋白质时间窗口',
    content: '运动后30分钟内摄入20-30g优质蛋白，最大化肌肉蛋白合成效率。',
    category: 'nutrition',
    icon: '💪',
    urgencyLevel: 'medium',
    targetCondition: 'post_workout'
  },

  // 压力管理类 🧘
  {
    id: 'stress_1',
    title: '4-7-8呼吸调节法',
    content: '吸气4秒-屏气7秒-呼气8秒，重复4次，快速激活迷走神经降低皮质醇。',
    category: 'stress',
    icon: '🧘',
    urgencyLevel: 'high', 
    targetCondition: 'high_stress'
  },
  {
    id: 'stress_2',
    title: '冷暴露压力训练',
    content: '18°C冷水浸泡2-3分钟，提升抗压能力和去甲肾上腺素水平。',
    category: 'stress',
    icon: '❤️',
    urgencyLevel: 'low'
  },
  {
    id: 'stress_3',
    title: '认知负荷管理',
    content: '番茄工作法25分钟专注+5分钟冥想，减少决策疲劳和皮质醇波动。',
    category: 'stress',
    icon: '🧠',
    urgencyLevel: 'medium'
  },

  // 长寿类 ⏰
  {
    id: 'longevity_1',
    title: '端粒保护生活方式',
    content: '7小时优质睡眠+地中海饮食+适度运动，减缓端粒缩短速度15-20%。',
    category: 'longevity',
    icon: '🌱',
    urgencyLevel: 'low'
  },
  {
    id: 'longevity_2',
    title: 'NAD+水平提升方案',
    content: '间歇禁食+NAD+前体补充+规律运动，维持细胞能量代谢年轻化。',
    category: 'longevity', 
    icon: '⚡',
    urgencyLevel: 'medium'
  }
];

// AI匹配算法：根据用户状态推荐贴士
const getPersonalizedTips = (profile?: UserProfile, recentLogs?: DailyLog[]): HealthTip[] => {
  const tips = [...healthTipsDatabase];
  const personalizedTips: (HealthTip & { score: number })[] = [];

  tips.forEach((tip, index) => {
    // 使用固定的基础分数，避免随机数导致的hydration问题
    let score = (index * 0.1) % 0.3 + 0.1; // 基础固定分 0.1-0.4

    // 基于最近日志数据的匹配
    if (recentLogs && recentLogs.length > 0) {
      const latestLog = recentLogs[0];

      // 睡眠质量匹配
      if (tip.targetCondition === 'poor_sleep' && 
          (latestLog.sleep_quality === 'poor' || latestLog.sleep_quality === 'very_poor')) {
        score += 0.4;
      }

      // 运动不足匹配
      if (tip.targetCondition === 'low_exercise' && 
          (latestLog.exercise_duration_minutes || 0) < 20) {
        score += 0.3;
      }

      // 高压力匹配
      if (tip.targetCondition === 'high_stress' && 
          (latestLog.stress_level || 0) >= 7) {
        score += 0.5;
      }

      // 类别相关性匹配
      if (tip.category === 'sleep' && latestLog.sleep_duration_minutes && latestLog.sleep_duration_minutes < 420) {
        score += 0.2;
      }
      if (tip.category === 'exercise' && (latestLog.exercise_duration_minutes || 0) === 0) {
        score += 0.2;
      }
      if (tip.category === 'stress' && (latestLog.stress_level || 0) > 5) {
        score += 0.2;
      }
    }

    // 用户档案匹配
    if (profile) {
      // 年龄相关匹配
      if (profile.age && profile.age >= 30 && tip.category === 'longevity') {
        score += 0.3;
      }
      if (profile.age && profile.age >= 40 && tip.category === 'longevity') {
        score += 0.4;
      }

      // 性别相关匹配（示例逻辑）
      if (profile.gender === 'female' && tip.category === 'nutrition') {
        score += 0.1;
      }
    }

    // 紧急度加权
    if (tip.urgencyLevel === 'high') score += 0.3;
    if (tip.urgencyLevel === 'medium') score += 0.1;

    personalizedTips.push({ ...tip, score });
  });

  // 排序并返回前8个
  return personalizedTips
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score, ...tip }) => tip);
};

// 获取类别图标
const getCategoryIcon = (category: HealthTip['category']) => {
  const icons = {
    sleep: Brain,
    exercise: Activity, 
    nutrition: Sparkles,
    stress: Lightbulb,
    longevity: Lightbulb,
    energy: Activity
  };
  return icons[category];
};

export default function DynamicHealthTips({ 
  userProfile, 
  recentLogs = [], 
  className = '' 
}: DynamicHealthTipsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 获取个性化贴士
  const personalizedTips = useMemo(() => {
    return getPersonalizedTips(userProfile, recentLogs);
  }, [userProfile, recentLogs]);

  // 确保客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 每日轮换逻辑 - 只在客户端执行
  useEffect(() => {
    if (!isClient || personalizedTips.length === 0) return;
    
    const today = new Date().getDate();
    const dailyStartIndex = (today * 3) % personalizedTips.length;
    setCurrentIndex(dailyStartIndex);
  }, [isClient, personalizedTips.length]);

  // 自动轮播 - 只在客户端执行
  useEffect(() => {
    if (!isClient || personalizedTips.length === 0) return;
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % personalizedTips.length);
        setIsTransitioning(false);
      }, 200);
    }, 8000); // 8秒轮播

    return () => clearInterval(timer);
  }, [isClient, personalizedTips.length]);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => 
        prev === 0 ? personalizedTips.length - 1 : prev - 1
      );
      setIsTransitioning(false);
    }, 200);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % personalizedTips.length);
      setIsTransitioning(false);
    }, 200);
  };

  // 服务端渲染时显示加载状态
  if (!isClient || personalizedTips.length === 0) {
    return (
      <div className={`glass-card rounded-3xl p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-2 text-[#0B3D2E]/60 text-sm">
          <Lightbulb className="w-4 h-4" />
          <span>健康小贴士</span>
        </div>
        <p className="text-lg font-medium text-[#0B3D2E]">
          正在为您准备个性化健康建议...
        </p>
      </div>
    );
  }

  const currentTip = personalizedTips[currentIndex];
  const IconComponent = getCategoryIcon(currentTip.category);

  return (
    <div className={`glass-card rounded-3xl p-6 relative overflow-hidden ${className}`}>
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 text-6xl opacity-10 transform rotate-12 translate-x-4 -translate-y-2">
        {currentTip.icon}
      </div>

      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#0B3D2E]/60 text-sm">
          <IconComponent className="w-4 h-4" />
          <span>健康贴士</span>
          <span className="text-xs bg-[#0B3D2E]/10 px-2 py-0.5 rounded-full">
            {currentIndex + 1}/{personalizedTips.length}
          </span>
        </div>
        
        {/* 导航按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="p-1.5 rounded-full hover:bg-[#0B3D2E]/10 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 text-[#0B3D2E]/60" />
          </button>
          <button
            onClick={handleNext}
            disabled={isTransitioning}
            className="p-1.5 rounded-full hover:bg-[#0B3D2E]/10 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4 text-[#0B3D2E]/60" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={`transition-all duration-200 ${isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
        <h3 className="text-lg font-semibold text-[#0B3D2E] mb-3 flex items-center gap-2">
          <span className="text-xl">{currentTip.icon}</span>
          {currentTip.title}
        </h3>
        <p className="text-sm text-[#0B3D2E]/80 leading-relaxed">
          {currentTip.content}
        </p>

        {/* 紧急度指示器 */}
        {currentTip.urgencyLevel === 'high' && (
          <div className="mt-3 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>优先建议</span>
          </div>
        )}
      </div>

      {/* 进度指示器 */}
      <div className="flex gap-1 mt-4">
        {personalizedTips.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-[#0B3D2E] flex-1' 
                : 'bg-[#0B3D2E]/20 w-1'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
