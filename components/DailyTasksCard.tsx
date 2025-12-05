'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Check, 
  Clock, 
  Moon, 
  Wind, 
  Dumbbell,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { TaskSessionModal } from './TaskSessionModal';

type IconName = 'clock' | 'moon' | 'wind' | 'dumbbell' | 'sparkles';
type TaskType = 'nsdr' | 'sleep' | 'breath' | 'stretch';

interface Task {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  iconName: IconName;
  category: 'rest' | 'sleep' | 'breath' | 'movement' | 'system';
  completed: boolean;
  description?: string;
}

interface DailyTasksCardProps {
  stressLevel?: number;
  energyLevel?: number;
  className?: string;
  onTaskComplete?: (taskId: string) => void;
  onTaskStart?: (task: Task) => void;
}

// 图标映射
const ICON_MAP: Record<IconName, React.ReactNode> = {
  clock: <Clock className="w-4 h-4" />,
  moon: <Moon className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  dumbbell: <Dumbbell className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />
};

// 能量动画组件（只保留呼吸脉动和能量球，无闪电图标）
function EnergyAnimation({ energyLevel = 5 }: { energyLevel?: number }) {
  const getEnergyColor = (level: number) => {
    if (level >= 7) return { primary: '#22c55e', secondary: '#10b981' };
    if (level >= 4) return { primary: '#eab308', secondary: '#f59e0b' };
    return { primary: '#ef4444', secondary: '#f97316' };
  };
  
  const colors = getEnergyColor(energyLevel);
  const animationDuration = 4 - (energyLevel / 10) * 1.5;
  
  return (
    <div className="relative w-16 h-16">
      {/* 核心能量球 */}
      <motion.div
        className="absolute inset-2 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: animationDuration, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// 默认任务列表
const DEFAULT_TASKS: Omit<Task, 'completed'>[] = [
  {
    id: 'nsdr',
    title: '午间 15 分钟 NSDR 休息',
    duration: '15 分钟',
    durationSeconds: 15 * 60,
    iconName: 'clock',
    category: 'rest',
    description: '非睡眠深度休息，快速恢复精力'
  },
  {
    id: 'sleep',
    title: '今晚提前 30 分钟入睡',
    duration: '30 分钟',
    durationSeconds: 5 * 60,
    iconName: 'moon',
    category: 'sleep',
    description: '优化睡眠周期，提升恢复质量'
  },
  {
    id: 'breath',
    title: '5 分钟盒式呼吸',
    duration: '5 分钟',
    durationSeconds: 5 * 60,
    iconName: 'wind',
    category: 'breath',
    description: '4-4-4-4 呼吸法，激活副交感神经'
  },
  {
    id: 'stretch',
    title: '轻度拉伸 10 分钟',
    duration: '10 分钟',
    durationSeconds: 10 * 60,
    iconName: 'dumbbell',
    category: 'movement',
    description: '释放肌肉紧张，促进血液循环'
  }
];




// 任务项组件
function TaskItem({ 
  task, 
  onComplete, 
  onStart 
}: { 
  task: Task; 
  onComplete: () => void;
  onStart: () => void;
}) {
  const categoryColors = {
    rest: 'bg-blue-50 text-blue-600 border-blue-100',
    sleep: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    breath: 'bg-teal-50 text-teal-600 border-teal-100',
    movement: 'bg-orange-50 text-orange-600 border-orange-100',
    system: 'bg-gray-50 text-gray-600 border-gray-100'
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        task.completed 
          ? 'bg-emerald-50/50 border-emerald-100' 
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      {/* 完成按钮 */}
      <button
        onClick={onComplete}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 hover:border-emerald-400'
        }`}
      >
        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>
      
      {/* 任务内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`p-1 rounded-md ${categoryColors[task.category]}`}>
            {ICON_MAP[task.iconName]}
          </span>
          <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {task.title}
          </span>
        </div>
        {task.description && !task.completed && (
          <p className="text-xs text-gray-500 mt-1 ml-8">{task.description}</p>
        )}
      </div>
      
      {/* 开始按钮 */}
      {!task.completed && (
        <button
          onClick={onStart}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </motion.div>
  );
}


export function DailyTasksCard({ 
  stressLevel = 5,
  energyLevel = 5, 
  className = '',
  onTaskComplete,
  onTaskStart
}: DailyTasksCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // 初始化任务列表
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedTasks = localStorage.getItem(`nma_daily_tasks_${today}`);
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // 使用默认任务
      const initialTasks = DEFAULT_TASKS.map(t => ({ ...t, completed: false }));
      setTasks(initialTasks);
      localStorage.setItem(`nma_daily_tasks_${today}`, JSON.stringify(initialTasks));
    }
  }, []);
  
  // 保存任务状态
  const saveTasks = (newTasks: Task[]) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`nma_daily_tasks_${today}`, JSON.stringify(newTasks));
    setTasks(newTasks);
  };
  
  // 完成任务
  const handleComplete = (taskId: string) => {
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    saveTasks(newTasks);
    onTaskComplete?.(taskId);
  };
  
  // 开始任务 - 打开交互弹窗
  const handleStart = (task: Task) => {
    setActiveTask(task);
    setShowModal(true);
    onTaskStart?.(task);
  };
  
  // 任务完成回调
  const handleSessionComplete = () => {
    if (activeTask) {
      handleComplete(activeTask.id);
    }
    setShowModal(false);
    setActiveTask(null);
  };
  
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const displayTasks = showAll ? tasks : tasks.slice(0, 3);
  
  return (
    <Card className={`shadow-sm bg-white overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            今日调节计划
          </CardTitle>
          <span className="text-xs text-gray-400">
            {completedCount}/{tasks.length} 已完成
          </span>
        </div>
        {/* 进度条 */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex gap-4 mb-4">
          {/* 能量动画 */}
          <EnergyAnimation energyLevel={energyLevel} />
          
          {/* 状态文字 */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-800">
              {completedCount === tasks.length 
                ? '🎉 今日计划已完成！' 
                : energyLevel >= 7 
                  ? '状态良好，保持节奏' 
                  : energyLevel >= 4 
                    ? '系统稳定，准备生成计划'
                    : '能量偏低，建议优先休息'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              根据你的生物数据智能推荐
            </p>
          </div>
        </div>
        
        {/* 任务列表 */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => handleComplete(task.id)}
                onStart={() => handleStart(task)}
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* 展开/收起按钮 */}
        {tasks.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAll ? '收起' : `查看全部 ${tasks.length} 个任务`}
          </button>
        )}
      </CardContent>
      
      {/* 任务执行弹窗 */}
      {activeTask && (
        <TaskSessionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setActiveTask(null);
          }}
          onComplete={handleSessionComplete}
          taskType={activeTask.id as TaskType}
          taskTitle={activeTask.title}
          duration={activeTask.durationSeconds}
        />
      )}
    </Card>
  );
}

export default DailyTasksCard;
