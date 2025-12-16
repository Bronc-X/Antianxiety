export type RoleType = 'user' | 'assistant' | 'system';

export interface AIAnalysisResult {
  confidence_score?: number;
  risk_factors?: string[];
  [key: string]: unknown;
}

export interface MicroHabit {
  name?: string;
  name_en?: string;
  cue?: string;
  cue_en?: string;
  response?: string;
  response_en?: string;
  timing?: string;
  timing_en?: string;
  rationale?: string;
  rationale_en?: string;
}

export interface AIRecommendationPlan {
  micro_habits?: MicroHabit[];
  [key: string]: unknown;
}

export interface AIAssistantProfile {
  id?: string;
  full_name?: string | null;
  nickname?: string | null;
  preferred_name?: string | null;
  username?: string | null;
  email?: string | null;
  habit_memory_summary?: string | string[];
  habit_focus?: string[];
  latest_habit_note?: string | null;
  ai_analysis_result?: AIAnalysisResult | null;
  ai_recommendation_plan?: AIRecommendationPlan | null;
  location?: string | null;
  [key: string]: unknown;
}

export interface ConversationRow {
  role: RoleType;
  content: string;
  created_at: string;
}

