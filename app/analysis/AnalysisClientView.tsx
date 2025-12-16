'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Activity, 
  Brain, 
  Flame, 
  Moon, 
  Zap,
  Loader2
} from 'lucide-react';
import ProAntiAgingFoods from '@/components/ProAntiAgingFoods';
import { useI18n } from '@/lib/i18n';

const PlanListWithActions = lazy(() => import('@/components/PlanListWithActions'));

function LoadingPlaceholder({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center bg-white/50 rounded-xl border border-[#E7E1D6]/50`}>
      <Loader2 className="w-5 h-5 text-[#9CAF88] animate-spin" />
    </div>
  );
}


interface AnalysisClientViewProps {
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: string;
    full_name?: string;
  };
  plans?: any[];
}





export default function AnalysisClientView({ profile, plans = [] }: AnalysisClientViewProps) {
  const { t, language } = useI18n();
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const userName = profile.full_name || (language === 'en' ? 'Friend' : '朋友');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsGenerating(false), 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 flex items-center justify-center transition-colors">
        <div className="text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
            <div 
              className="absolute inset-0 rounded-full bg-[#0B3D2E] dark:bg-emerald-600 opacity-20"
              style={{
                animation: 'breathe 2s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute inset-4 rounded-full bg-[#0B3D2E] dark:bg-emerald-600 opacity-40"
              style={{
                animation: 'breathe 2s ease-in-out infinite 0.3s',
              }}
            />
            <div 
              className="absolute inset-8 rounded-full bg-[#0B3D2E] dark:bg-emerald-600 opacity-60"
              style={{
                animation: 'breathe 2s ease-in-out infinite 0.6s',
              }}
            />
            <div className="absolute inset-12 rounded-full bg-[#0B3D2E] dark:bg-emerald-600 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#FFFBF0]" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-[#0B3D2E] dark:text-white">
              {t('analysis.loading')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[#0B3D2E]/60 dark:text-neutral-400">
              <span>{progress}%</span>
              <div className="w-32 h-1 bg-[#E7E1D6] dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#0B3D2E] dark:bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.3); opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 p-6 md:p-12 font-sans text-[#0B3D2E] dark:text-white transition-colors">
      
      <header className="max-w-4xl mx-auto mb-10">
        <div className="flex items-center gap-3 mb-2 opacity-60">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wider uppercase">{t('analysis.decoder')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight text-[#0B3D2E] dark:text-white">
          {userName}{language === 'zh' ? '，' : ', '}{t('analysis.yourFingerprint')}<br />
          {t('analysis.thisWeek')} <span className="text-amber-600 dark:text-amber-400 border-b-2 border-amber-200 dark:border-amber-600">"{t('analysis.status.recovery')}"</span>
        </h1>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 1: 左侧核心洞察 (2/3 宽度) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium opacity-80 px-2">{t('analysis.signalTranslation')}</h3>
            
            <MetricTranslationCard 
              icon={<Moon className="w-5 h-5 text-amber-600" />}
              title={t('analysis.sleepRecovery')}
              status={t('analysis.needAttention')}
              statusColor="bg-amber-100 text-amber-800"
              feeling={language === 'en' ? 'You may feel: morning brain fog, like you didn\'t sleep, craving sweets in the afternoon.' : '你可能感觉：早起脑雾，像没睡醒，下午渴望甜食。'}
              science={language === 'en' ? 'Deep sleep phase less than 15%, growth hormone secretion blocked.' : '深睡阶段占比不足 15%，生长激素分泌受阻。'}
              feelingLabel={t('analysis.feelingMap')}
            />

            <MetricTranslationCard 
              icon={<Zap className="w-5 h-5 text-emerald-600" />}
              title={t('analysis.mitochondria')}
              status={t('analysis.runningWell')}
              statusColor="bg-emerald-100 text-emerald-800"
              feeling={language === 'en' ? 'You may feel: good endurance during exercise, no chest tightness.' : '你可能感觉：运动时耐力不错，没有胸闷感。'}
              science={language === 'en' ? 'ATP synthesis efficiency above baseline.' : 'ATP 合成效率处于基准线以上。'}
              feelingLabel={t('analysis.feelingMap')}
            />

             <MetricTranslationCard 
              icon={<Flame className="w-5 h-5 text-blue-600" />}
              title={t('analysis.antiInflammation')}
              status={t('analysis.excellent')}
              statusColor="bg-blue-100 text-blue-800"
              feeling={language === 'en' ? 'You may feel: no joint pain, stable skin condition.' : '你可能感觉：关节无酸痛，皮肤状态稳定。'}
              science={language === 'en' ? 'CRP indicator estimated to remain low, immune barrier stable.' : 'CRP 指标推测维持低位，免疫屏障稳固。'}
              feelingLabel={t('analysis.feelingMap')}
            />
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="bg-[#0B3D2E] text-[#FFFBF0] p-6 rounded-[2rem] relative overflow-hidden">
            <Brain className="w-12 h-12 text-white/10 absolute top-4 right-4" />
            <h3 className="text-lg font-medium mb-4 relative z-10">🔄 {t('analysis.resetCamp')}</h3>
            <p className="text-white/80 text-sm leading-relaxed relative z-10 mb-6">
              {t('analysis.resetDesc')}
            </p>
            <div className="space-y-3 relative z-10">
              <StrategyItem text={`📅 ${t('analysis.bioClockTraining')}`} />
              <StrategyItem text={`🌙 ${t('analysis.deepSleepTraining')}`} />
              <StrategyItem text={`🏃 ${t('analysis.aerobicRebuild')}`} />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-[#E7E1D6] dark:border-neutral-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0B3D2E]/50 dark:text-neutral-500 mb-3">{t('analysis.didYouKnow')}</h4>
            <p className="text-sm font-medium text-[#0B3D2E] dark:text-white mb-2">{t('analysis.cortisolAwakening')}</p>
            <p className="text-xs text-[#0B3D2E]/60 dark:text-neutral-400 leading-relaxed">
              {t('analysis.cortisolDesc')}
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 3: AI甄选抗衰食材 (使用 ProAntiAgingFoods 组件) */}
      <div className="max-w-4xl mx-auto mt-12">
        <ProAntiAgingFoods />
      </div>

      {/* SECTION 4: 我的健康计划 */}
      {plans.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium opacity-80 px-2">
              {language === 'en' ? 'My Health Plans' : '我的健康计划'}
            </h3>
            <span className="text-xs font-mono text-[#0B3D2E]/40 dark:text-neutral-500">
              {plans.length} {language === 'en' ? 'ACTIVE' : '进行中'}
            </span>
          </div>
          <Suspense fallback={<LoadingPlaceholder height="h-64" />}>
            <PlanListWithActions initialPlans={plans} />
          </Suspense>
        </div>
      )}

    </div>
  );
}

// 子组件：指标翻译卡片
function MetricTranslationCard({ icon, title, status, statusColor, feeling, science, feelingLabel }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-[#E7E1D6] dark:border-neutral-800 flex items-start gap-4 hover:shadow-md transition-shadow cursor-default">
      <div className="p-3 bg-[#FAF6EF] dark:bg-neutral-800 rounded-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-[#1a1a1a] dark:text-white">{title}</h4>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${statusColor}`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-[#1a1a1a] dark:text-neutral-300 mb-2">
          <span className="text-[#1a1a1a]/60 dark:text-neutral-500">{feelingLabel}</span>{feeling}
        </p>
        <p className="text-xs text-[#1a1a1a]/50 dark:text-neutral-500 border-t border-[#E7E1D6] dark:border-neutral-700 pt-2 mt-2">
          {science}
        </p>
      </div>
    </div>
  );
}

// 子组件：策略项
function StrategyItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
      <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100" />
      </div>
      <span className="text-sm font-medium text-white/90">{text}</span>
    </div>
  );
}
