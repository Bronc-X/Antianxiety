'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { autoGroupData } from '@/lib/chartUtils';

// 动态导入图表组件，减少 bundle 大小
const BeliefScoreChart = dynamic(
  () => import('./BeliefScoreChart'),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center text-[#0B3D2E]/60">
        加载图表中...
      </div>
    ),
    ssr: false,
  }
);
import AnimatedSection from './AnimatedSection';
import { trendingTopics } from '@/data/trendingTopics';
import type { TrendingTopic } from '@/data/trendingTopics';
import RefreshIcon from './RefreshIcon';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

// 扩展Window接口以支持requestIdleCallback（如果不存在）
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  (window as unknown as { requestIdleCallback: typeof requestIdleCallback }).requestIdleCallback = function(
    callback: IdleRequestCallback
  ) {
    const start = Date.now();
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1) as unknown as number;
  };
  
  (window as unknown as { cancelIdleCallback: typeof cancelIdleCallback }).cancelIdleCallback = function(handle: number) {
    clearTimeout(handle);
  };
}

interface HabitLogEntry {
  id: number;
  habit_id: number;
  completed_at: string;
  belief_score_snapshot: number;
}

interface DailyLogEntry {
  log_date: string;
  sleep_duration_minutes?: number | null;
  stress_level?: number | null;
  exercise_duration_minutes?: number | null;
}

interface MicroHabit {
  name?: string;
  cue?: string;
  response?: string;
  timing?: string;
  rationale?: string;
}

interface ProfileData {
  daily_checkin_time?: string | null;
  body_function_score?: number | string | null;
  sleep_hours?: number | string | null;
  stress_level?: number | string | null;
  energy_level?: number | string | null;
  exercise_frequency?: string | null;
  chronic_conditions?: string[] | null;
  primary_focus_topics?: string[] | null;
  reminder_preferences?: Record<string, ReminderPreference> & { ai_auto_mode?: boolean };
  ai_analysis_result?: {
    metabolic_rate_estimate?: string;
    cortisol_pattern?: string;
    sleep_quality?: string;
    recovery_capacity?: string;
    stress_resilience?: string;
    risk_factors?: string[];
  };
  ai_recommendation_plan?: {
    micro_habits?: MicroHabit[];
  };
}

interface ReminderPreference {
  enabled: boolean;
  mode: 'manual' | 'ai';
  time?: string;
  dose?: string;
}

interface PersonalizedLandingContentProps {
  habitLogs: HabitLogEntry[];
  profile: ProfileData | null;
  dailyLogs: DailyLogEntry[];
}

