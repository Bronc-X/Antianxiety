'use client';

import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Send, Sparkles, TrendingUp, Calendar, Clock, Battery, Lightbulb } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { calculateWeeklyBayesianConfidence, getCurrentWeekConfidence, formatConfidencePercentage, getConfidenceColor, getConfidenceIcon } from '@/lib/bayesian-confidence';

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
    moodStatus: '',
    stressLevel: '',
    notes: '',
  });

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
        moodStatus: todayLog.mood_status || '',
        stressLevel: todayLog.stress_level?.toString() || '',
        notes: todayLog.notes || '',
      });
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

    setToast('✅ 保存成功！数据已更新贝叶斯统计');
    setIsSaving(false);
    
    setTimeout(() => {
      router.push('/landing');
    }, 1500);
  };

  const updateFormField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6EF] to-[#F2F7F5] p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* 贝叶斯信心统计卡片 */}
        {weeklyConfidence && (
          <AnimatedSection className="mb-6">
            <div className="glass-card rounded-3xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getConfidenceIcon(weeklyConfidence.confidence.reliabilityLevel)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B3D2E]">贝叶斯信心统计</h3>
                    <p className="text-sm text-[#0B3D2E]/60">本周数据可信度分析</p>
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
                  <div className="text-sm text-[#0B3D2E]/60">数据完整度</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.dataCompleteness)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-[#0B3D2E]/60">一致性</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.consistency)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-[#0B3D2E]/60">趋势稳定性</div>
                  <div className="font-semibold text-[#0B3D2E]">
                    {formatConfidencePercentage(weeklyConfidence.confidence.weeklyTrend)}
                  </div>
                </div>
              </div>
              
              {weeklyConfidence.insights.length > 0 && (
                <div className="bg-[#0B3D2E]/5 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-[#0B3D2E]">洞察建议</span>
                  </div>
                  <ul className="space-y-1">
                    {weeklyConfidence.insights.map((insight, index) => (
                      <li key={index} className="text-sm text-[#0B3D2E]/70">
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
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-6 h-6 text-[#0B3D2E]" />
              <div>
                <h3 className="text-lg font-semibold text-[#0B3D2E]">AI语音助理</h3>
                <p className="text-sm text-[#0B3D2E]/60">描述您今天的睡眠、运动、心情状态</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={toggleVoiceRecording}
                disabled={voiceRecording.isProcessing}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
                  voiceRecording.isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-[#0B3D2E] text-white hover:bg-[#0B3D2E]/90'
                } disabled:opacity-50`}
              >
                {voiceRecording.isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>停止录制</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>开始录制</span>
                  </>
                )}
              </button>
              
              {voiceRecording.transcript && (
                <button
                  onClick={processVoiceInput}
                  disabled={voiceRecording.isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {voiceRecording.isProcessing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>AI分析中...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>AI分析</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {voiceRecording.transcript && (
              <div className="bg-[#0B3D2E]/5 rounded-2xl p-4">
                <div className="text-sm text-[#0B3D2E]/60 mb-2">识别内容：</div>
                <div className="text-[#0B3D2E]">{voiceRecording.transcript}</div>
              </div>
            )}
            
            {aiSummary && (
              <div className="bg-blue-50 rounded-2xl p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">AI分析总结</span>
                </div>
                <div className="text-sm text-blue-700">{aiSummary}</div>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* 快速记录表单 - 简化版本 */}
        <AnimatedSection>
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[#0B3D2E]" />
              <div>
                <h3 className="text-lg font-semibold text-[#0B3D2E]">今日状态记录</h3>
                <p className="text-sm text-[#0B3D2E]/60">
                  {new Date().toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long' 
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* 睡眠时长 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  睡眠时长 
                  {formState.sleepDuration && (
                    <span className="text-[#0B3D2E]/60">
                      ({(Number(formState.sleepDuration) / 60).toFixed(1)}小时)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {sleepDurationMarks.slice(1, -1).map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('sleepDuration', mark.value.toString())}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formState.sleepDuration === mark.value.toString()
                          ? 'bg-[#0B3D2E] text-white'
                          : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20'
                      }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 睡眠质量 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">睡眠质量</label>
                <div className="grid grid-cols-2 gap-2">
                  {sleepQualityMarks.map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('sleepQuality', mark.value)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formState.sleepQuality === mark.value
                          ? 'bg-[#0B3D2E] text-white'
                          : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20'
                      }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 运动时长 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">运动时长</label>
                <div className="grid grid-cols-3 gap-2">
                  {exerciseDurationMarks.slice(0, 6).map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('exerciseDuration', mark.value.toString())}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formState.exerciseDuration === mark.value.toString()
                          ? 'bg-[#0B3D2E] text-white'
                          : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20'
                      }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 心情状态 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">心情状态</label>
                <div className="grid grid-cols-2 gap-2">
                  {moodMarks.map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('moodStatus', mark.value)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formState.moodStatus === mark.value
                          ? 'bg-[#0B3D2E] text-white'
                          : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20'
                      }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 压力等级 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">
                  压力等级 (1=轻松 10=高压)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {stressLevelMarks.map((mark) => (
                    <button
                      key={mark.value}
                      onClick={() => updateFormField('stressLevel', mark.value.toString())}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formState.stressLevel === mark.value.toString()
                          ? 'bg-[#0B3D2E] text-white'
                          : 'bg-[#0B3D2E]/10 text-[#0B3D2E] hover:bg-[#0B3D2E]/20'
                      }`}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-[#0B3D2E] mb-3">其他备注</label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => updateFormField('notes', e.target.value)}
                  placeholder="记录其他感受、事件或观察..."
                  className="w-full p-4 bg-[#0B3D2E]/5 border border-[#0B3D2E]/10 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
                  rows={3}
                />
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="mt-8 pt-6 border-t border-[#0B3D2E]/10">
              <button
                onClick={handleSaveLog}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B3D2E] text-white rounded-2xl font-semibold hover:bg-[#0B3D2E]/90 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Battery className="w-5 h-5" />
                    <span>保存今日数据</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Toast通知 */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-[#0B3D2E] text-white px-6 py-3 rounded-2xl shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
