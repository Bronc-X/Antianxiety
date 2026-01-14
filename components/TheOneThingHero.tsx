'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStateAnalysis, RecommendedTask } from '@/types/logic';
import { Activity, Moon, Footprints, Dumbbell, Wind, Sun } from 'lucide-react';

interface TheOneThingHeroProps {
  userState: UserStateAnalysis;
  recommendedTask: RecommendedTask;
}

export default function TheOneThingHero({ recommendedTask }: TheOneThingHeroProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);

  // Icon映射
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Activity': <Activity className="w-12 h-12" />,
      'Moon': <Moon className="w-12 h-12" />,
      'Footprints': <Footprints className="w-12 h-12" />,
      'Dumbbell': <Dumbbell className="w-12 h-12" />,
      'Wind': <Wind className="w-12 h-12" />,
      'Sun': <Sun className="w-12 h-12" />,
    };
    return iconMap[iconName] || <Activity className="w-12 h-12" />;
  };

  const routineTasks = [
    { id: 1, name: '早晨补充水分 (500ml)', completed: false },
    { id: 2, name: '维生素D (2000 IU)', completed: false },
    { id: 3, name: 'Omega-3 (1000mg)', completed: false },
    { id: 4, name: '绿茶 (儿茶素)', completed: false },
  ];

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Card: Today's Core Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-[#0F392B]/10 bg-gradient-to-br from-[#FFFBF0] to-white p-8 sm:p-12 shadow-lg"
      >
        <div className="flex flex-col items-center text-center">
          {/* Label */}
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0F392B]/50 mb-4">
            今日核心任务
          </span>

          {/* Large Checkbox */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChecked(!isChecked)}
            className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center mb-6 transition-all duration-300 ${
              isChecked
                ? 'bg-[#0F392B] border-[#0F392B]'
                : 'bg-white border-[#0F392B]/30 hover:border-[#0F392B]'
            }`}
          >
            <AnimatePresence>
              {isChecked && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Task with Icon */}
          <div className="flex flex-col items-center gap-6 mb-4">
            <div className="text-[#0F392B]">
              {getIconComponent(recommendedTask.icon)}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F392B] leading-tight text-center">
              {recommendedTask.taskName}
            </h2>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0F392B]/5 border border-[#0F392B]/10 px-6 py-2">
              <span className="text-sm font-medium text-[#0F392B]/70">
                {recommendedTask.duration}
              </span>
            </div>
          </div>

          {/* The 'Why' Tag */}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#0F392B]/10 border border-[#0F392B]/20 px-6 py-4 mt-4 max-w-2xl">
            <svg className="w-5 h-5 text-[#0F392B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm text-[#1F2937] leading-relaxed">
              <span className="font-semibold text-[#0F392B]">Why:</span> {recommendedTask.reason}
            </p>
          </div>

          {/* Success Message */}
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-4"
            >
              <p className="text-sm text-emerald-800 font-medium">
                ✓ 完成！你已经完成了今天最重要的事情。
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Collapsible Routine Tasks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <button
          onClick={() => setShowRoutine(!showRoutine)}
          className="w-full rounded-2xl border border-[#0F392B]/10 bg-white/80 backdrop-blur px-6 py-4 hover:bg-white transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#0F392B]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium text-[#1F2937]">
              查看日常任务清单 (补充剂、水分等)
            </span>
          </div>
          <motion.svg
            animate={{ rotate: showRoutine ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-5 h-5 text-[#0F392B]/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {showRoutine && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-[#0F392B]/10 bg-white p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0F392B]/60 mb-4">
                  Daily Routine
                </h3>
                <div className="space-y-3">
                  {routineTasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#0F392B]/5 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-2 border-[#0F392B]/30 text-[#0F392B] focus:ring-[#0F392B]/20"
                      />
                      <span className="text-sm text-[#1F2937]">{task.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
