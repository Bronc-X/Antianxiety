'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Brain, Sparkles, Activity, Shield, Clock, Wind, Check, ChevronRight, Palette } from 'lucide-react';

// 主题类型
type ThemeType = 'light' | 'starry' | 'forest' | 'ocean' | 'sunset' | 'minimal';

// 星星组件
function Stars({ color = 'white' }: { color?: string }) {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    left: (i * 37 + 13) % 100,
    top: (i * 23 + 7) % 100,
    delay: (i * 0.3) % 3,
    duration: 2 + (i % 3),
    size: i % 4 === 0 ? 2 : 1
  }));

  return (
    <>
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${color === 'white' ? 'bg-white' : color}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </>
  );
}

// 流星组件
function ShootingStar() {
  return (
    <motion.div
      className="absolute w-24 h-0.5 bg-gradient-to-r from-white to-transparent"
      style={{ top: '15%', left: '70%', rotate: 45 }}
      animate={{
        x: [-100, 300],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 8,
      }}
    />
  );
}

// 所有主题配置 - 使用内联样式确保背景颜色正确显示
const THEMES: Record<ThemeType, {
  name: string;
  nameEn: string;
  emoji: string;
  bgStyle: React.CSSProperties; // 使用内联样式
  card: string;
  text: string;
  textMuted: string;
  textAccent: string;
  accent: string;
  accentAlt: string;
  button: string;
  tabBg: string;
  tabActive: string;
  hasStars?: boolean;
  hasMoon?: boolean;
  starColor?: string;
  accentColor: string; // 强调色 hex
}> = {
  light: {
    name: '燕麦绿',
    nameEn: 'California Calm',
    emoji: '🌿',
    bgStyle: { background: 'linear-gradient(to bottom, #FAF6EF, #F5F0E8)' },
    card: 'bg-white/90 backdrop-blur-xl border-[#E7E1D6]',
    text: 'text-[#0B3D2E]',
    textMuted: 'text-[#0B3D2E]/60',
    textAccent: 'text-[#9CAF88]',
    accent: 'from-[#9CAF88] to-[#7A9A6A]',
    accentAlt: 'from-[#C4A77D] to-[#A68B5B]',
    button: 'bg-[#F5F0E8] hover:bg-[#E8E3D9] border-[#E7E1D6]',
    tabBg: 'bg-[#E8E3D9]',
    tabActive: 'bg-[#0B3D2E] text-white',
    accentColor: '#9CAF88',
  },
  starry: {
    name: '星空夜',
    nameEn: 'Starry Night',
    emoji: '🌙',
    bgStyle: { background: 'linear-gradient(to bottom, #1e1b4b, #581c87, #0f172a)' }, // indigo-950 -> purple-900 -> slate-900
    card: 'bg-white/5 backdrop-blur-xl border-white/10',
    text: 'text-white/90',
    textMuted: 'text-white/60',
    textAccent: 'text-teal-400',
    accent: 'from-teal-400 to-cyan-400',
    accentAlt: 'from-amber-400 to-orange-400',
    button: 'bg-white/10 hover:bg-white/20 border-white/20',
    tabBg: 'bg-white/5',
    tabActive: 'bg-white/20 text-white',
    hasStars: true,
    hasMoon: true,
    accentColor: '#2dd4bf',
  },
  forest: {
    name: '深林绿',
    nameEn: 'Deep Forest',
    emoji: '🌲',
    bgStyle: { background: 'linear-gradient(to bottom, #022c22, #14532d, #0f172a)' }, // emerald-950 -> green-900 -> slate-900
    card: 'bg-white/5 backdrop-blur-xl border-emerald-500/20',
    text: 'text-white/90',
    textMuted: 'text-white/60',
    textAccent: 'text-emerald-400',
    accent: 'from-emerald-400 to-green-400',
    accentAlt: 'from-lime-400 to-emerald-400',
    button: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
    tabBg: 'bg-emerald-500/10',
    tabActive: 'bg-emerald-500/30 text-white',
    hasStars: true,
    starColor: 'bg-emerald-200',
    accentColor: '#34d399',
  },
  ocean: {
    name: '深海蓝',
    nameEn: 'Deep Ocean',
    emoji: '🌊',
    bgStyle: { background: 'linear-gradient(to bottom, #0f172a, #1e3a8a, #083344)' }, // slate-900 -> blue-900 -> cyan-950
    card: 'bg-white/5 backdrop-blur-xl border-cyan-500/20',
    text: 'text-white/90',
    textMuted: 'text-white/60',
    textAccent: 'text-cyan-400',
    accent: 'from-cyan-400 to-blue-400',
    accentAlt: 'from-teal-400 to-cyan-400',
    button: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
    tabBg: 'bg-cyan-500/10',
    tabActive: 'bg-cyan-500/30 text-white',
    hasStars: true,
    starColor: 'bg-cyan-200',
    accentColor: '#22d3ee',
  },
  sunset: {
    name: '暮色橙',
    nameEn: 'Sunset Glow',
    emoji: '🌅',
    bgStyle: { background: 'linear-gradient(to bottom, #0c0a09, #431407, #4c0519)' }, // stone-950 -> orange-950 -> rose-950
    card: 'bg-white/5 backdrop-blur-xl border-orange-500/20',
    text: 'text-white/90',
    textMuted: 'text-white/60',
    textAccent: 'text-orange-400',
    accent: 'from-orange-400 to-amber-400',
    accentAlt: 'from-rose-400 to-orange-400',
    button: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
    tabBg: 'bg-orange-500/10',
    tabActive: 'bg-orange-500/30 text-white',
    hasStars: true,
    starColor: 'bg-orange-200',
    accentColor: '#fb923c',
  },
  minimal: {
    name: '极简黑',
    nameEn: 'Minimal Dark',
    emoji: '⚫',
    bgStyle: { background: 'linear-gradient(to bottom, #0a0a0a, #171717, #0a0a0a)' }, // neutral-950 -> neutral-900 -> neutral-950
    card: 'bg-white/5 backdrop-blur-xl border-white/10',
    text: 'text-white/90',
    textMuted: 'text-white/50',
    textAccent: 'text-white',
    accent: 'from-white to-neutral-300',
    accentAlt: 'from-neutral-400 to-neutral-300',
    button: 'bg-white/5 hover:bg-white/10 border-white/10',
    tabBg: 'bg-white/5',
    tabActive: 'bg-white/15 text-white',
    accentColor: '#ffffff',
  },
};

