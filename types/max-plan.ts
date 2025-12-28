/**
 * Max Plan Creation Dialog Types
 * 
 * Max 协助制定计划对话系统的类型定义
 * 用于对话式计划制定、数据聚合和 AI 生成
 */

// ============================================
// 对话消息类型
// ============================================

/** 消息角色 */
export type MessageRole = 'max' | 'user' | 'system';

/** 对话消息 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  options?: QuickReplyOption[];
}

/** 快速回复选项 */
export interface QuickReplyOption {
  label: string;
  value: string;
}

// ============================================
// 计划项类型
// ============================================

/** 难度等级 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/** 计划类别 */
export type PlanCategory = 'sleep' | 'stress' | 'fitness' | 'nutrition' | 'mental' | 'habits';

/** 计划项草稿 */
export interface PlanItemDraft {
  id: string;
  title: string;
  action: string;
  rationale: string;
  difficulty: DifficultyLevel;
  category: PlanCategory;
  isReplacing?: boolean;
}

// ============================================
// 对话状态类型
// ============================================

/** 对话阶段 */
export type DialogPhase = 
  | 'loading'      // 加载中
  | 'analyzing'    // 分析数据
  | 'questioning'  // 主动问询
  | 'generating'   // 生成计划
  | 'reviewing'    // 用户审核
  | 'saving';      // 保存中

/** 数据状态 */
export interface DataStatus {
  hasInquiryData: boolean;
  hasCalibrationData: boolean;
  hasHrvData: boolean;
  inquirySummary?: string;
  calibrationSummary?: string;
  hrvSummary?: string;
  lastInquiryDate?: string;
  lastCalibrationDate?: string;
}

/** 对话状态 */
export interface DialogState {
  phase: DialogPhase;
  messages: ChatMessage[];
  planItems: PlanItemDraft[];
  userResponses: Record<string, string>;
  dataStatus: DataStatus;
  questionCount: number;
  error?: string;
}

// ============================================
// 会话类型
// ============================================

/** 计划会话 */
export interface PlanSession {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  state: DialogState;
  userData: {
    inquiry: InquiryData | null;
    calibration: CalibrationData | null;
    hrv: HrvData | null;
    profile: UserProfileData | null;
  };
}

// ============================================
// 数据聚合类型
// ============================================

/** 问询数据 */
export interface InquiryData {
  id: string;
  userId: string;
  topic: string;
  responses: Record<string, string>;
  extractedIndicators: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** 校准数据 */
export interface CalibrationData {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  moodScore: number;
  stressLevel: number;
  energyLevel: number;
}

/** HRV 数据 */
export interface HrvData {
  date: string;
  avgHrv: number;
  minHrv: number;
  maxHrv: number;
  restingHr: number;
  hrvTrend: 'improving' | 'stable' | 'declining';
  source: string;
}

/** 用户画像数据 */
export interface UserProfileData {
  gender?: string;
  age?: number;
  primaryConcern?: string;
  healthGoals?: Array<{ goal_text: string; category: string }>;
  healthConcerns?: string[];
  lifestyleFactors?: {
    sleepHours?: number;
    exerciseFrequency?: string;
    stressLevel?: string;
  };
  recentMoodTrend?: 'improving' | 'stable' | 'declining';
}

/** 聚合的用户数据 */
export interface AggregatedPlanData {
  userId: string;
  inquiry: InquiryData | null;
  calibration: CalibrationData | null;
  hrv: HrvData | null;
  profile: UserProfileData | null;
  dataStatus: DataStatus;
}

// ============================================
// API 请求/响应类型
// ============================================

/** 计划对话动作 */
export type PlanChatAction = 'init' | 'respond' | 'generate' | 'skip';

/** 计划对话请求 */
export interface PlanChatRequest {
  action: PlanChatAction;
  message?: string;
  sessionId?: string;
  questionId?: string;
  /** 语言偏好（会话锁定） */
  language?: 'zh' | 'en';
}

/** 下一步动作 */
export type NextAction = 'question' | 'generate' | 'review' | 'complete';

/** 计划对话响应 */
export interface PlanChatResponse {
  success: boolean;
  sessionId: string;
  messages: ChatMessage[];
  planItems?: PlanItemDraft[];
  dataStatus: DataStatus;
  nextAction: NextAction;
  error?: string;
}

/** 计划替换请求 */
export interface PlanReplaceRequest {
  itemId: string;
  currentItem: PlanItemDraft;
  sessionId: string;
  /** 语言偏好（会话锁定） */
  language?: 'zh' | 'en';
}

/** 计划替换响应 */
export interface PlanReplaceResponse {
  success: boolean;
  newItem: PlanItemDraft;
  error?: string;
}

/** 计划保存请求 */
export interface PlanSaveRequest {
  sessionId: string;
  title: string;
  items: PlanItemDraft[];
}

/** 计划保存响应 */
export interface PlanSaveResponse {
  success: boolean;
  planId?: string;
  error?: string;
}

// ============================================
// 问题生成类型
// ============================================

/** 问题类型 */
export type QuestionType = 'concern' | 'sleep' | 'stress' | 'energy' | 'mood' | 'goal' | 'lifestyle' | 'exercise';

/** 生成的问题 */
export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: QuickReplyOption[];
  priority: number;
}

/** 问题生成上下文 */
export interface QuestionContext {
  missingData: QuestionType[];
  userProfile: UserProfileData | null;
  language: 'zh' | 'en';
}

// ============================================
// 历史计划类型
// ============================================

/** 历史计划项 */
export interface HistoryPlanItem {
  id: string;
  text: string;
  completed: boolean;
}

/** 历史计划 */
export interface HistoryPlan {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  items: HistoryPlanItem[];
  createdAt: string;
  completedAt?: string;
}

/** 历史计划列表响应 */
export interface HistoryPlansResponse {
  success: boolean;
  plans: HistoryPlan[];
  total: number;
}
