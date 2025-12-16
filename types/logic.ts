// types/logic.ts
export type UserMode = 'RECOVERY' | 'BALANCED' | 'PRIME';

export type TaskType = 'REST' | 'ACTIVE' | 'BALANCED' | 'BASELINE';

export type PrimaryConcern = 
  | 'weight_loss' 
  | 'stress_management' 
  | 'sleep_improvement' 
  | 'energy_boost'
  | 'muscle_gain'
  | 'strength'
  | 'general'
  | string 
  | null;

export interface EnrichedDailyLog {
  log_date: string;
  sleep_hours?: number | null;
  sleep_duration_minutes?: number | null;
  stress_level?: number | null;
  hrv?: number | null;
  exercise_duration_minutes?: number | null;
  [key: string]: any;
}

export interface UserStateAnalysis {
  mode: UserMode;
  label: string;
  color: string;
  batteryLevel: number;
  insight: string;
  permissionToRest: boolean;
}

export interface RecommendedTask {
  taskName: string;
  duration: string;
  icon: string;
  type: TaskType;
  reason: string;
  isBaseline?: boolean;  // 标记是否为基线任务（无日志数据时的默认任务）
}
