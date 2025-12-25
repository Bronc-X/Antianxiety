'use client';

import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Send, Sparkles, TrendingUp, Calendar, Clock, Battery, Lightbulb, ChevronDown } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { calculateWeeklyBayesianConfidence, getCurrentWeekConfidence, formatConfidencePercentage, getConfidenceColor, getConfidenceIcon } from '@/lib/bayesian-confidence';
import Slider from '@/components/ui/Slider';
import ActivityRing, { calculateRingPercentages } from '@/components/ActivityRing';

// 复用原有的类型定义
type DailyWellnessLog = {
  id?: number;
  log_date: string;
  sleep_duration_minutes: number | null;
  sleep_quality: string | null;
  exercise_duration_minutes: number | null;
  mood_status: string | null;
  stress_level: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

interface DailyCheckInProfile {
  id?: string;
  daily_checkin_time?: string | null;
  sleep_hours?: number | string | null;
  stress_level?: number | null;
}

interface EnhancedDailyCheckInProps {
  initialProfile: DailyCheckInProfile;
  initialLogs: DailyWellnessLog[];
}

// 语音识别状态
interface VoiceRecording {
  isRecording: boolean;
  transcript: string;
  isProcessing: boolean;
}

// 复用原有的标记数据
const sleepDurationMarks = [
  { label: '少于4h', value: 180, indicator: '身体恢复不足' },
  { label: '4h', value: 240, indicator: '极低睡眠量' },
  { label: '5h', value: 300, indicator: '偏低睡眠量' },
  { label: '6h', value: 360, indicator: '临界睡眠量' },
  { label: '6.5h', value: 390, indicator: '轻度恢复' },
  { label: '7h', value: 420, indicator: '标准恢复区间' },
  { label: '7.5h', value: 450, indicator: '充足恢复' },
  { label: '8h', value: 480, indicator: '优质恢复' },
  { label: '9h+', value: 540, indicator: '超量恢复 / 需关注原因' },
];

const sleepQualityMarks = [
  { label: '恢复极佳', value: 'excellent', indicator: '深睡比例高，醒来神清气爽' },
  { label: '恢复良好', value: 'good', indicator: '睡眠结构良好，轻微起夜' },
  { label: '一般', value: 'average', indicator: '可用睡眠，建议优化作息' },
  { label: '浅睡多梦', value: 'poor', indicator: '建议减少屏幕刺激、晚餐过晚等因素' },
  { label: '断续失眠', value: 'very_poor', indicator: '请优先处理焦虑源或寻求专业帮助' },
];

const exerciseDurationMarks = [
  { label: '未运动', value: 0, indicator: '今日未计入主动运动' },
  { label: '10 分钟', value: 10, indicator: '轻量活动，适合启动身体' },
  { label: '20 分钟', value: 20, indicator: '基础训练量' },
  { label: '30 分钟', value: 30, indicator: '有效训练，代谢激活' },
  { label: '45 分钟', value: 45, indicator: '中等负荷，心肺提升' },
  { label: '60 分钟', value: 60, indicator: '较高训练量，注意补水' },
  { label: '90 分钟+', value: 90, indicator: '高强度或长时间训练' },
];

const moodMarks = [
  { label: '专注平稳', value: '专注平稳', indicator: '思路清晰，可安排挑战任务' },
  { label: '轻松愉悦', value: '轻松愉悦', indicator: '积极情绪，适合社交与创作' },
  { label: '略感疲惫', value: '略感疲惫', indicator: '需补充能量或短暂休息' },
  { label: '焦虑紧绷', value: '焦虑紧绷', indicator: '建议进行呼吸/冥想调节' },
  { label: '情绪低落', value: '情绪低落', indicator: '关注自身需求，避免高压任务' },
  { label: '亢奋躁动', value: '亢奋躁动', indicator: '警惕过度激活，安排舒缓活动' },
];

const stressLevelMarks = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1}`,
  value: i + 1,
  indicator: i < 3 ? '轻松' : i < 6 ? '中等' : i < 8 ? '较高' : '高压'
}));

export default function EnhancedDailyCheckIn({ initialProfile, initialLogs }: EnhancedDailyCheckInProps) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [logs, setLogs] = useState<DailyWellnessLog[]>(initialLogs || []);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayLog = useMemo(() => logs.find((log) => log.log_date === todayKey) || null, [logs, todayKey]);

  // 表单状态
  const [formState, setFormState] = useState({
    sleepDuration: '',
    sleepQuality: '',
    exerciseDuration: '',
    exerciseType: '',  // 新增：运动类型
    moodStatus: '',
    stressLevel: '',
    notes: '',
  });

  // 保存成功后显示活动环
  const [showActivityRing, setShowActivityRing] = useState(false);

  // 运动类型列表
  const exerciseTypes = [
    { id: 'running', name: '跑步', icon: '🏃' },
    { id: 'walking', name: '步行', icon: '🚶' },
    { id: 'cycling', name: '骑行', icon: '🚴' },
    { id: 'swimming', name: '游泳', icon: '🏊' },
    { id: 'strength', name: '力量训练', icon: '🏋️' },
    { id: 'yoga', name: '瑜伽', icon: '🧘' },
    { id: 'hiit', name: 'HIIT', icon: '⚡' },
    { id: 'other', name: '其他', icon: '🎯' },
  ];

  // 语音识别状态
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    isRecording: false,
    transcript: '',
    isProcessing: false
  });

  // 其他状态
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');

  // 贝叶斯信心统计
  const weeklyConfidence = useMemo(() => {
    return getCurrentWeekConfidence(logs);
  }, [logs]);

  // Web Speech API 引用
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setVoiceRecording(prev => ({
          ...prev,
          transcript: transcript
        }));
      };

      recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error);
        setToast(`语音识别失败: ${event.error}`);
        setVoiceRecording(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: false
        }));
      };

      recognition.onend = () => {
        setVoiceRecording(prev => ({
          ...prev,
          isRecording: false
        }));
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 填充今日已有数据
  useEffect(() => {
    if (todayLog) {
      setFormState({
        sleepDuration: todayLog.sleep_duration_minutes?.toString() || '',
        sleepQuality: todayLog.sleep_quality || '',
        exerciseDuration: todayLog.exercise_duration_minutes?.toString() || '',
        exerciseType: (todayLog as any).exercise_type || '',  // 加载运动类型
        moodStatus: todayLog.mood_status || '',
        stressLevel: todayLog.stress_level?.toString() || '',
        notes: todayLog.notes || '',
      });
      // 如果今天已有记录，显示活动环
      setShowActivityRing(true);
    }
  }, [todayLog]);

  // Toast自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 开始/停止语音录制
  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      setToast('您的浏览器不支持语音识别功能');
      return;
    }

    if (voiceRecording.isRecording) {
      recognitionRef.current.stop();
      setVoiceRecording(prev => ({
        ...prev,
        isRecording: false
      }));
    } else {
      recognitionRef.current.start();
      setVoiceRecording(prev => ({
        ...prev,
        isRecording: true,
        transcript: ''
      }));
    }
  };

  // AI处理语音输入
  const processVoiceInput = async () => {
    if (!voiceRecording.transcript.trim()) return;

    setVoiceRecording(prev => ({ ...prev, isProcessing: true }));

    try {
      // 调用AI分析语音内容
      const response = await fetch('/api/ai/analyze-voice-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: voiceRecording.transcript,
          currentFormState: formState
        }),
      });

      if (!response.ok) {
        throw new Error('AI分析失败');
      }

      const result = await response.json();

      // 更新表单数据
      if (result.formUpdates) {
        setFormState(prev => ({
          ...prev,
          ...result.formUpdates
        }));
      }

      // 设置AI总结
      if (result.summary) {
        setAiSummary(result.summary);
      }

      setToast('✅ 语音内容已智能解析并填入表单');

    } catch (error) {
      console.error('AI处理语音输入失败:', error);
      setToast('AI分析失败，请手动填写表单');
    } finally {
      setVoiceRecording(prev => ({
        ...prev,
        isProcessing: false,
        transcript: ''
      }));
    }
  };

  // 保存日志
  const handleSaveLog = async () => {
    if (!initialProfile?.id) return;
    setIsSaving(true);
    setToast(null);

    const payload = {
      user_id: initialProfile.id,
      log_date: todayKey,
      sleep_duration_minutes: formState.sleepDuration ? Number(formState.sleepDuration) : null,
      sleep_quality: formState.sleepQuality || null,
      exercise_duration_minutes: formState.exerciseDuration ? Number(formState.exerciseDuration) : null,
      exercise_type: formState.exerciseType || null,  // 保存运动类型
      mood_status: formState.moodStatus || null,
      stress_level: formState.stressLevel ? Number(formState.stressLevel) : null,
      notes: formState.notes || null,
    };

    const { data, error } = await supabase
      .from('daily_wellness_logs')
      .upsert(payload, { onConflict: 'user_id,log_date' })
      .select()
      .single();

    if (error) {
      setToast(`保存失败：${error.message || '请稍后重试'}`);
      setIsSaving(false);
      return;
    }

    setLogs((prev) => {
      const otherLogs = prev.filter((log) => log.log_date !== todayKey);
      return [data, ...otherLogs].sort((a, b) => (a.log_date < b.log_date ? 1 : -1));
    });

    setToast('✅ 保存成功！数据已更新');
    setShowActivityRing(true);  // 显示活动环
    setIsSaving(false);

    // 后台刷新：让 AI 建议/文章推荐跟随今日数据更新
    fetch('/api/user/refresh', { method: 'POST' }).catch(() => { });
    fetch('/api/user/profile-sync', { method: 'POST' }).catch(() => { });

    // 延迟跳转，让用户看到活动环
    setTimeout(() => {
      router.push('/landing');
    }, 2000);
  };

  const updateFormField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 font-sans text-[#0B3D2E]">
      <div className="max-w-2xl mx-auto">

        {/* 贝叶斯信心统计卡片 */}
        {weeklyConfidence && (
          <AnimatedSection className="mb-6">
            <div className="bg-white rounded-xl border border-[#E7E1D6] p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getConfidenceIcon(weeklyConfidence.confidence.reliabilityLevel)}</span>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#0B3D2E]">贝叶斯信心统计</h3>
                    <p className="text-xs font-mono text-[#0B3D2E]/60 uppercase tracking-wider">本周数据可信度分析</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(weeklyConfidence.confidence.reliabilityLevel)}`}>
                    {formatConfidencePercentage(weeklyConfidence.confidence.overall)}
                  </div>
                  <div className="text-xs text-[#0B3D2E]/50">
                    {weeklyConfidence.confidence.sampleSize}天数据
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs font-mono uppercase tracking-wide text-[#0B3D2E]/50 mb-1">数据完整度</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.dataCompleteness)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono uppercase tracking-wide text-[#0B3D2E]/50 mb-1">一致性</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.consistency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono uppercase tracking-wide text-[#0B3D2E]/50 mb-1">趋势稳定性</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.weeklyTrend)}
                  </div>
                </div>
              </div>

              {weeklyConfidence.insights.length > 0 && (
                <div className="bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3D2E]">洞察建议</span>
                  </div>
                  <ul className="space-y-1">
                    {weeklyConfidence.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-[#0B3D2E]/70 font-medium">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* 语音输入区域 */}
        <AnimatedSection className="mb-6">
          <div className="bg-white rounded-xl border border-[#E7E1D6] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-6 h-6 text-[#0B3D2E]" />
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B3D2E]">AI语音助理</h3>
                <p className="text-xs font-mono text-[#0B3D2E]/60 uppercase tracking-wider">描述您今天的睡眠、运动、心情状态</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={toggleVoiceRecording}
                disabled={voiceRecording.isProcessing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${voiceRecording.isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-[#0B3D2E] text-white hover:bg-[#0a3629] shadow-sm'
                  } disabled:opacity-50`}
              >
                {voiceRecording.isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>停止录制</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>开始录制</span>
                  </>
                )}
              </button>

              {voiceRecording.transcript && (
                <button
                  onClick={processVoiceInput}
                  disabled={voiceRecording.isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold tracking-wide hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {voiceRecording.isProcessing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>AI分析中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>AI分析</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {voiceRecording.transcript && (
              <div className="bg-[#FAF6EF] rounded-lg border border-[#E7E1D6] p-4 mb-3">
                <div className="text-xs font-mono font-bold text-[#0B3D2E]/40 mb-2 uppercase">识别内容</div>
                <div className="text-[#0B3D2E] text-sm leading-relaxed">{voiceRecording.transcript}</div>
              </div>
            )}

            {aiSummary && (
              <div className="bg-[#F0F7FF] border border-blue-100 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">AI分析总结</span>
                </div>
                <div className="text-sm text-blue-900 leading-relaxed font-medium">{aiSummary}</div>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* 快速记录表单 - 简化版本 */}
        <AnimatedSection>
          <div className="bg-white rounded-xl border border-[#E7E1D6] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#E7E1D6] pb-4">
              <Calendar className="w-6 h-6 text-[#0B3D2E]" />
              <div>
                <h3 className="text-lg font-serif font-bold text-[#0B3D2E]">今日状态记录</h3>
                <p className="text-xs font-mono text-[#0B3D2E]/60 uppercase tracking-wider">
                  {new Date().toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* 睡眠时长 - 滑动条 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">
                  睡眠时长
                </label>
                <div className="px-1">
                  <Slider
                    min={180}
                    max={600}
                    step={30}
                    value={formState.sleepDuration ? Number(formState.sleepDuration) : 420}
                    onChange={(value) => updateFormField('sleepDuration', value.toString())}
                    formatValue={(v) => `${(v / 60).toFixed(1)} h`}
                    color="#0B3D2E"
                    marks={[
                      { value: 180, label: '3h' },
                      { value: 420, label: '7h' },
                      { value: 600, label: '10h' },
                    ]}
                  />
                </div>
              </div>

              {/* 睡眠质量 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">睡眠质量</label>
                <div className="grid grid-cols-2 gap-2">
                  {sleepQualityMarks.map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('sleepQuality', mark.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${formState.sleepQuality === mark.value
                        ? 'bg-[#0B3D2E] text-white shadow-md transform scale-[1.02]'
                        : 'bg-[#FAF6EF] border border-[#E7E1D6] text-[#0B3D2E] hover:border-[#0B3D2E]/30'
                        }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 运动时长 - 滑动条 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">运动时长</label>
                <div className="px-1">
                  <Slider
                    min={0}
                    max={120}
                    step={5}
                    value={formState.exerciseDuration ? Number(formState.exerciseDuration) : 0}
                    onChange={(value) => updateFormField('exerciseDuration', value.toString())}
                    formatValue={(v) => v === 0 ? '未运动' : `${v} min`}
                    color="#9CAF88"
                    marks={[
                      { value: 0, label: '0' },
                      { value: 60, label: '60m' },
                      { value: 120, label: '120m' },
                    ]}
                  />
                </div>
              </div>

              {/* 运动类型选择器 */}
              {Number(formState.exerciseDuration) > 0 && (
                <div>
                  <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">运动类型</label>
                  <div className="grid grid-cols-4 gap-2">
                    {exerciseTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => updateFormField('exerciseType', type.id)}
                        className={`p-3 rounded-lg text-center transition-all ${formState.exerciseType === type.id
                          ? 'bg-[#9CAF88] text-white shadow-md'
                          : 'bg-[#FAF6EF] border border-[#E7E1D6] text-[#0B3D2E] hover:border-[#0B3D2E]/30'
                          }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 心情状态 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">心情状态</label>
                <div className="grid grid-cols-2 gap-2">
                  {moodMarks.map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('moodStatus', mark.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${formState.moodStatus === mark.value
                        ? 'bg-[#0B3D2E] text-white shadow-md transform scale-[1.02]'
                        : 'bg-[#FAF6EF] border border-[#E7E1D6] text-[#0B3D2E] hover:border-[#0B3D2E]/30'
                        }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 压力等级 - 滑动条 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">
                  压力等级
                </label>
                <div className="px-1">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={formState.stressLevel ? Number(formState.stressLevel) : 5}
                    onChange={(value) => updateFormField('stressLevel', value.toString())}
                    formatValue={(v) => {
                      if (v <= 3) return `${v} - 轻松`;
                      if (v <= 6) return `${v} - 中等`;
                      if (v <= 8) return `${v} - 较高`;
                      return `${v} - 高压`;
                    }}
                    color={
                      Number(formState.stressLevel || 5) <= 3 ? '#10b981' :
                        Number(formState.stressLevel || 5) <= 6 ? '#f59e0b' : '#ef4444'
                    }
                    marks={[
                      { value: 1, label: '1' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' },
                    ]}
                  />
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-bold text-[#0B3D2E] mb-3 uppercase tracking-wider">其他备注</label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => updateFormField('notes', e.target.value)}
                  placeholder="记录其他感受、事件或观察..."
                  className="w-full p-4 bg-[#FAF6EF] border border-[#E7E1D6] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#0B3D2E] focus:border-[#0B3D2E]"
                  rows={3}
                />
              </div>
            </div>

            {/* 今日已记录提示 */}
            {todayLog && (
              <div className="mt-8 p-4 bg-[#0B3D2E]/5 border border-[#0B3D2E]/10 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0B3D2E] flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-[#0B3D2E] text-sm">今日已记录</div>
                  <div className="text-xs text-[#0B3D2E]/70">修改后重新保存即可更新。</div>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <div className="mt-8 pt-6 border-t border-[#E7E1D6]">
              <button
                onClick={handleSaveLog}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B3D2E] text-white rounded-lg font-bold hover:bg-[#0a3629] transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Battery className="w-5 h-5" />
                    <span>{todayLog ? '更新今日数据' : '保存今日数据'}</span>
                  </>
                )}
              </button>
            </div>

            {/* 活动环展示 - 保存成功后显示 */}
            {showActivityRing && todayLog && (
              <div className="mt-6 p-6 bg-white border border-[#E7E1D6] rounded-xl shadow-sm">
                <h4 className="text-center text-lg font-serif font-bold text-[#0B3D2E] mb-4">今日活动概览</h4>
                <div className="flex justify-center">
                  <ActivityRing
                    {...calculateRingPercentages(todayLog)}
                    size="md"
                    showLabels={true}
                    animated={true}
                  />
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Toast通知 */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-[#0B3D2E] text-white px-6 py-3 rounded-xl shadow-lg font-medium border border-[#E7E1D6]/20">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