export default function TestDarkThemePage() {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('starry');
  const [activeTab, setActiveTab] = useState<'today' | 'plan'>('today');

  const theme = THEMES[currentTheme];
  const isDark = currentTheme !== 'light';

  return (
    <div 
      className="min-h-screen relative overflow-hidden transition-all duration-500"
      style={theme.bgStyle}
    >
      {/* 背景效果 - 根据主题显示不同装饰 */}
      {theme.hasStars && <Stars color={theme.starColor} />}
      {theme.hasStars && <ShootingStar />}
      
      {/* 星空夜 - 月亮 */}
      {currentTheme === 'starry' && (
        <motion.div
          className="absolute top-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200"
          animate={{
            boxShadow: ['0 0 30px rgba(253, 224, 71, 0.3)', '0 0 50px rgba(253, 224, 71, 0.5)', '0 0 30px rgba(253, 224, 71, 0.3)'],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Moon className="w-8 h-8 text-amber-500 absolute top-4 left-4" />
        </motion.div>
      )}
      
      {/* 深林绿 - 萤火虫效果 */}
      {currentTheme === 'forest' && (
        <>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`firefly-${i}`}
              className="absolute w-2 h-2 rounded-full bg-emerald-300"
              style={{
                left: `${(i * 17 + 5) % 90}%`,
                top: `${(i * 23 + 10) % 80}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + (i % 2),
                repeat: Infinity,
                delay: i * 0.4,
              }}
            />
          ))}
        </>
      )}
      
      {/* 深海蓝 - 气泡效果 */}
      {currentTheme === 'ocean' && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`bubble-${i}`}
              className="absolute rounded-full border border-cyan-300/30 bg-cyan-400/10"
              style={{
                left: `${(i * 13 + 3) % 95}%`,
                bottom: '-20px',
                width: 8 + (i % 3) * 6,
                height: 8 + (i % 3) * 6,
              }}
              animate={{
                y: [0, -800],
                opacity: [0.6, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 8 + (i % 4) * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'linear',
              }}
            />
          ))}
        </>
      )}
      
      {/* 暮色橙 - 太阳光晕 */}
      {currentTheme === 'sunset' && (
        <>
          <motion.div
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251,146,60,0.4) 0%, rgba(251,146,60,0.1) 40%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-20 right-10 w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </>
      )}
      
      {/* 极简黑 - 微妙的光点 */}
      {currentTheme === 'minimal' && (
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      )}

      {/* 内容区 */}
      <div className="relative z-10 p-4 pb-24 max-w-4xl mx-auto">
        {/* 主题选择器 */}
        <div className="mb-6 pt-4">
          <div className={`flex items-center gap-2 mb-3 ${theme.textMuted}`}>
            <Palette className="w-4 h-4" />
            <span className="text-sm">选择主题配色</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(THEMES) as ThemeType[]).map((key) => {
              const t = THEMES[key];
              const isActive = currentTheme === key;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentTheme(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    isActive 
                      ? isDark 
                        ? 'bg-white/20 border-white/30 text-white' 
                        : 'bg-[#0B3D2E] border-[#0B3D2E] text-white'
                      : `${theme.button} border`
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span className={`text-sm font-medium ${isActive ? '' : theme.text}`}>{t.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 标题 */}
        <header className="mb-8">
          <motion.h1 
            key={currentTheme}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`text-4xl md:text-5xl font-black tracking-tight ${theme.text}`}
          >
            你好，
            <span className={`bg-gradient-to-r ${theme.accent} bg-clip-text text-transparent`}>
              测试用户
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className={`text-lg mt-2 ${theme.textMuted}`}
          >
            {theme.emoji} {theme.name} · {theme.nameEn}
          </motion.p>
        </header>

        {/* 主卡片 */}
        <motion.div 
          layout
          className={`rounded-2xl border ${theme.card} overflow-hidden mb-6`}
        >
          {/* 标签栏 */}
          <div className="p-4">
            <div className={`flex gap-1 p-1 rounded-xl ${theme.tabBg}`}>
              {[
                { id: 'today', label: '今日', icon: <Brain className="w-4 h-4" /> },
                { id: 'plan', label: '计划', icon: <Activity className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? theme.tabActive
                      : isDark
                        ? 'text-white/60 hover:text-white/80 hover:bg-white/5'
                        : 'text-[#0B3D2E] hover:text-[#0B3D2E]/80 hover:bg-[#F5F0E8]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div className="px-4 pb-4">
            <AnimatePresence mode="wait">
              {activeTab === 'today' && (
                <motion.div
                  key="today"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${theme.accent} bg-opacity-30`}
                      style={{ background: `linear-gradient(135deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(156,175,136,0.3)'}, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(196,167,125,0.2)'})` }}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Brain className={`w-6 h-6 ${theme.textAccent}`} />
                    </motion.div>
                    <div className="flex-1 pt-1">
                      <p className={`text-sm leading-relaxed ${theme.text}`}>
                        今天的状态不错！建议保持当前节奏，适当安排一些轻度活动来维持能量水平。
                      </p>
                      <p className={`text-sm mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-[#E7E1D6]/50'} ${theme.textMuted}`}>
                        基于你的睡眠数据和压力指标，AI 建议今天专注于恢复性活动。
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 pt-3 border-t ${isDark ? 'border-white/10' : 'border-[#E7E1D6]/30'}`}>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${theme.accent} bg-opacity-20 ${theme.textAccent}`}
                      style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(156,175,136,0.2)' }}>
                      ⚡ 平衡模式
                    </span>
                    <span className={theme.textMuted}>•</span>
                    <span className={`text-xs ${theme.textMuted}`}>基于今日校准</span>
                  </div>
                </motion.div>
              )}

              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {[
                    { icon: Clock, title: '午间 15 分钟 NSDR 休息', done: true },
                    { icon: Wind, title: '5 分钟盒式呼吸', done: false },
                    { icon: Moon, title: '今晚提前 30 分钟入睡', done: false },
                  ].map((task, i) => (
                    <motion.div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        task.done 
                          ? isDark ? 'bg-white/10 border-white/20' : 'bg-emerald-50/50 border-emerald-100'
                          : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        task.done 
                          ? `bg-gradient-to-r ${theme.accent} border-transparent`
                          : isDark ? 'border-white/30' : 'border-gray-300'
                      }`}>
                        {task.done && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className={`p-1 rounded-md ${isDark ? 'bg-white/10' : 'bg-blue-50'} ${theme.textAccent}`}>
                          <task.icon className="w-4 h-4" />
                        </span>
                        <span className={`text-sm font-medium ${task.done ? (isDark ? 'text-white/40 line-through' : 'text-gray-400 line-through') : theme.text}`}>
                          {task.title}
                        </span>
                      </div>
                      {!task.done && (
                        <button className={`p-2 rounded-lg ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <ChevronRight className={`w-4 h-4 ${theme.textMuted}`} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl ${theme.card} border cursor-pointer`}
          >
            <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center`}
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(156,175,136,0.3)' }}>
              <Sparkles className={`w-5 h-5 ${theme.textAccent}`} />
            </div>
            <p className={`text-sm font-medium ${theme.text}`}>症状评估</p>
            <p className={`text-xs mt-1 ${theme.textMuted}`}>AI 健康问诊</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-xl ${theme.card} border cursor-pointer`}
          >
            <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center`}
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(196,167,125,0.3)' }}>
              <Brain className={`w-5 h-5 ${theme.textAccent}`} />
            </div>
            <p className={`text-sm font-medium ${theme.text}`}>认知天平</p>
            <p className={`text-xs mt-1 ${theme.textMuted}`}>贝叶斯循环</p>
          </motion.div>
        </div>

        {/* 研究洞察卡片 */}
        <motion.div 
          className={`rounded-xl ${theme.card} border p-4`}
        >
          <div className={`flex items-center gap-2 mb-3 ${theme.text}`}>
            <Shield className="w-5 h-5" />
            <span className="font-semibold">研究洞察</span>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-[#FAF6EF]'}`}>
            <p className={`text-sm leading-relaxed ${theme.text}`}>
              <span className={theme.textAccent}>关键发现：</span>
              年龄相关的肌肉流失主要由身体活动减少驱动，而非衰老本身。
            </p>
          </div>
          <p className={`text-xs mt-3 ${theme.textMuted}`}>
            这是一项同行评审研究。个人健康建议请咨询专业医疗人员。
          </p>
        </motion.div>

        {/* 底部说明 */}
        <div className={`mt-8 text-center ${theme.textMuted}`}>
          <p className="text-sm">
            {theme.emoji} 当前主题：{theme.name} ({theme.nameEn})
          </p>
          <p className="text-xs mt-2">
            共 {Object.keys(THEMES).length} 种配色方案可选
          </p>
        </div>
      </div>
    </div>
  );
}
