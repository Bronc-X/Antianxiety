'use client';

/**
 * MaxSettings Component - Premium Edition
 * 
 * 高级工业/科幻风格设置面板
 * Glassmorphism + 精致动效 + 实时反馈
 * 
 * @module components/max/MaxSettings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, Brain, Sparkles, Activity } from 'lucide-react';
import { AISettings, MaxMode, HONESTY_RANGE, HUMOR_RANGE } from '@/types/max';

interface MaxSettingsProps {
  initialSettings?: AISettings;
  onSettingsChange?: (settings: AISettings) => void;
}

// Mode info with icons, labels and colors
const MODE_INFO: Record<MaxMode, { 
  icon: typeof Settings; 
  label: string; 
  sublabel: string; 
  color: string 
}> = {
  'Dr. House': { icon: Zap, label: 'Dr. House', sublabel: '直接-诊断', color: '#C4A77D' },
  'Zen Master': { icon: Brain, label: 'Zen Master', sublabel: '平静-哲学', color: '#9CAF88' },
  'MAX': { icon: Sparkles, label: 'MAX', sublabel: '简洁-幽默', color: '#E8DFD0' }
};

// Derive mode from humor level
function deriveMode(humorLevel: number): MaxMode {
  if (humorLevel < 33) return 'Dr. House';
  if (humorLevel < 66) return 'Zen Master';
  return 'MAX';
}

export function MaxSettings({ initialSettings, onSettingsChange }: MaxSettingsProps) {
  const [settings, setSettings] = useState<AISettings>(initialSettings || {
    honesty_level: 90,
    humor_level: 65,
    mode: 'MAX'
  });
  const [maxFeedback, setMaxFeedback] = useState<string>('System operational. Awaiting input.');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSlider, setActiveSlider] = useState<'honesty' | 'humor' | null>(null);
  
  // Derived mode from humor level
  const derivedMode = deriveMode(settings.humor_level);
  const currentModeInfo = MODE_INFO[derivedMode];

  // Fetch settings on mount
  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [initialSettings]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/max/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AISettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    onSettingsChange?.(updated);

    try {
      setIsLoading(true);
      const res = await fetch('/api/max/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (res.ok) {
        const feedbackRes = await fetch('/api/max/response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'slider_change',
            data: { 
              setting: Object.keys(newSettings)[0],
              value: Object.values(newSettings)[0]
            }
          })
        });

        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setMaxFeedback(feedbackData.response?.text || 'Parameters updated.');
        }
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMaxFeedback('Processing anomaly. Retrying...');
    } finally {
      setIsLoading(false);
      setActiveSlider(null);
    }
  }, [settings, onSettingsChange]);

  return (
    <div className="relative">
      {/* Glassmorphism Container */}
      <motion.div
        className="relative rounded-3xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]" />
        
        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 30% 20%, rgba(196, 167, 125, 0.3) 0%, transparent 40%)',
              'radial-gradient(circle at 70% 80%, rgba(156, 175, 136, 0.3) 0%, transparent 40%)',
              'radial-gradient(circle at 30% 20%, rgba(196, 167, 125, 0.3) 0%, transparent 40%)',
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Glass Overlay */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.02]" />

        {/* Content */}
        <div className="relative z-10 p-8 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4A77D]/20 to-[#C4A77D]/5 
                           flex items-center justify-center border border-[#C4A77D]/20"
                animate={{ 
                  boxShadow: isLoading 
                    ? ['0 0 20px rgba(196,167,125,0.3)', '0 0 40px rgba(196,167,125,0.1)', '0 0 20px rgba(196,167,125,0.3)']
                    : '0 0 20px rgba(196,167,125,0.1)'
                }}
                transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
              >
                <Settings className="w-5 h-5 text-[#C4A77D]" />
              </motion.div>
              <div>
                <h3 className="text-lg font-medium text-white">Max Configuration</h3>
                <p className="text-xs text-white/40 tracking-wide">BIO-OPERATING SYSTEM</p>
              </div>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-2 h-2 rounded-full ${isLoading ? 'bg-[#C4A77D]' : 'bg-[#9CAF88]'}`}
                animate={isLoading ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span className="text-xs text-white/30 font-mono">
                {isLoading ? 'SYNC' : 'READY'}
              </span>
            </div>
          </div>

          {/* Max Feedback Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={maxFeedback}
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.05]">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-[#9CAF88]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-[#9CAF88]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/30 mb-1">MAX RESPONSE</p>
                    <p className="text-sm text-white/80 leading-relaxed">{maxFeedback}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Sliders Section */}
          <div className="space-y-6">
            {/* Honesty Slider */}
            <PremiumSlider
              label="Honesty Level"
              sublabel="诚实度"
              value={settings.honesty_level}
              min={HONESTY_RANGE.min}
              max={HONESTY_RANGE.max}
              color="#C4A77D"
              leftLabel="Diplomatic"
              rightLabel="Brutal"
              isActive={activeSlider === 'honesty'}
              isLoading={isLoading}
              onChange={(v) => {
                setActiveSlider('honesty');
                setSettings(s => ({ ...s, honesty_level: v }));
              }}
              onChangeEnd={(v) => updateSettings({ honesty_level: v })}
            />

            {/* Humor Slider with Auto Mode Indicator */}
            <div className="space-y-3">
              <PremiumSlider
                label="Humor Level"
                sublabel="幽默感"
                value={settings.humor_level}
                min={HUMOR_RANGE.min}
                max={HUMOR_RANGE.max}
                color={currentModeInfo.color}
                leftLabel="Serious"
                rightLabel="Witty"
                isActive={activeSlider === 'humor'}
                isLoading={isLoading}
                onChange={(v) => {
                  setActiveSlider('humor');
                  const newMode = deriveMode(v);
                  setSettings(s => ({ ...s, humor_level: v, mode: newMode }));
                }}
                onChangeEnd={(v) => {
                  const newMode = deriveMode(v);
                  updateSettings({ humor_level: v, mode: newMode });
                }}
              />
              
              {/* Auto-derived Personality Mode Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={derivedMode}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border"
                  style={{ 
                    backgroundColor: `${currentModeInfo.color}10`,
                    borderColor: `${currentModeInfo.color}30`
                  }}
                >
                  <motion.div
                    animate={{ 
                      boxShadow: `0 0 20px ${currentModeInfo.color}40`
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentModeInfo.color}20` }}
                  >
                    <currentModeInfo.icon className="w-4 h-4" style={{ color: currentModeInfo.color }} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{currentModeInfo.label}</p>
                    <p className="text-xs" style={{ color: `${currentModeInfo.color}` }}>{currentModeInfo.sublabel}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-3 h-3 text-white/20" />
              <span className="text-[10px] text-white/20 tracking-wider">
                POWERED BY BAYESIAN INFERENCE
              </span>
            </div>
            <span className="text-[10px] text-white/20 font-mono">
              v2.0
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Premium Slider Component
interface PremiumSliderProps {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  color: string;
  leftLabel: string;
  rightLabel: string;
  isActive: boolean;
  isLoading: boolean;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
}

