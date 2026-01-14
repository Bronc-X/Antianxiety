'use client';

import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedSection from '@/components/AnimatedSection';
import { useCalibrationLog } from '@/hooks/domain/useCalibrationLog';
import { useProfile } from '@/hooks/domain/useProfile';

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

interface DailyCheckInPanelProps {
  initialProfile: DailyCheckInProfile;
  initialLogs: DailyWellnessLog[];
}

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

const sleepQualityLabelMap = sleepQualityMarks.reduce<Record<string, string>>((acc, mark) => {
  acc[mark.value] = mark.label;
  return acc;
}, {});

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

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
  } catch {
    return dateString;
  }
};

export default function DailyCheckInPanel({ initialProfile, initialLogs }: DailyCheckInPanelProps) {
  const router = useRouter();
  const {
    today,
    history,
    isLoading,
    isSaving: isSavingLog,
    error: logError,
    loadToday,
    loadHistory,
    save,
  } = useCalibrationLog();
  const {
    isLoading: isProfileLoading,
    error: profileError,
    update,
  } = useProfile();
  const [logs, setLogs] = useState<DailyWellnessLog[]>(initialLogs || []);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayLog = useMemo(() => logs.find((log) => log.log_date === todayKey) || null, [logs, todayKey]);

  useEffect(() => {
    loadHistory(7);
    loadToday();
  }, [loadHistory, loadToday]);

  useEffect(() => {
    if (!history.length && !today) return;
    const normalizedHistory = history as unknown as DailyWellnessLog[];
    const normalizedToday = today as unknown as DailyWellnessLog | null;
    const historyWithoutToday = normalizedToday
      ? normalizedHistory.filter((log) => log.log_date !== normalizedToday.log_date)
      : normalizedHistory;
    const mergedLogs = normalizedToday ? [normalizedToday, ...historyWithoutToday] : historyWithoutToday;
    const timer = setTimeout(() => {
      setLogs(mergedLogs);
    }, 0);
    return () => clearTimeout(timer);
  }, [history, today]);

  const [formState, setFormState] = useState({
    sleepDuration: '',
    sleepQuality: '',
    exerciseDuration: '',
    moodStatus: '',
    stressLevel: '',
    notes: '',
  });
  const [reminderTime, setReminderTime] = useState(
    initialProfile?.daily_checkin_time ? (initialProfile.daily_checkin_time as string).slice(0, 5) : ''
  );

  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hasPromptedRef = useRef(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const isPending = isLoading || isProfileLoading;
  const combinedError = logError || profileError;

  useEffect(() => {
    startTransition(() => {
      setCurrentTimestamp(Date.now());
    });
  }, [todayLog, reminderTime]);

  const shouldPrompt = useMemo(() => {
    if (todayLog) return false;
    if (!reminderTime) return true;
    const [hours, minutes] = reminderTime.split(':').map((item) => Number(item));
    const reminderMoment = new Date();
    reminderMoment.setHours(hours, minutes, 0, 0);
    return currentTimestamp >= reminderMoment.getTime();
  }, [currentTimestamp, todayLog, reminderTime]);

  useEffect(() => {
    const fallbackSleepMinutes = initialProfile?.sleep_hours ? Number(initialProfile.sleep_hours) * 60 : '';
    const nextState = todayLog
      ? {
        sleepDuration: todayLog.sleep_duration_minutes !== null ? String(todayLog.sleep_duration_minutes) : '',
        sleepQuality: todayLog.sleep_quality || '',
        exerciseDuration:
          todayLog.exercise_duration_minutes !== null ? String(todayLog.exercise_duration_minutes) : '',
        moodStatus: todayLog.mood_status || '',
        stressLevel: todayLog.stress_level !== null ? String(todayLog.stress_level) : '',
        notes: todayLog.notes || '',
      }
      : {
        sleepDuration: fallbackSleepMinutes ? String(Math.round(fallbackSleepMinutes / 30) * 30) : '',
        sleepQuality: '',
        exerciseDuration: '',
        moodStatus: '',
        stressLevel: initialProfile?.stress_level ? String(initialProfile.stress_level) : '',
        notes: '',
      };
    startTransition(() => {
      setFormState(nextState);
    });
  }, [todayLog, initialProfile?.sleep_hours, initialProfile?.stress_level]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (shouldPrompt && !hasPromptedRef.current) {
      startTransition(() => {
        setToast('提醒：按照设定的时间记录今日状态，以便持续更新你的生理基线。');
      });
      hasPromptedRef.current = true;
    }
  }, [shouldPrompt]);

  const updateFormField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLog = async () => {
    setToast(null);

    const payload = {
      sleep_duration_minutes: formState.sleepDuration ? Number(formState.sleepDuration) : null,
      sleep_quality: formState.sleepQuality || null,
      exercise_duration_minutes: formState.exerciseDuration ? Number(formState.exerciseDuration) : null,
      mood_status: formState.moodStatus || null,
      stress_level: formState.stressLevel ? Number(formState.stressLevel) : null,
      notes: formState.notes || null,
    };

    console.log('=== 保存每日记录 ===');
    console.log('保存 payload:', payload);

    const saved = await save(payload);

    if (!saved) {
      setToast(`保存失败：${logError || '请稍后重试'}`);
      return;
    }

    console.log('保存成功:', saved);

    setToast('✅ 保存成功！即将返回主页...');

    // 保存成功后返回首页
    setTimeout(() => {
      router.push('/unlearn');
    }, 1500);
  };

  const handleUpdateReminder = async () => {
    setIsUpdatingReminder(true);
    setToast(null);

    const success = await update({
      daily_checkin_time: reminderTime ? `${reminderTime}:00` : null,
    });

    if (!success) {
      console.error('更新提醒时间失败:', profileError);
      setToast('提醒时间更新失败，请稍后重试。');
      setIsUpdatingReminder(false);
      return;
    }

    setToast(reminderTime ? `提醒时间已设置为 ${reminderTime}` : '提醒时间已清除。');
    setIsUpdatingReminder(false);
  };

  const historyLogs = useMemo(
    () =>
      logs
        .filter((log) => log.log_date !== todayKey)
        .sort((a, b) => (a.log_date < b.log_date ? 1 : -1))
        .slice(0, 6),
    [logs, todayKey]
  );

  return (
    <AnimatedSection inView variant="fadeUp" className="mb-8">
      <div
        className={`rounded-2xl border ${shouldPrompt ? 'border-[#0B3D2E]' : 'border-[#E7E1D6]'
          } bg-white p-6 shadow-sm transition-shadow duration-300 ${isPending ? 'animate-pulse' : ''}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#0B3D2E]">今日生理信号记录</h2>
            <p className="mt-1 text-xs font-mono text-[#0B3D2E]/70 uppercase tracking-wide">
              按照设置的提醒时间，快速记录生理状态。
            </p>
          </div>
          <div className="flex flex-col items-end text-xs font-mono text-[#0B3D2E]/50">
            <span>DATE: {formatDate(todayKey)}</span>
            {todayLog?.updated_at && (
              <span>
                UPDATED: {new Date(todayLog.updated_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {toast && (
          <div className="mt-4 rounded-lg border border-[#0B3D2E]/20 bg-[#0B3D2E]/5 px-4 py-3 text-sm text-[#0B3D2E]">
            {toast}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">睡眠时长</label>
              <div className="rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  type="range"
                  min={0}
                  max={sleepDurationMarks.length - 1}
                  step={1}
                  value={
                    Math.max(
                      0,
                      sleepDurationMarks.findIndex(
                        (mark) => String(mark.value) === formState.sleepDuration
                      )
                    )
                  }
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    const mark = sleepDurationMarks[index];
                    updateFormField('sleepDuration', mark ? String(mark.value) : '');
                  }}
                  className="w-full accent-[#0B3D2E]"
                />
                <div className="mt-3 flex justify-between text-[10px] text-[#0B3D2E]/60">
                  {sleepDurationMarks.map((mark, index) => (
                    <span key={mark.value} className={index % 2 === 0 ? 'block' : 'hidden sm:block'}>
                      {mark.label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-[#0B3D2E]/10 bg-white px-3 py-2 text-xs text-[#0B3D2E]">
                  <span className="font-semibold">
                    {(() => {
                      const index = sleepDurationMarks.findIndex(
                        (mark) => String(mark.value) === formState.sleepDuration
                      );
                      const mark =
                        index >= 0
                          ? sleepDurationMarks[index]
                          : sleepDurationMarks[Math.floor(sleepDurationMarks.length / 2)];
                      return `${mark.label} · ${mark.indicator}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">睡眠评分</label>
              <div className="rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  type="range"
                  min={0}
                  max={sleepQualityMarks.length - 1}
                  step={1}
                  value={
                    Math.max(
                      0,
                      sleepQualityMarks.findIndex(
                        (mark) => mark.value === formState.sleepQuality
                      )
                    )
                  }
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    const mark = sleepQualityMarks[index];
                    updateFormField('sleepQuality', mark ? mark.value : '');
                  }}
                  className="w-full accent-[#0B3D2E]"
                />
                <div className="mt-3 flex justify-between text-[10px] text-[#0B3D2E]/60">
                  {sleepQualityMarks.map((mark) => (
                    <span key={mark.value}>{mark.label}</span>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-[#0B3D2E]/10 bg-white px-3 py-2 text-xs text-[#0B3D2E]">
                  <span className="font-semibold">
                    {(() => {
                      const index = sleepQualityMarks.findIndex(
                        (mark) => mark.value === formState.sleepQuality
                      );
                      const mark =
                        index >= 0
                          ? sleepQualityMarks[index]
                          : sleepQualityMarks[Math.floor(sleepQualityMarks.length / 2)];
                      return `${mark.label} · ${mark.indicator}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">运动时长</label>
              <div className="rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  type="range"
                  min={0}
                  max={exerciseDurationMarks.length - 1}
                  step={1}
                  value={
                    Math.max(
                      0,
                      exerciseDurationMarks.findIndex(
                        (mark) => String(mark.value) === formState.exerciseDuration
                      )
                    )
                  }
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    const mark = exerciseDurationMarks[index];
                    updateFormField('exerciseDuration', mark ? String(mark.value) : '');
                  }}
                  className="w-full accent-[#0B3D2E]"
                />
                <div className="mt-3 flex justify-between text-[10px] text-[#0B3D2E]/60">
                  {exerciseDurationMarks.map((mark, index) => (
                    <span key={mark.value} className={index % 2 === 0 ? 'block' : 'hidden sm:block'}>
                      {mark.label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-[#0B3D2E]/10 bg-white px-3 py-2 text-xs text-[#0B3D2E]">
                  <span className="font-semibold">
                    {(() => {
                      const index = exerciseDurationMarks.findIndex(
                        (mark) => String(mark.value) === formState.exerciseDuration
                      );
                      const mark =
                        index >= 0
                          ? exerciseDurationMarks[index]
                          : exerciseDurationMarks[0];
                      return `${mark.label} · ${mark.indicator}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">心情状态</label>
              <div className="rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  type="range"
                  min={0}
                  max={moodMarks.length - 1}
                  step={1}
                  value={
                    Math.max(
                      0,
                      moodMarks.findIndex((mark) => mark.value === formState.moodStatus)
                    )
                  }
                  onChange={(event) => {
                    const index = Number(event.target.value);
                    const mark = moodMarks[index];
                    updateFormField('moodStatus', mark ? mark.value : '');
                  }}
                  className="w-full accent-[#0B3D2E]"
                />
                <div className="mt-3 flex justify-between text-[10px] text-[#0B3D2E]/60">
                  {moodMarks.map((mark) => (
                    <span key={mark.value} className="text-center">
                      {mark.label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 rounded-md border border-[#0B3D2E]/10 bg-white px-3 py-2 text-xs text-[#0B3D2E]">
                  <span className="font-semibold">
                    {(() => {
                      const index = moodMarks.findIndex((mark) => mark.value === formState.moodStatus);
                      const mark =
                        index >= 0 ? moodMarks[index] : moodMarks[Math.floor(moodMarks.length / 2)];
                      return `${mark.label} · ${mark.indicator}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">压力等级（1-10）</label>
              <div className="rounded-lg border border-[#E7E1D6] bg-[#FFFDF8] px-4 py-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={formState.stressLevel ? Number(formState.stressLevel) : 5}
                  onChange={(event) => updateFormField('stressLevel', event.target.value)}
                  className="w-full accent-[#0B3D2E]"
                />
                <div className="mt-3 flex justify-between text-[10px] text-[#0B3D2E]/60">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
                <div className="mt-3 rounded-md border border-[#0B3D2E]/10 bg-white px-3 py-2 text-xs text-[#0B3D2E]">
                  <span className="font-semibold">
                    {formState.stressLevel
                      ? `当前压力指数：${formState.stressLevel} / 10`
                      : '滑动以选择今日的压力感受'}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#0B3D2E]/60">
                7 以上意味着你的皮质醇可能处于高位，建议进行最低阻力的缓解动作。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3D2E] mb-2">额外备注（可选）</label>
              <textarea
                value={formState.notes}
                onChange={(event) => updateFormField('notes', event.target.value)}
                rows={3}
                placeholder="记录任何你认为重要的触发因素或生理反馈……"
                className="w-full rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#0B3D2E]">提醒时间</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              onBlur={handleUpdateReminder}
              className="rounded-md border border-[#E7E1D6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20"
            />
            <button
              type="button"
              onClick={handleUpdateReminder}
              disabled={isUpdatingReminder}
              className="rounded-md border border-[#0B3D2E]/30 px-3 py-1.5 text-xs font-medium text-[#0B3D2E] transition-colors hover:border-[#0B3D2E] hover:bg-[#FAF6EF] disabled:opacity-60"
            >
              {isUpdatingReminder ? '保存中…' : '保存提醒'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSaveLog}
            disabled={isSavingLog}
            className="rounded-md bg-gradient-to-r from-[#0b3d2e] via-[#0a3427] to-[#06261c] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
          >
            {isSavingLog ? '保存中…' : '保存今日记录'}
          </button>
        </div>

        {historyLogs.length > 0 && (
          <div className="mt-8 rounded-xl border border-[#E7E1D6] bg-[#FAF6EF] p-4">
            <h3 className="text-sm font-semibold text-[#0B3D2E]">最近记录</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {historyLogs.map((log) => (
                <div key={log.log_date} className="rounded-lg border border-[#0B3D2E]/10 bg-white px-4 py-3 text-sm text-[#0B3D2E]/80">
                  <div className="flex items-center justify-between text-xs text-[#0B3D2E]/60">
                    <span>{formatDate(log.log_date)}</span>
                    {log.updated_at && (
                      <span>{new Date(log.updated_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <p>
                      睡眠：
                      {log.sleep_duration_minutes
                        ? `${Math.round((log.sleep_duration_minutes / 60) * 10) / 10} 小时`
                        : '—'}{' '}
                      · {log.sleep_quality ? sleepQualityLabelMap[log.sleep_quality] || '—' : '—'}
                    </p>
                    <p>运动：{log.exercise_duration_minutes ? `${log.exercise_duration_minutes} 分钟` : '—'} · 心情：{log.mood_status || '—'}</p>
                    <p>压力：{log.stress_level ? `${log.stress_level}/10` : '—'}</p>
                    {log.notes && <p className="text-xs text-[#0B3D2E]/60">备注：{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {combinedError && (
          <div className="mt-6 text-sm text-red-600">{combinedError}</div>
        )}
      </div>
    </AnimatedSection>
  );
}


