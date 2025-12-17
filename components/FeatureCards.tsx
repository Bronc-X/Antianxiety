'use client';

import { ArrowRight, Activity, RotateCw, Brain, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';

/**
 * Symptom Assessment Card
 * Mango-style card with vibrant imagery and clean bottom section
 */
export const SymptomAssessmentCard = () => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Full Background Gradient - Clay/Sand tones for calm */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#D4C4A8] to-[#A89070]">
        {/* Organic Circles/Blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#E8DFD0] rounded-full blur-2xl opacity-60" />
        <div className="absolute top-20 -left-10 w-40 h-40 bg-[#C4A77D]/50 rounded-full blur-xl opacity-50" />
        
        {/* Central 3D-ish Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
              <Activity className="w-10 h-10 text-[#8B7355] -rotate-45" strokeWidth={2.5} />
            </div>
          </div>
          {/* Floating particle */}
          <div className="absolute top-4 right-10 w-4 h-4 bg-white/25 rounded-full animate-pulse" />
        </div>
        
        {/* Badge */}
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/15 backdrop-blur-md rounded-full">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isZh ? 'AI 驅動' : 'AI Powered'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 bg-gradient-to-t from-[#6B5344] via-[#6B5344]/90 to-transparent pt-20 text-white">
        <div className="mb-4">
          <h3 className="text-3xl font-bold leading-none mb-2">
            {isZh ? (
              <>症狀<br/>評估</>
            ) : (
              <>Symptom<br/>Check</>
            )}
          </h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {isZh 
              ? '使用先進貝葉斯推理模型進行快速生理評估。'
              : 'Rapid physiological assessment using advanced Bayesian inference models.'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '快速' : 'Fast'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold">{isZh ? '安全' : 'Secure'}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-[10px] font-bold text-[#D4AF37]">Pro {isZh ? '免費' : 'Free'}</span>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Action Button */}
      <button className="absolute bottom-5 left-5 right-5 py-3 bg-white text-[#6B5344] rounded-2xl font-bold text-sm shadow-xl hover:bg-[#FAF6EF] transition-colors flex items-center justify-center gap-2 z-20">
        {isZh ? '開始評估' : 'Start Check'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};


/**
 * Bayesian Cycle Card
 * Teal gradient card with cycle visualization
 */
export const BayesianCycleCard = () => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div className="relative w-full h-full bg-[#E6F4F1] rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Full Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4DB6AC] to-[#00695C]">
        {/* Dynamic Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 C 50 100 80 100 100 0 Z" fill="white" />
          </svg>
        </div>
        
        {/* The Cycle Visual */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-60 h-60">
          {/* Center Brain */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-45">
              <Brain className="w-10 h-10 text-teal-700 -rotate-45" />
            </div>
          </div>
          
          {/* Orbiting Elements - 轨道旋转 */}
          <motion.div 
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {/* Node 1: Prior - top */}
            <motion.div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-teal-800">{isZh ? '先驗' : 'PRIOR'}</span>
            </motion.div>
            {/* Node 2: Evidence - bottom right */}
            <motion.div 
              className="absolute bottom-6 right-0 px-4 py-2 bg-white/95 backdrop-blur shadow-lg rounded-xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-teal-800">{isZh ? '證據' : 'EVIDENCE'}</span>
            </motion.div>
            {/* Node 3: Posterior - bottom left */}
            <motion.div 
              className="absolute bottom-6 left-0 px-4 py-2 bg-teal-900 shadow-lg rounded-xl border border-white/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-sm font-bold text-white">{isZh ? '後驗' : 'POSTERIOR'}</span>
            </motion.div>
            {/* Connecting Ring */}
            <div className="absolute inset-6 border-2 border-dashed border-white/30 rounded-full" />
          </motion.div>
        </div>
        
        {/* Tags Top Right */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <span className="px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white">
            {isZh ? '邏輯' : 'Logic'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 bg-gradient-to-t from-teal-900 via-teal-900/80 to-transparent pt-20 text-white">
        <div className="mb-4">
          <h3 className="text-3xl font-bold leading-none mb-2">
            {isZh ? (
              <>貝葉斯<br/>循環</>
            ) : (
              <>Bayesian<br/>Cycle</>
            )}
          </h3>
          <p className="text-white/80 text-xs font-medium max-w-[200px]">
            {isZh 
              ? '基於累積證據的迭代信念更新。'
              : 'Iterative belief updating based on accumulating evidence.'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <RotateCw className="w-3 h-3 text-teal-200" />
            <span className="text-[10px] font-bold">
              {isZh ? '持續' : 'Continuous'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-3 h-3 text-teal-200" />
            <span className="text-[10px] font-bold">
              {isZh ? '優化' : 'Optimized'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Fixed Bottom Action Button */}
      <button className="absolute bottom-5 left-5 right-5 py-3 bg-white text-teal-900 rounded-2xl font-bold text-sm shadow-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 z-20">
        {isZh ? '開始循環' : 'Start Loop'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default { SymptomAssessmentCard, BayesianCycleCard };