function PremiumSlider({
  label,
  sublabel,
  value,
  min,
  max,
  color,
  leftLabel,
  rightLabel,
  isActive,
  isLoading,
  onChange,
  onChangeEnd
}: PremiumSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
    
    // Debounce the API call
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChangeEnd(newValue);
    }, 500);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-xs text-white/30">{sublabel}</p>
        </div>
        <motion.div
          className="px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <span className="text-lg font-mono" style={{ color }}>{value}</span>
          <span className="text-xs ml-0.5" style={{ color: `${color}80` }}>%</span>
        </motion.div>
      </div>

      <div className="relative h-12 flex items-center">
        {/* Track Background */}
        <div className="absolute inset-x-0 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          {/* Filled Track */}
          <motion.div
            className="h-full rounded-full"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}40, ${color})`
            }}
            animate={isActive ? { opacity: [0.8, 1, 0.8] } : { opacity: 1 }}
            transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
          />
        </div>

        {/* Thumb Glow */}
        <motion.div
          className="absolute h-8 w-8 rounded-full pointer-events-none"
          style={{ 
            left: `calc(${percentage}% - 16px)`,
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`
          }}
          animate={isActive ? { scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] } : {}}
          transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
        />

        {/* Native Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Thumb */}
        <motion.div
          className="absolute w-5 h-5 rounded-full border-2 pointer-events-none"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            backgroundColor: '#1a1a2e',
            borderColor: color,
            boxShadow: `0 0 15px ${color}50`
          }}
          animate={isActive ? { scale: 1.2 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-white/20">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export default MaxSettings;