// 今日提醒面板组件
function TodayRemindersPanel({ profile }: { profile: ProfileData | null }) {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [reminderTimeMode, setReminderTimeMode] = useState<'manual' | 'ai'>('manual');
  const [manualTime, setManualTime] = useState(profile?.daily_checkin_time ? (profile.daily_checkin_time as string).slice(0, 5) : '09:00');
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [aiAutoMode, setAiAutoMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activities = [
    { id: 'water', label: '💧 喝水' },
    { id: 'rest', label: '😌 小憩' },
    { id: 'slow_walk', label: '🚶 慢走' },
    { id: 'walk', label: '🏃 步行' },
    { id: 'exercise', label: '💪 运动' },
  ];

  const toggleActivity = (id: string) => {
    if (aiAutoMode) return; // AI自动模式下不允许手动选择
    setSelectedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEnableAIAuto = () => {
    if (aiAutoMode) {
      // 如果已启用，点击后取消
      setAiAutoMode(false);
      setSelectedActivities(new Set());
      setReminderTimeMode('manual');
    } else {
      // 如果未启用，点击后启用
      setAiAutoMode(true);
      setSelectedActivities(new Set(activities.map(a => a.id)));
      setReminderTimeMode('ai');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveMessage('请先登录');
        setIsSaving(false);
        return;
      }

      const todayReminders = {
        reminder_time_mode: reminderTimeMode,
        manual_time: reminderTimeMode === 'manual' ? manualTime : null,
        selected_activities: Array.from(selectedActivities),
        ai_auto_mode: aiAutoMode,
        last_updated: new Date().toISOString(),
      };

      const updateData: {
        reminder_preferences: typeof todayReminders;
        daily_checkin_time?: string;
      } = {
        reminder_preferences: todayReminders,
      };

      if (reminderTimeMode === 'manual' && manualTime) {
        updateData.daily_checkin_time = `${manualTime}:00`;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        setSaveMessage(`保存失败: ${updateError.message}`);
        setIsSaving(false);
        return;
      }

      setSaveMessage('保存成功！今日提醒已设置。');
      setTimeout(() => {
        setSaveMessage(null);
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('保存提醒设置时出错:', err);
      setSaveMessage('保存时发生错误，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#0B3D2E]/10 bg-gradient-to-br from-[#F5F1E8] to-[#FAF6EF] p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0B3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#0B3D2E]">AI Bio-Rhythm Intervention</h3>
              <p className="text-xs text-[#0B3D2E]/60">生物节律自动干预</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#0B3D2E]/70 leading-relaxed">
            When enabled, AI will nudge you with the <span className="font-semibold text-[#0B3D2E]">ONE optimal action</span> based on your real-time fatigue levels. No setup required.
          </p>
        </div>

        {/* AI Auto-Pilot Toggle */}
        <div className="rounded-xl border border-[#0B3D2E]/20 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0B3D2E] mb-1">
                {aiAutoMode ? '✨ AI Auto-Pilot is Active' : 'AI Auto-Pilot'}
              </p>
              <p className="text-xs text-[#0B3D2E]/60">
                {aiAutoMode 
                  ? '根据你的实时疲劳水平，智能推送最优行动' 
                  : '点击启用，让AI为你选择最佳干预时机'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnableAIAuto}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:ring-offset-2 ${
                aiAutoMode ? 'bg-[#0B3D2E]' : 'bg-[#E7E1D6]'
              }`}
              role="switch"
              aria-checked={aiAutoMode}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  aiAutoMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {aiAutoMode && (
          <div className="rounded-lg bg-[#0B3D2E]/5 border border-[#0B3D2E]/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#0B3D2E] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-[#0B3D2E] font-medium mb-1">自动模式已启用</p>
                <p className="text-xs text-[#0B3D2E]/70 leading-relaxed">
                  AI将自动分析你的睡眠、压力和能量水平，在最佳时机推送单一最优化行动建议（如：5分钟慢走、补充水分等）。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            saveMessage.includes('成功') 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}

export default function PersonalizedLandingContent({
  habitLogs,
  profile,
  dailyLogs,
}: PersonalizedLandingContentProps) {
  const [chartData, setChartData] = useState<{ period: string; averageScore: number }[]>([]);
  const [csvTopics, setCsvTopics] = useState<TrendingTopic[]>([]);
  const [topics, setTopics] = useState<Array<{
    id: string;
    source: 'Reddit' | 'X';
    title: string;
    summary: string;
    tags: string[];
    community?: string;
    author?: string;
    url: string;
    baseScore: number;
    overlapTags: string[];
    matchScore: number;
  }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hiddenTopicIds, setHiddenTopicIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 如果没有数据或数据不足，使用模拟的6周数据
    if (!habitLogs || habitLogs.length === 0) {
      // 使用模拟的6周数据，格式为 "0周", "1周", ... "5周"
      const mockData = [50, 53, 51, 54, 56, 59].map((score, i) => ({
        period: `${i}周`,
        averageScore: score,
      }));
      setChartData(mockData);
    } else {
      // 如果有数据，但数据点少于6个，也使用模拟数据（因为实际数据格式可能不匹配）
      const { beliefData } = autoGroupData(habitLogs);
      // 如果数据点少于6个，使用模拟数据
      if (beliefData.length < 6) {
        const mockData = [50, 53, 51, 54, 56, 59].map((score, i) => ({
          period: `${i}周`,
          averageScore: score,
        }));
        setChartData(mockData);
      } else {
        // 如果数据足够，但需要转换为"周"格式
        // 取前6个数据点，并转换为"0周"、"1周"格式
        const convertedData = beliefData.slice(0, 6).map((item, i) => ({
          period: `${i}周`,
          averageScore: item.averageScore,
        }));
        setChartData(convertedData);
      }
    }
  }, [habitLogs]);

  const clampScore = (value: number) => Math.min(100, Math.max(0, value));

  // 解析 CSV（轻量，无第三方库）
  const parseCsv = useCallback((text: string): Record<string, string>[] => {
    const rows: Record<string, string>[] = [];
    // 按行切分，保留引号中的换行
    // 简易解析：逐字符读取，按 RFC4180 处理双引号
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === '\n' && !inQuotes) {
        lines.push(current);
        current = '';
      } else if (char === '\r') {
        // ignore, handled by \n
      } else {
        current += char;
      }
    }
    if (current.length > 0) lines.push(current);
    if (lines.length === 0) return rows;
    const splitRow = (line: string): string[] => {
      const values: string[] = [];
      let buf = '';
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        const nx = line[i + 1];
        if (ch === '"') {
          if (quoted && nx === '"') {
            buf += '"';
            i += 1;
          } else {
            quoted = !quoted;
          }
        } else if (ch === ',' && !quoted) {
          values.push(buf);
          buf = '';
        } else {
          buf += ch;
        }
      }
      values.push(buf);
      return values.map(v => v.trim());
    };
    // 使用健壮的split解析表头，防止逗号在引号内
    const header = splitRow(lines[0]).map(h => h.trim());
    for (let li = 1; li < lines.length; li += 1) {
      if (!lines[li]) continue;
      const cols = splitRow(lines[li]);
      const rec: Record<string, string> = {};
      header.forEach((key, idx) => {
        rec[key] = cols[idx] ?? '';
      });
      rows.push(rec);
    }
    return rows;
  }, []);

  // 将 CSV 推文映射为 TrendingTopic
  const mapTweetToTopic = useCallback((r: Record<string, string>): TrendingTopic | null => {
    const id = r.id || r.tweetURL || '';
    if (!id) return null;
    const text = (r.tweetText || '').replace(/\s+/g, ' ').trim();
    const url = r.tweetURL || '';
    const author = (r.handle || r.tweetAuthor || '').trim();
    // 生成标题：截取第一句/前50字
    const sentenceEnd = Math.max(text.indexOf('。'), text.indexOf('.'));
    const title = (sentenceEnd > 0 ? text.slice(0, sentenceEnd) : text).slice(0, 80) || '来自 X 的健康话题';
    // 摘要：后续80-160字
    const summary = (text.length > title.length ? text.slice(title.length).trim() : text).slice(0, 160);
    // 简单关键词映射标签
    const tagPool: Array<{ kw: RegExp; tag: string }> = [
      { kw: /睡|失眠|褪黑|睡眠|昼夜|节律/i, tag: '睡眠与昼夜节律' },
      { kw: /压力|皮质醇|焦虑|抑郁|情绪/i, tag: '压力水平与皮质醇' },
      { kw: /健身|步|训练|运动|HRV|脂肪|减肥|体重/i, tag: '健身策略' },
      { kw: /饮食|营养|维生素|矿物|肠道|蜂蜜|茶氨酸|镁/i, tag: '营养优化' },
      { kw: /激素|荷尔蒙|甲状腺|睾酮|雌激素/i, tag: '荷尔蒙与激素平衡' },
      { kw: /长寿|老化|衰老/i, tag: '老化与长寿' },
      { kw: /社交|人际|关系/i, tag: '人际关系焦虑' },
      { kw: /多巴胺|奖励|成瘾/i, tag: '多巴胺/奖励机制' },
    ];
    const tags = Array.from(new Set(tagPool.filter(t => t.kw.test(text)).map(t => t.tag)));
    // 参与度 -> baseScore (3.8 - 4.8)
    const likes = Number(r.likeCount || 0);
    const rts = Number(r.retweetCount || 0);
    const quotes = Number(r.quoteCount || 0);
    const views = Number(r.views || 0);
    const engagement = likes * 3 + rts * 5 + quotes * 4 + Math.min(views / 500, 50);
    const norm = Math.max(0, Math.min(1, engagement / 200)); // 简易归一化
    const baseScore = Number((3.8 + norm * (4.8 - 3.8)).toFixed(1));
    return {
      id: `xcsv-${id}`,
      source: 'X',
      author: author || undefined,
      community: undefined,
      title: title || 'X 热议',
      summary: summary || title || 'X 热议',
      tags: tags.length > 0 ? tags : ['营养优化'],
      url: url || '#',
      baseScore,
    };
  }, []);

  // 加载 public/tweets.csv 并并入候选池
  useEffect(() => {
    let cancelled = false;
    const loadCsv = async () => {
      try {
        // 仅在 /landing 页面尝试加载 CSV
        if (typeof window !== 'undefined') {
          const path = window.location?.pathname || '';
          if (!path.startsWith('/landing')) {
            return;
          }
        }
        // 增加超时防护，避免请求卡死
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/tweets.csv', { cache: 'no-store', signal: controller.signal }).catch(() => null);
        clearTimeout(timeout);
        if (!res || !res.ok) return;
        // 过大文件直接跳过，避免前端阻塞
        const cl = res.headers.get('content-length');
        if (cl && Number(cl) > 2_000_000) {
          return;
        }
        const text = await res.text();
        // 文本过大保护
        if (text.length > 2_000_000) {
          return;
        }
        let rows: Record<string, string>[] = [];
        const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        try {
          rows = parseCsv(text);
        } catch {
          rows = [];
        }
        const duration = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - start;
        // 若解析耗时过长，则放弃并使用内置池
        if (duration > 300) {
          return;
        }
        const mapped: TrendingTopic[] = [];
        // 限制最大并入条数，防止前端卡顿（进一步收紧为100）
        const limit = Math.min(rows.length, 100);
        for (let i = 0; i < limit; i += 1) {
          const r = rows[i];
          const t = mapTweetToTopic(r);
          if (t) mapped.push(t);
        }
        if (!cancelled) {
          // 去重：避免与内置池 id 冲突
          const builtinIds = new Set(trendingTopics.map(t => t.id));
          const uniq = mapped.filter(m => !builtinIds.has(m.id));
          setCsvTopics(uniq);
        }
      } catch {
        // 静默失败，保持内置数据
        // console.warn('加载 tweets.csv 失败', e);
      }
    };
    // 延迟到首帧之后执行，避免阻塞首次渲染
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        if (!cancelled) loadCsv();
      }, { timeout: 1000 });
    } else {
      setTimeout(() => {
        if (!cancelled) loadCsv();
      }, 0);
    }
    return () => {
      cancelled = true;
    };
  }, [parseCsv, mapTweetToTopic]);

  // 合并候选池：内置 + CSV
  const combinedTopics: TrendingTopic[] = useMemo(() => {
    // 去重合并
    const map = new Map<string, TrendingTopic>();
    trendingTopics.forEach(t => map.set(t.id, t));
    csvTopics.forEach(t => map.set(t.id, t));
    return Array.from(map.values());
  }, [csvTopics]);

  const bodyFunctionScore = useMemo(() => {
    const rawScore = profile?.body_function_score;
    // 如果数据库中有body_function_score且不为0，使用它
    if (rawScore !== undefined && rawScore !== null && !Number.isNaN(Number(rawScore)) && Number(rawScore) > 0) {
      return clampScore(Number(rawScore));
    }

    // 如果没有body_function_score或为0，从profile数据计算
    let score = 50; // 默认50%，用于演示水填满效果

    const sleepHours = profile?.sleep_hours ? Number(profile.sleep_hours) : null;
    if (sleepHours) {
      if (sleepHours >= 7) score += 12;
      else if (sleepHours >= 6) score += 6;
      else score -= 8;
    }

    const stressLevel = profile?.stress_level ? Number(profile.stress_level) : null;
    if (stressLevel) {
      if (stressLevel >= 7) score -= 12;
      else if (stressLevel >= 5) score -= 6;
      else score += 4;
    }

    const energyLevel = profile?.energy_level ? Number(profile.energy_level) : null;
    if (energyLevel) {
      if (energyLevel >= 7) score += 8;
      else if (energyLevel <= 4) score -= 6;
    }

    const exerciseFrequency = profile?.exercise_frequency as string | undefined;
    if (exerciseFrequency) {
      if (['每周4-5次', '每周6-7次', '每天多次'].includes(exerciseFrequency)) {
        score += 8;
      } else if (exerciseFrequency === '每周2-3次') {
        score += 4;
      } else if (exerciseFrequency === '几乎不运动') {
        score -= 8;
      }
    }

    const chronicConditions = Array.isArray(profile?.chronic_conditions) ? profile.chronic_conditions : [];
    if (chronicConditions.length > 0) {
      score -= Math.min(12, chronicConditions.length * 4);
    }

    // 确保返回值在0-100范围内，最小值为50（用于演示）
    const finalScore = clampScore(score);
    // 如果计算出来的分数太小（小于50），至少显示50%用于演示效果
    return Math.max(50, finalScore);
  }, [
    profile?.body_function_score,
    profile?.sleep_hours,
    profile?.stress_level,
    profile?.energy_level,
    profile?.exercise_frequency,
    profile?.chronic_conditions,
  ]);

  const scoreLabel = useMemo(() => {
    if (bodyFunctionScore >= 85) return '状态极佳，保持你的节奏。';
    if (bodyFunctionScore >= 70) return '状态良好，继续巩固核心习惯。';
    if (bodyFunctionScore >= 55) return '需要关注恢复与压力管理。';
    return '警惕持续的高压与睡眠不足，优先处理焦虑触发点。';
  }, [bodyFunctionScore]);

  const focusTopics: string[] = useMemo(() => {
    if (Array.isArray(profile?.primary_focus_topics)) {
      return profile.primary_focus_topics;
    }
    return [];
  }, [profile?.primary_focus_topics]);

  // 确保bodyFunctionScore在0-100范围内，并计算水的高度
  const waterLevel = Math.max(0, Math.min(100, bodyFunctionScore));
  const waterHeight = Math.max(0, (240 * waterLevel) / 100);

  const chronicConditions = useMemo(() => {
    if (Array.isArray(profile?.chronic_conditions)) {
      return profile.chronic_conditions.filter((item: string) => item !== '无');
    }
    return [];
  }, [profile?.chronic_conditions]);

  const sleepSummary = profile?.sleep_hours
    ? `${Number(profile.sleep_hours).toFixed(1).replace(/\.0$/, '')} 小时`
    : '待记录';
  const stressSummary = profile?.stress_level ? `${profile.stress_level} / 10` : '待记录';
  const energySummary = profile?.energy_level ? `${profile.energy_level} / 10` : '待记录';
  const exerciseSummary = profile?.exercise_frequency || '待填写';

  const lastSevenDates = useMemo(() => {
    const dates: string[] = [];
    const base = new Date();
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(base);
      date.setDate(base.getDate() - index);
      dates.push(date.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const dailyStats = useMemo(() => {
    if (!dailyLogs || dailyLogs.length === 0) {
      return {
        completionRate: 0,
        averageSleepHours: null as number | null,
        averageStress: null as number | null,
      };
    }

    let completionCount = 0;
    let sleepSum = 0;
    let sleepCount = 0;
    let stressSum = 0;
    let stressCount = 0;

    const logMap = new Map<string, DailyLogEntry>(dailyLogs.map((log) => [log.log_date, log]));

    lastSevenDates.forEach((dateKey) => {
      const log = logMap.get(dateKey);
      if (log) {
        completionCount += 1;
        if (typeof log.sleep_duration_minutes === 'number' && log.sleep_duration_minutes > 0) {
          sleepSum += log.sleep_duration_minutes / 60;
          sleepCount += 1;
        }
        if (typeof log.stress_level === 'number' && log.stress_level > 0) {
          stressSum += log.stress_level;
          stressCount += 1;
        }
      }
    });

    return {
      completionRate: Math.round((completionCount / lastSevenDates.length) * 100),
      averageSleepHours: sleepCount > 0 ? Number((sleepSum / sleepCount).toFixed(1)) : null,
      averageStress: stressCount > 0 ? Number((stressSum / stressCount).toFixed(1)) : null,
    };
  }, [dailyLogs, lastSevenDates]);

  // 计算匹配分数并筛选帖子的函数
  const calculateMatchedTopics = useCallback((excludeIds: Set<string> = new Set(), currentDisplayedIds: Set<string> = new Set()) => {
    const focusSet = new Set(focusTopics);
    // 排除已隐藏和当前已显示的帖子
    const availableTopics = combinedTopics.filter(
      (topic) => !excludeIds.has(topic.id) && !currentDisplayedIds.has(topic.id)
    );
    
    const scored = availableTopics
      .map((topic) => {
        const overlapTags = topic.tags.filter((tag) => focusSet.has(tag));
        let score = topic.baseScore + overlapTags.length * 0.25;

        if (dailyStats.averageStress !== null && dailyStats.averageStress >= 7 && topic.tags.includes('压力水平与皮质醇')) {
          score += 0.25;
        }
        if (dailyStats.averageSleepHours !== null && dailyStats.averageSleepHours < 6.5 && topic.tags.includes('睡眠与昼夜节律')) {
          score += 0.2;
        }
        if (bodyFunctionScore < 60 && topic.tags.some((tag) => ['老化与长寿', '荷尔蒙与激素平衡', '营养优化'].includes(tag))) {
          score += 0.15;
        }
        if (bodyFunctionScore >= 80 && topic.tags.includes('健身策略')) {
          score += 0.1;
        }

        const matchScore = Math.min(5, Math.max(3.5, Number(score.toFixed(1))));

        return {
          ...topic,
          overlapTags,
          matchScore,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    
    return scored;
  }, [focusTopics, dailyStats.averageStress, dailyStats.averageSleepHours, bodyFunctionScore, combinedTopics]);

  const matchedTopics = useMemo(() => {
    // 先根据阈值过滤（> 4.6），不足时回退
    const calculated = calculateMatchedTopics(hiddenTopicIds, new Set());
    const filtered = calculated.filter(t => t.matchScore > 4.6);
    const source = filtered.length >= 6 ? filtered : calculated;
    // 返回6条（用于三排两列）
    if (source.length < 6) {
      const allAvailable = calculateMatchedTopics(hiddenTopicIds, new Set());
      const allFiltered = allAvailable.filter(t => t.matchScore > 4.6);
      const fallback = (allFiltered.length >= 6 ? allFiltered : allAvailable);
      return fallback.slice(0, 6);
    }
    return source.slice(0, 6);
  }, [calculateMatchedTopics, hiddenTopicIds]);

  useEffect(() => {
    if (matchedTopics.length === 0) {
      return;
    }

    setTopics((prev) => {
      if (prev.length === matchedTopics.length) {
        const prevIds = prev.map((item) => item.id);
        const nextIds = matchedTopics.map((item) => item.id);
        const isSame =
          prevIds.length === nextIds.length &&
          prevIds.every((id, index) => id === nextIds[index]);
        if (isSame) {
          return prev;
        }
      }
      return matchedTopics;
    });
  }, [matchedTopics]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // 刷新时，清除当前显示的帖子ID，从剩余帖子中选择新的（排除已隐藏的），优先取>4.6
    setTimeout(() => {
      const currentIds = new Set(topics.map(t => t.id));
      const allAvailable = calculateMatchedTopics(hiddenTopicIds, currentIds);
      const allFiltered = allAvailable.filter(t => t.matchScore > 4.6);
      const newTopics = (allFiltered.length >= 6 ? allFiltered : allAvailable).slice(0, 6);
      // 确保至少有6条帖子
      if (newTopics.length >= 6) {
        setTopics(newTopics);
      } else {
        // 如果不足6条，显示所有可用的
        setTopics(newTopics);
      }
      setIsRefreshing(false);
    }, 500);
  }, [calculateMatchedTopics, hiddenTopicIds, topics]);

  // 生成个性化建议
  const getPersonalizedAdvice = () => {
    const advice: string[] = [];

    if (profile?.ai_analysis_result) {
      const analysis = profile.ai_analysis_result;

      if (analysis.cortisol_pattern === 'elevated') {
        advice.push('你的皮质醇水平较高，建议在感到压力时进行5分钟步行来代谢压力激素。');
      }

      if (analysis.sleep_quality === 'poor') {
        advice.push('你的睡眠质量需要改善，建议晚上9点后调暗灯光，停止使用电子设备。');
      }

      if (analysis.recovery_capacity === 'low') {
        advice.push('你的恢复能力较低，建议进行10分钟轻度运动（如拉伸、慢走），避免高强度训练。');
      }

      if (analysis.risk_factors && analysis.risk_factors.length > 0) {
        if (analysis.risk_factors.includes('睡眠不足')) {
          advice.push('关注睡眠时长，确保每晚7-9小时的睡眠。');
        }
        if (analysis.risk_factors.includes('高压力水平')) {
          advice.push('压力管理很重要，尝试在感到焦虑时进行深呼吸练习。');
        }
      }
    }

    if (profile?.ai_recommendation_plan?.micro_habits) {
      const habits = profile.ai_recommendation_plan.micro_habits;
      if (habits.length > 0) {
        advice.push(`你已定制了 ${habits.length} 个微习惯，记住关注"信念强度"而非完成率。`);
      }
    }

    if (advice.length === 0) {
      advice.push('继续关注你的生理信号，记住：我们不对抗真相，与真相和解。');
    }

    return advice;
  };

  const personalizedAdvice = getPersonalizedAdvice();

  return (
    <>
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F392B] mb-2">Trends & Insights</h2>
        <p className="text-sm text-[#1F2937]/70 leading-relaxed">
          观察长期趋势有助于稀释短期焦虑。Seeing long-term trends helps dilute short-term anxiety.
        </p>
      </div>

      {/* Weekly Highlight & Optimization Nudge Cards */}
      <AnimatedSection inView variant="fadeUp" className="mb-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Card: Weekly Highlight (Positive Reinforcement) */}
          <div className="rounded-3xl border border-[#0F392B]/10 bg-gradient-to-br from-emerald-50 to-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800 mb-2">
                  Weekly Highlight
                </h3>
                <p className="text-base text-[#1F2937] leading-relaxed font-medium">
                  {(() => {
                    const lastSevenLogs = dailyLogs.filter(log => {
                      const logDate = new Date(log.log_date);
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      return logDate >= sevenDaysAgo;
                    });

                    const sleepGoalDays = lastSevenLogs.filter(log => 
                      log.sleep_duration_minutes && log.sleep_duration_minutes / 60 >= 7
                    ).length;

                    if (sleepGoalDays >= 5) {
                      return `本周高光：连续${sleepGoalDays}天达成睡眠目标！`;
                    }

                    const lowStressDays = lastSevenLogs.filter(log => 
                      log.stress_level && log.stress_level < 5
                    ).length;

                    if (lowStressDays >= 4) {
                      return `本周高光：${lowStressDays}天保持低压力状态！`;
                    }

                    const exerciseDays = lastSevenLogs.filter(log => 
                      log.exercise_duration_minutes && log.exercise_duration_minutes >= 20
                    ).length;

                    if (exerciseDays >= 3) {
                      return `本周高光：完成${exerciseDays}次有效运动！`;
                    }

                    return '继续积累，你的每一个努力都在复利。';
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Card: Optimization Nudge (Gentle Attribution) */}
          <div className="rounded-3xl border border-[#0F392B]/10 bg-gradient-to-br from-amber-50 to-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-800 mb-2">
                  Optimization Nudge
                </h3>
                <p className="text-base text-[#1F2937] leading-relaxed font-medium">
                  {(() => {
                    const lastSevenLogs = dailyLogs.filter(log => {
                      const logDate = new Date(log.log_date);
                      const sevenDaysAgo = new Date();
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      return logDate >= sevenDaysAgo;
                    });

                    const stressSum = lastSevenLogs.reduce((sum, log) => 
                      log.stress_level ? sum + log.stress_level : sum, 0);
                    const stressCount = lastSevenLogs.filter(log => log.stress_level).length;
                    const avgStress = stressCount > 0 ? stressSum / stressCount : null;

                    if (avgStress !== null && avgStress >= 7) {
                      return '优化建议：压力水平上升，可能是因为咖啡因摄入过晚？';
                    }

                    const sleepSum = lastSevenLogs.reduce((sum, log) => 
                      log.sleep_duration_minutes ? sum + (log.sleep_duration_minutes / 60) : sum, 0);
                    const sleepCount = lastSevenLogs.filter(log => log.sleep_duration_minutes).length;
                    const avgSleep = sleepCount > 0 ? sleepSum / sleepCount : null;

                    if (avgSleep !== null && avgSleep < 6.5) {
                      return '优化建议：睡眠不足，建议晚上9点后降低蓝光曝露。';
                    }

                    return '保持当前节奏，你的指标处于良好范围。';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection inView variant="fadeUp" className="mt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#0B3D2E]/10 bg-gradient-to-br from-[#F5F1E8] to-[#FAF6EF] p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0B3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#0B3D2E]">Current Body Mode</h3>
                    <p className="text-xs text-[#0B3D2E]/60">当前身体状态</p>
                  </div>
                </div>
              </div>

              {/* Energy Wave Animation */}
              <div className="relative h-32 rounded-xl bg-white/50 border border-[#0B3D2E]/10 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0B3D2E" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M0 ${120 - (bodyFunctionScore * 0.8)} Q100 ${120 - (bodyFunctionScore * 1.0)} 200 ${120 - (bodyFunctionScore * 0.8)} T400 ${120 - (bodyFunctionScore * 0.8)} V120 H0 Z`}
                    fill="url(#waveGradient)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-widest text-[#0B3D2E]/50 mb-1">Energy Level</p>
                    <p className="text-2xl font-semibold text-[#0B3D2E]">
                      {(() => {
                        if (bodyFunctionScore >= 85) return "🔥 High Performance";
                        if (bodyFunctionScore >= 70) return "✨ Balanced";
                        if (bodyFunctionScore >= 55) return "🌿 Recovery Focus";
                        return "💆 Deep Rest Mode";
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Single Actionable Advice */}
              <div className="rounded-xl border border-[#0B3D2E]/20 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0B3D2E]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0B3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-[#0B3D2E]/60 mb-1">Recommended Action</p>
                    <p className="text-sm text-[#0B3D2E] leading-relaxed">
                      {(() => {
                        const sleepHours = profile?.sleep_hours ? Number(profile.sleep_hours) : null;
                        const stressLevel = profile?.stress_level ? Number(profile.stress_level) : null;
                        const energyLevel = profile?.energy_level ? Number(profile.energy_level) : null;

                        // 找出最低的指标并给出单一建议
                        if (sleepHours !== null && sleepHours < 6) {
                          return "🌙 Focus on Sleep tonight to recharge. Aim for 7-8 hours to support recovery and metabolic health.";
                        }
                        if (stressLevel !== null && stressLevel >= 7) {
                          return "🚶 Take a 5-minute slow walk to metabolize cortisol. Your stress hormones are elevated.";
                        }
                        if (energyLevel !== null && energyLevel <= 4) {
                          return "🧘 10-minute gentle stretching or meditation. Low energy signals need for active recovery.";
                        }
                        if (bodyFunctionScore < 60) {
                          return "💧 Prioritize hydration and light movement. Small actions compound into significant recovery.";
                        }
                        return "✅ Maintain your current rhythm. Your body is in a stable state. Keep consistent with sleep and stress management.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 提醒板块 - 今日提醒 */}
          <TodayRemindersPanel profile={profile} />

        </div>
      </AnimatedSection>

      {/* 个人习惯记录曲线 */}
        <AnimatedSection inView variant="fadeUp" className="mt-8">
          <BeliefScoreChart data={chartData} />
        </AnimatedSection>

      {/* 个性化建议 - AI助理对话感 */}
      {personalizedAdvice.length > 0 && (
        <AnimatedSection inView variant="fadeUp" className="mt-8">
          <div className="rounded-lg border border-[#E7E1D6] bg-gradient-to-br from-[#FFFDF8] to-white p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#0B3D2E] mb-2">为你定制的建议</h3>
                <div className="space-y-4">
              {personalizedAdvice.map((item, index) => (
                    <div key={index} className="relative pl-4 border-l-2 border-[#0B3D2E]/20">
                      <p className="text-sm leading-relaxed text-[#0B3D2E]/90">
                        {index === 0 && personalizedAdvice.length > 1 ? (
                          <>
                            我注意到你的数据中有一些值得关注的点。{item}
                          </>
                        ) : (
                          item
                        )}
                      </p>
                    </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {topics.length > 0 && (
        <AnimatedSection inView variant="fadeUp" className="mt-8">
          <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0B3D2E]">高赞生理话题匹配</h3>
                <p className="text-sm text-[#0B3D2E]/70">
                  过滤噪音，向你推荐通过计算，推送内容符合与你的改善计划高度相关的科学讨论与数据洞察。
                </p>
              </div>
              <div className="flex items-center gap-3">
              <div className="rounded-full border border-[#0B3D2E]/20 bg-[#FAF6EF] px-4 py-1.5 text-xs uppercase tracking-widest text-[#0B3D2E]/60">
                  匹配度 ＞ 4.6 星
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 text-[#0B3D2E] hover:text-[#0B3D2E]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="刷新话题"
                >
                  <RefreshIcon isSpinning={isRefreshing} className="text-[#0B3D2E]" />
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {topics.map((topic) => (
                <div key={topic.id} data-topic-id={topic.id} className="group relative flex h-full flex-col gap-3 rounded-xl border border-[#E7E1D6] bg-[#FFFDF8] p-5 transition hover:border-[#0B3D2E]/30 hover:shadow-md">
                  <button
                    onClick={() => {
                      // 将当前帖子添加到隐藏列表
                      const newHiddenIds = new Set(hiddenTopicIds);
                      newHiddenIds.add(topic.id);
                      setHiddenTopicIds(newHiddenIds);
                      
                      // 从当前显示的帖子中移除
                      // 从剩余帖子中选择新的替换（排除已隐藏和当前显示的）
                      const currentIds = new Set(topics.map(t => t.id));
                      currentIds.delete(topic.id);
                      const availableTopics = calculateMatchedTopics(newHiddenIds, currentIds);
                      const replacement = availableTopics.slice(0, 1);
                      
                      if (replacement.length > 0) {
                        // 替换当前帖子，保持至少4条
                        const updatedTopics = topics.map(t => 
                          t.id === topic.id ? replacement[0] : t
                        );
                        setTopics(updatedTopics);
                      } else {
                        // 如果没有可替换的，尝试从所有可用帖子中选择（排除已隐藏的）
                        const allAvailable = calculateMatchedTopics(newHiddenIds, new Set());
                        const alternative = allAvailable.find(t => !currentIds.has(t.id));
                        if (alternative) {
                          const updatedTopics = topics.map(t => 
                            t.id === topic.id ? alternative : t
                          );
                          setTopics(updatedTopics);
                        } else {
                          // 如果确实没有可替换的，直接移除（但会少于4条）
                          const updatedTopics = topics.filter(t => t.id !== topic.id);
                          setTopics(updatedTopics);
                        }
                      }
                    }}
                    className="absolute top-3 right-3 text-xs text-[#0B3D2E]/50 hover:text-[#0B3D2E] transition-colors"
                    title="类似话题不再推荐"
                  >
                    ✕
                  </button>
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest pr-8">
                    <span className="font-semibold text-[#0B3D2E]">
                      {topic.source === 'Reddit' ? topic.community || 'Reddit' : topic.author || 'X 热议'}
                    </span>
                    <span className="text-[#0B3D2E]/50">{topic.source}</span>
                  </div>
                  <h4 className="text-base font-semibold text-[#0B3D2E]">{topic.title}</h4>
                  <p className="text-sm text-[#0B3D2E]/70">{topic.summary}</p>
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#0B3D2E]/60">
                      <span>匹配度</span>
                      <span className="font-medium text-[#0B3D2E]">{topic.matchScore.toFixed(1)} / 5</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E7E1D6]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c]"
                        style={{ width: `${(topic.matchScore / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topic.overlapTags.length > 0 ? (
                      topic.overlapTags.map((tag) => (
                        <span key={tag} className="rounded-full border border-[#0B3D2E]/30 bg-white px-3 py-1 text-xs text-[#0B3D2E]">
                          {tag}
                        </span>
                      ))
                    ) : (
                      topic.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-[#0B3D2E]/10 bg-white px-3 py-1 text-xs text-[#0B3D2E]/70">
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <a
                      href={topic.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-medium text-[#0B3D2E] transition group-hover:text-[#0B3D2E]/80"
                    >
                      查看原帖 →
                    </a>
                    <button
                      onClick={() => {
                        // 将当前帖子添加到隐藏列表
                        const newHiddenIds = new Set(hiddenTopicIds);
                        newHiddenIds.add(topic.id);
                        setHiddenTopicIds(newHiddenIds);
                        
                        // 从当前显示的帖子中移除
                        const currentIds = new Set(topics.map(t => t.id));
                        currentIds.delete(topic.id);
                        // 从剩余帖子中选择新的替换（排除已隐藏和当前显示的）
                        const availableTopics = calculateMatchedTopics(newHiddenIds, currentIds);
                        const replacement = availableTopics.slice(0, 1);
                        
                        if (replacement.length > 0) {
                          // 替换当前帖子，保持至少4条
                          const updatedTopics = topics.map(t => 
                            t.id === topic.id ? replacement[0] : t
                          );
                          setTopics(updatedTopics);
                        } else {
                          // 如果没有可替换的，尝试从所有可用帖子中选择（排除已隐藏的）
                          const allAvailable = calculateMatchedTopics(newHiddenIds, new Set());
                          const alternative = allAvailable.find(t => !currentIds.has(t.id));
                          if (alternative) {
                            const updatedTopics = topics.map(t => 
                              t.id === topic.id ? alternative : t
                            );
                            setTopics(updatedTopics);
                          } else {
                            // 如果确实没有可替换的，直接移除（但会少于4条）
                            const updatedTopics = topics.filter(t => t.id !== topic.id);
                            setTopics(updatedTopics);
                          }
                        }
                      }}
                      className="text-xs text-[#0B3D2E]/50 hover:text-[#0B3D2E] transition-colors"
                      title="类似话题不再推荐"
                    >
                      不再推荐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}
    </>
  );
}

