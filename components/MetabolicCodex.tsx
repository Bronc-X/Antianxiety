'use client';

import React, { useState, useEffect } from 'react';
import { Geist } from 'next/font/google';

// 定义衬线字体
const geistSerif = Geist({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-geist-serif',
  display: 'swap',
});
import { 
  Activity, 
  Zap, 
  Brain, 
  Flame, 
  AlertTriangle, 
  Terminal, 
  Scan, 
  Wind,
  Layers,
  Unlock,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { useI18n, tr } from '@/lib/i18n';

// --- 模拟数据 ---
const hrvData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  value: 40 + Math.random() * 40 - (i > 18 ? 20 : 0), // 模拟晚间压力大
  baseline: 55
}));

const bioElectricData = Array.from({ length: 50 }, (_, i) => ({
  t: i,
  v: Math.sin(i * 0.2) * 20 + 50 + Math.random() * 5
}));

// 任务数据现在将动态从translations获取

// --- 组件：临床风格卡片容器 ---
const ClinicalCard = ({ title, children, className = "", danger = false }: {
  title: string;
  children: React.ReactNode;
  className?: string;
  danger?: boolean;
}) => (
  <div className={`
    relative border-[1px] bg-zinc-900/40 backdrop-blur-sm p-4 flex flex-col h-full
    ${danger ? 'border-red-900/50' : 'border-zinc-800'}
    ${className}
  `}>
    {/* 角标装饰 */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500" />

    <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-2">
      <h3 className={`text-xs font-mono tracking-[0.2em] uppercase ${danger ? 'text-red-500' : 'text-zinc-500'}`}>
        {title}
      </h3>
      {danger && <AlertTriangle size={12} className="text-red-500 animate-pulse" />}
    </div>
    <div className="flex-1 min-h-0 relative">
      {children}
    </div>
  </div>
);

// --- 组件：单值显示 ---
const MetricValue = ({ label, value, unit, trend, status = "neutral" }: {
  label: string;
  value: string;
  unit: string;
  trend?: string;
  status?: 'neutral' | 'good' | 'warning' | 'critical';
}) => {
  const colors = {
    neutral: "text-zinc-300",
    good: "text-[#ccff00]", // 酸性绿
    warning: "text-amber-500",
    critical: "text-[#ff2a00]" // 红外红
  };
  
  return (
    <div className="flex justify-between items-end py-2 border-b border-zinc-900 last:border-0 group hover:bg-zinc-900/50 transition-colors px-2 cursor-crosshair">
      <span className="text-xs font-mono text-zinc-600 uppercase">{label}</span>
      <div className="text-right">
        <div className={`text-lg font-bold font-mono leading-none ${colors[status]}`}>
          {value} <span className="text-[10px] text-zinc-600 ml-1">{unit}</span>
        </div>
        {trend && <div className="text-[10px] text-zinc-600 font-mono">{trend}</div>}
      </div>
    </div>
  );
};

export default function MetabolicCodex() {
  const [breathing, setBreathing] = useState(false);
  const { language, setLanguage, t: tKey } = useI18n();

  const t = React.useMemo(
    () =>
      new Proxy({} as Record<string, string>, {
        get: (_target, prop) => tKey(String(prop)),
      }),
    [tKey]
  );
  
  // 动态生成任务数据
  const dailyTasks = [
    { task: t.morningColdPlunge, time: '06:00', status: "done" },
    { task: t.coherentBreathing, time: '09:30', status: "done" },
    { task: t.intermittentFasting, time: '12:00-20:00', status: "active" },
    { task: t.zone2Cardio, time: '16:00', status: "pending" },
    { task: t.biomarkerScan, time: '18:00', status: "locked" },
    { task: t.vagalStimulation, time: '20:30', status: "pending" },
  ];
  
  // 切换语言
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0b] text-zinc-200 ${geistSerif.variable} font-serif text-[15px] leading-relaxed tracking-wide selection:bg-[#ccff00] selection:text-black overflow-hidden`}>
      
      {/* 顶部导航：模拟终端状态栏 */}
      <header className="fixed top-0 w-full z-50 border-b border-zinc-800 bg-[#050505]/90 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#ccff00] animate-pulse" />
            <h1 className="text-[15px] font-bold tracking-[0.3em] text-white">
              METABOLIC_CODEX <span className="text-zinc-600 font-normal ml-2">v.2.4.1</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></span>
              {t.systemOptimal}
            </span>
            <span>{t.uplink}: 42ms</span>
            <span className="text-[#ccff00]">{t.user}: BRONCIN (PRO)</span>
            
            {/* 语言切换按钮 */}
	            <button
	              onClick={toggleLanguage}
	              className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-sm transition-all"
	              title={tr(language, { zh: '切换到英文', en: 'Switch to Chinese' })}
	            >
	              <Globe className="w-3 h-3" />
	              <span className="text-[10px] font-bold">{language === 'en' ? 'EN' : (language === 'zh-TW' ? '繁' : '简')}</span>
	            </button>
          </div>
        </div>
      </header>

      {/* 主内容网格 */}
      <main className="pt-16 pb-8 max-w-[1600px] mx-auto px-4 grid grid-cols-12 gap-4 h-[calc(100vh-2rem)]">
        
        {/* 左侧栏：生物指标概览 (3 Cols) */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          
          {/* 核心评分卡 */}
          <ClinicalCard title={t.metabolicScore} className="min-h-[160px]">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl font-bold text-white tracking-tighter font-mono relative">
                82
                <span className="absolute -top-4 -right-6 text-xs text-[#ccff00] border border-[#ccff00] px-1 bg-[#ccff00]/10">
                  +1.4%
                </span>
              </div>
              <div className="mt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest text-center">
                {t.recoveryCapacity}
              </div>
              
              {/* 装饰性条形码 */}
              <div className="mt-6 w-full flex justify-between opacity-30">
                {Array.from({length: 20}).map((_,i) => (
                  <div key={i} className="w-[2px] bg-white h-4" style={{height: Math.random() * 16 + 4 + 'px'}} />
                ))}
              </div>
            </div>
          </ClinicalCard>

          {/* 实时数据流 */}
          <ClinicalCard title={t.liveTelemetry} className="flex-1">
            <div className="flex flex-col gap-1">
              <MetricValue label={t.glucose} value="98" unit="mg/dL" trend={t.stable} status="good" />
              <MetricValue label={t.ketones} value="0.4" unit="mmol/L" status="neutral" />
              <MetricValue label="HRV (rMSSD)" value="42" unit="ms" trend={t.circadianDip} status="warning" />
              <MetricValue label={t.cortisol} value="14.2" unit="ug/dL" status="neutral" />
              <MetricValue label={t.skinTemp} value="36.4" unit="°C" status="good" />
              <MetricValue label={t.restingHR} value="48" unit="bpm" status="good" />
            </div>
            
            <div className="mt-auto pt-4">
              <div className="text-[10px] text-zinc-600 font-mono mb-2">{t.anomalyDetection}</div>
              <div className="bg-red-900/10 border border-red-900/30 p-2 text-xs text-red-400 font-mono flex items-start gap-2">
                <AlertTriangle size={14} className="mt-[2px] shrink-0" />
                <span>{t.cortisolSpike}</span>
              </div>
            </div>
          </ClinicalCard>
        </div>

        {/* 中间栏：主要图表 (6 Cols) */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
          
          {/* 顶部：HRV/Cortisol 趋势图 */}
          <ClinicalCard title={t.autonomicNervousSystem} className="h-[55%]">
            <div className="absolute top-4 right-4 flex gap-2">
               <button className="px-2 py-1 bg-zinc-800 text-[10px] text-zinc-300 font-mono hover:bg-zinc-700">24H</button>
               <button className="px-2 py-1 bg-[#ccff00] text-black text-[10px] font-mono font-bold">LIVE</button>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hrvData}>
                <defs>
                  <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccff00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#52525b" tick={{fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" tick={{fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '0px'}}
                  itemStyle={{color: '#ccff00', fontFamily: 'monospace'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ccff00" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorHrv)" 
                  animationDuration={2000}
                />
                {/* 基准线 */}
                <Line type="monotone" dataKey="baseline" stroke="#52525b" strokeDasharray="5 5" dot={false} strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="mt-2 flex justify-between text-[10px] font-mono text-zinc-500">
               <span>{t.dataSource}</span>
               <span className="text-[#ccff00]">{t.synced}</span>
            </div>
          </ClinicalCard>

          {/* 底部：Pro 功能入口 (炁/生物电) */}
          <div className="grid grid-cols-2 gap-4 h-[45%]">
            <ClinicalCard title={t.fascialTensegrity}>
              <div className="h-full flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                {/* 模拟人体结构图 */}
                <div className="relative w-24 h-48 border border-zinc-800 opacity-60 group-hover:opacity-100 transition-opacity">
                   <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-16 h-[1px] bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                   <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-12 h-[1px] bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                   <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-14 h-[1px] bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                   {/* 扫描线动画 */}
                   <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[2px] bg-[#ccff00] shadow-[0_0_15px_#ccff00]"
                   />
                </div>
                <div className="absolute bottom-2 w-full px-2">
                   <div className="flex justify-between text-[10px] font-mono text-blue-400">
                     <span>{t.neckLoad}</span>
                     <span>{t.high}</span>
                   </div>
                   <div className="w-full bg-zinc-900 h-1 mt-1">
                     <div className="bg-blue-500 h-full w-[80%]"></div>
                   </div>
                </div>
              </div>
            </ClinicalCard>

            <ClinicalCard title={t.bioElectricStatus}>
               <div className="h-full flex flex-col">
                  <div className="flex-1 relative">
                    {/* 模拟电信号波形 */}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bioElectricData}>
                        <Line type="monotone" dataKey="v" stroke="#00f0ff" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none"></div>
                  </div>
                  <div className="text-xs font-mono mt-2">
                    <div className="flex justify-between text-zinc-500 mb-1">
                       <span>{t.vagalTone}</span>
                       <span className="text-[#00f0ff]">{t.optimal}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 leading-tight">
                       {t.qiFlux}
                    </p>
                  </div>
               </div>
            </ClinicalCard>
          </div>
        </div>

        {/* 右侧栏：行动与控制 (3 Cols) */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          
          {/* 呼吸训练 / 迷走神经调节 */}
          <ClinicalCard title={t.vagalCalibration} className="min-h-[300px] border-[#ccff00]/30">
             <div className="flex flex-col items-center justify-center h-full gap-8 relative overflow-hidden">
                {/* 呼吸动画圆环 */}
                <motion.div
                  animate={{
                    scale: breathing ? [1, 1.5, 1] : 1,
                    opacity: breathing ? [0.5, 1, 0.5] : 0.8,
                    borderColor: breathing ? ['#52525b', '#ccff00', '#52525b'] : '#52525b'
                  }}
                  transition={{
                    duration: 10, // 5秒吸气，5秒呼气 (Coherent Breathing)
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center relative"
                >
                   <div className="absolute inset-0 bg-[#ccff00]/5 rounded-full blur-xl"></div>
                   <span className="font-mono text-2xl text-white font-bold">
                     {breathing ? "5.5s" : t.idle}
                   </span>
                </motion.div>

                <div className="w-full space-y-2 z-10">
                   <button 
                    onClick={() => setBreathing(!breathing)}
                    className={`
                      w-full py-3 text-xs font-mono font-bold tracking-widest uppercase border transition-all
                      ${breathing 
                        ? 'bg-transparent text-[#ccff00] border-[#ccff00]' 
                        : 'bg-zinc-100 text-black border-zinc-100 hover:bg-zinc-300'}
                    `}
                   >
                      {breathing ? t.terminateSession : t.initiateProtocol}
                   </button>
                   <p className="text-[10px] text-center text-zinc-500 font-mono">
                      {t.targetAlphaWaves}
                   </p>
                </div>
             </div>
          </ClinicalCard>

          {/* 待办清单：斯多葛式干预 */}
          <ClinicalCard title={t.dailyInterventions} className="flex-1">
             <ul className="space-y-3">
               {dailyTasks.map((item, idx) => (
                 <li key={idx} className="flex items-center gap-3 group">
                    <div className={`
                      w-4 h-4 border flex items-center justify-center
                      ${item.status === 'done' ? 'bg-[#ccff00] border-[#ccff00]' : 'border-zinc-700'}
                    `}>
                      {item.status === 'done' && <div className="w-2 h-2 bg-black" />}
                    </div>
                    <div className="flex-1">
                       <div className={`text-xs font-mono ${item.status === 'locked' ? 'text-zinc-600' : 'text-zinc-300'}`}>
                         {item.task}
                       </div>
                       <div className="text-[10px] text-zinc-600 font-mono">{item.time}</div>
                    </div>
                    {item.status === 'locked' && <Unlock size={10} className="text-zinc-700" />}
                 </li>
               ))}
             </ul>
          </ClinicalCard>
        </div>
      </main>

      {/* 底部浮动栏：PRO用户专属 */}
      <div className="fixed bottom-0 w-full bg-[#ccff00] text-black h-8 flex items-center justify-center overflow-hidden z-40">
         <div className="flex items-center gap-8 animate-marquee whitespace-nowrap font-mono text-xs font-bold uppercase tracking-wider">
            <span>{t.systemAlert}</span>
            <span>{t.suggestion}</span>
            <span>{t.newResearch}</span>
         </div>
      </div>

      <style jsx global>{`
        .cursor-crosshair {
          cursor: crosshair;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
