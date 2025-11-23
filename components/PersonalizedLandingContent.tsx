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
    <div className="rounded-2xl border border-[#E7E1D6] bg-gradient-to-br from-[#FFFDF8] to-[#FAF6EF] p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔔</span>
            <h3 className="text-lg font-semibold text-[#0B3D2E]">今日提醒</h3>
          </div>
          <p className="mt-1 text-sm text-[#0B3D2E]/70">
            选择你希望今天接收提醒的活动，选择后今天就会智能提醒。也可以启用AI自动提醒，无需手动选择。
          </p>
        </div>

        {/* 提醒时间设置 */}
        <div className="rounded-lg border border-[#E7E1D6] bg-white px-4 py-3">
          <label className="block text-sm font-medium text-[#0B3D2E] mb-3">提醒时间</label>
          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setReminderTimeMode('manual');
                setAiAutoMode(false);
              }}
              disabled={aiAutoMode}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                reminderTimeMode === 'manual' && !aiAutoMode
                  ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                  : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/40 disabled:opacity-50'
              }`}
            >
              用户自己设置
            </button>
            <button
              type="button"
              onClick={() => {
                setReminderTimeMode('ai');
                setAiAutoMode(false);
              }}
              disabled={aiAutoMode}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                reminderTimeMode === 'ai' && !aiAutoMode
                  ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                  : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/40 disabled:opacity-50'
              }`}
            >
              AI推送
            </button>
          </div>
          {reminderTimeMode === 'manual' && !aiAutoMode && (
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
            />
          )}
          {reminderTimeMode === 'ai' && !aiAutoMode && (
            <p className="text-xs text-[#0B3D2E]/60">
              AI将根据你的日常行为模式和生理信号，自动为你推送最适合的提醒时间。
            </p>
          )}
        </div>

        {/* 活动选择按钮 */}
        <div>
          <label className="block text-sm font-medium text-[#0B3D2E] mb-3">选择提醒活动</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {activities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                onClick={() => toggleActivity(activity.id)}
                disabled={aiAutoMode}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all ${
                  selectedActivities.has(activity.id) || aiAutoMode
                    ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                    : 'border-[#E7E1D6] bg-white text-[#0B3D2E] hover:border-[#0B3D2E]/40 disabled:opacity-50'
                }`}
              >
                {activity.label}
              </button>
            ))}
          </div>
          {selectedActivities.size > 0 && !aiAutoMode && (
            <p className="mt-2 text-xs text-[#0B3D2E]/60">
              已选择 {selectedActivities.size} 项，今天将智能提醒你这些活动
            </p>
          )}
          {aiAutoMode && (
            <p className="mt-2 text-xs text-[#0B3D2E]/60">
              AI将根据你的日常行为模式和生理信号，自动为你制定最适合的提醒时间和小计量。
            </p>
          )}
        </div>

        {/* 保存按钮和消息 */}
        {saveMessage && (
          <div className={`rounded-md px-4 py-2 text-sm ${
            saveMessage.includes('成功') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleEnableAIAuto}
            className={`flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
              aiAutoMode
                ? 'border-[#0B3D2E] bg-[#0B3D2E] text-white'
                : 'border-[#0B3D2E]/30 bg-white text-[#0B3D2E] hover:border-[#0B3D2E] hover:bg-[#FAF6EF]'
            }`}
          >
            {aiAutoMode ? '✓ AI自动提醒已启用' : '🤖 启用AI自动提醒'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (selectedActivities.size === 0 && !aiAutoMode)}
            className="flex-1 px-4 py-2 rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
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
      <AnimatedSection inView variant="fadeUp" className="mt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-60 w-28">
                  <svg width="120" height="240" viewBox="0 0 120 240" className="h-full w-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 61, 46, 0.1))' }}>
                  <defs>
                      {/* 人体轮廓clipPath */}
                      <clipPath id={`bodyClip-${bodyFunctionScore}`}>
                      <circle cx="60" cy="30" r="26" />
                      <rect x="35" y="52" width="50" height="70" rx="25" />
                      <rect x="42" y="120" width="36" height="90" rx="18" />
                    </clipPath>
                      {/* 水填充渐变 */}
                      <linearGradient id={`waterGradient-${bodyFunctionScore}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0B3D2E" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#0B3D2E" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                    
                    {/* 背景（浅色人体轮廓） */}
                    <g clipPath={`url(#bodyClip-${bodyFunctionScore})`}>
                      <rect width="120" height="240" fill="#0B3D2E" opacity="0.08" />
                    </g>
                    
                    {/* 水填充效果 - 从底部向上填充 */}
                    {waterHeight > 0 && (
                      <g clipPath={`url(#bodyClip-${bodyFunctionScore})`}>
                  <rect
                    x="0"
                          y={240 - waterHeight}
                    width="120"
                          height={waterHeight}
                          fill={`url(#waterGradient-${bodyFunctionScore})`}
                        />
                      </g>
                    )}
                    
                    {/* 人体轮廓线 */}
                    <circle cx="60" cy="30" r="26" fill="none" stroke="#0B3D2E" strokeWidth="2.5" opacity="0.4" />
                    <rect x="35" y="52" width="50" height="70" rx="25" fill="none" stroke="#0B3D2E" strokeWidth="2.5" opacity="0.4" />
                    <rect x="42" y="120" width="36" height="90" rx="18" fill="none" stroke="#0B3D2E" strokeWidth="2.5" opacity="0.4" />
                </svg>
                </div>
                {/* 得分和Body Score文字放在人体简图下方 */}
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-semibold text-[#0B3D2E]">{Math.round(bodyFunctionScore)}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#0B3D2E]/60 mt-0.5">Body Score</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#0B3D2E]">身体机能指数</h3>
                  <p className="mt-1 text-sm text-[#0B3D2E]/70">{scoreLabel}</p>
                </div>
                <ul className="space-y-2 text-sm text-[#0B3D2E]/80">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                    <span>睡眠节奏：{sleepSummary}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                    <span>压力等级：{stressSummary}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                    <span>能量充沛度：{energySummary}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B3D2E]" />
                    <span>运动频率：{exerciseSummary}</span>
                  </li>
                </ul>
                {chronicConditions.length > 0 && (
                  <div className="rounded-lg border border-[#E7E1D6] bg-[#FAF6EF] px-3 py-2 text-xs text-[#0B3D2E]/70">
                    <span className="font-medium text-[#0B3D2E]">基础状况：</span>
                    {chronicConditions.join('、')}
                  </div>
                )}
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

