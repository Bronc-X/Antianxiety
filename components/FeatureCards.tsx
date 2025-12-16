'use client';

import React from 'react';
import { ArrowRight, Activity, RotateCw, Brain, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Symptom Assessment Card
 * Mango-style card with vibrant imagery and clean bottom section
 */
export const SymptomAssessmentCard = () => {
  const { language } = useI18n();
  const isZh = language !== 'en';

  return (
    <div className="relative w-[432px] min-w-[360px] h-[546px] bg-white rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
      {/* Top Image Section (55%) */}
      <div className="absolute top-0 left-0 w-full h-[55%] bg-[#FFB74D] overflow-hidden">
        {/* Abstract "Symptom" Art */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-orange-500">
          {/* Organic Circles/Blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-pulse" />
          <div className="absolute top-20 -left-10 w-40 h-40 bg-orange-200 rounded-full blur-xl opacity-50" />
          
          {/* Central 3D-ish Element */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-32 bg-white/20 backdrop-blur-md rounded-full border border-white/40 flex items-center justify-center shadow-lg">
              <Activity className="w-16 h-16 text-white drop-shadow-md" strokeWidth={2.5} />
              {/* Floating particles */}
              <div className="absolute -top-4 -right-2 w-8 h-8 bg-white/30 rounded-full backdrop-blur-sm animate-bounce delay-100" />
              <div className="absolute bottom-2 -left-4 w-6 h-6 bg-white/30 rounded-full backdrop-blur-sm animate-bounce delay-300" />
            </div>
          </div>
        </div>
        
        {/* Badge */}
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isZh ? 'AI 驅動' : 'AI Powered'}
          </span>
        </div>
      </div>

      {/* Bottom Content Section (45%) */}
      <div className="absolute bottom-0 left-0 w-full h-[45%] bg-white p-5 flex flex-col justify-between z-10">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">
              {isZh ? (
                <>症狀<br/>評估</>
              ) : (
                <>Symptom<br/>Check</>
              )}
            </h3>
            <span className="flex items-center justify-center w-10 h-10 bg-black text-white rounded-full font-bold text-sm">
              A+
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2 line-clamp-2">
            {isZh 
              ? '使用先進貝葉斯推理模型進行快速生理評估。'
              : 'Rapid physiological assessment using advanced Bayesian inference models.'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          {/* Tags */}
          <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
            {isZh ? '快速' : 'Fast'}
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
            {isZh ? '安全' : 'Secure'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] text-gray-400 line-through">{isZh ? '¥199' : '$29'}</span>
            <span className="px-2 py-0.5 bg-[#D4AF37]/10 rounded text-[10px] font-bold text-[#D4AF37]">
              Pro {isZh ? '免費' : 'Free'}
            </span>
          </div>
        </div>
        
        {/* Full Width Action Button */}
        <button className="mt-3 w-full py-3 bg-[#2A2A2A] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
          {isZh ? '開始評估' : 'Start Check'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
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
    <div className="relative w-[432px] min-w-[360px] h-[546px] bg-[#E6F4F1] rounded-[32px] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] font-sans group hover:scale-[1.02] transition-transform duration-300 ease-out">
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
          
          {/* Orbiting Elements */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
            {/* Node 1: Prior */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold text-teal-800">
              {isZh ? '先驗' : 'PRIOR'}
            </div>
            {/* Node 2: Evidence */}
            <div className="absolute bottom-4 right-2 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold text-teal-800">
              {isZh ? '證據' : 'EVIDENCE'}
            </div>
            {/* Node 3: Posterior */}
            <div className="absolute bottom-4 left-2 px-3 py-1 bg-teal-900 shadow-sm rounded-full text-[10px] font-bold text-white border border-white/20">
              {isZh ? '後驗' : 'POSTERIOR'}
            </div>
            {/* Connecting Ring */}
            <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-full" />
          </div>
        </div>
        
        {/* Tags Top Right */}
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <span className="px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white">
            {isZh ? '邏輯' : 'Logic'}
          </span>
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-teal-900 via-teal-900/80 to-transparent pt-20 text-white">
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
        
        {/* Large Action Button */}
        <button className="mt-6 w-full py-4 bg-white text-teal-900 rounded-2xl font-bold text-sm shadow-xl hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
          {isZh ? '開始循環' : 'Start Loop'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default { SymptomAssessmentCard, BayesianCycleCard };
