/**
 * Feed Curation Service
 * 
 * Curates personalized content for users based on their Phase Goals.
 * Implements relevance scoring and engagement tracking.
 * 
 * **Property 13: Feed Recommendation Relevance**
 * **Property 14: Feed Engagement Tracking**
 * **Property 15: Content Curation Pipeline**
 * **Property 16: Inactive User Curation Reduction**
 */

import type {
  CuratedContent,
  PhaseGoal,
  GoalType,
  ContentCurationResult,
} from '@/types/adaptive-interaction';

// Constants
export const RELEVANCE_THRESHOLD = 0.6;
export const INACTIVE_THRESHOLD_DAYS = 7;

// Goal to keyword mapping for content matching
const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  sleep: ['sleep', 'insomnia', 'circadian', 'melatonin', 'rest', '睡眠', '失眠', '褪黑素'],
  energy: ['energy', 'fatigue', 'metabolism', 'mitochondria', 'ATP', '能量', '疲劳', '代谢'],
  stress: ['stress', 'cortisol', 'anxiety', 'relaxation', 'HRV', '压力', '皮质醇', '焦虑'],
  weight: ['weight', 'obesity', 'metabolism', 'insulin', 'diet', '体重', '肥胖', '饮食'],
  fitness: ['exercise', 'fitness', 'muscle', 'cardio', 'strength', '运动', '健身', '肌肉'],
};

/**
 * Calculate relevance score for content against user goals
 */
export function calculateRelevanceScore(
  content: { title: string; summary?: string },
  phaseGoals: PhaseGoal[]
): { score: number; matchedGoals: GoalType[]; explanation: string } {
  if (phaseGoals.length === 0) {
    return { score: 0.3, matchedGoals: [], explanation: '没有设定目标' };
  }
  
  const text = `${content.title} ${content.summary || ''}`.toLowerCase();
  const matchedGoals: GoalType[] = [];
  let totalScore = 0;
  const explanations: string[] = [];
  
  for (const goal of phaseGoals) {
    const keywords = GOAL_KEYWORDS[goal.goal_type] || [];
    const matchedKeywords = keywords.filter(kw => text.includes(kw.toLowerCase()));
    
    if (matchedKeywords.length > 0) {
      matchedGoals.push(goal.goal_type);
      // Higher score for primary goal (priority 1)
      const goalWeight = goal.priority === 1 ? 1.5 : 1.0;
      const keywordScore = Math.min(matchedKeywords.length * 0.2, 0.6);
      totalScore += keywordScore * goalWeight;
      explanations.push(`与「${goal.title}」目标相关`);
    }
  }
  
  // Normalize score to 0-1 range
  const normalizedScore = Math.min(totalScore, 1);
  
  return {
    score: normalizedScore,
    matchedGoals,
    explanation: explanations.length > 0 
      ? explanations.join('，') 
      : '与当前目标关联度较低',
  };
}

/**
 * Check if content should be recommended
 */
export function isRecommendable(content: CuratedContent): boolean {
  return (
    content.relevance_score >= RELEVANCE_THRESHOLD &&
    content.relevance_explanation !== undefined &&
    content.relevance_explanation.length > 0
  );
}

/**
 * Filter content for recommendations
 */
export function filterRecommendableContent(contents: CuratedContent[]): CuratedContent[] {
  return contents.filter(isRecommendable);
}

/**
 * Check if user is inactive
 */
export function isUserInactive(lastActivityDate: Date | string | null): boolean {
  if (!lastActivityDate) return true;
  
  const lastActivity = typeof lastActivityDate === 'string' 
    ? new Date(lastActivityDate) 
    : lastActivityDate;
  
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays >= INACTIVE_THRESHOLD_DAYS;
}

/**
 * Should curate content for user
 */
export function shouldCurateForUser(lastActivityDate: Date | string | null): boolean {
  return !isUserInactive(lastActivityDate);
}

/**
 * Mark content as read
 */
export function markContentAsRead(content: CuratedContent): CuratedContent {
  return {
    ...content,
    is_read: true,
    read_at: new Date().toISOString(),
  };
}

/**
 * Mark content as pushed
 */
export function markContentAsPushed(content: CuratedContent): CuratedContent {
  return {
    ...content,
    is_pushed: true,
    pushed_at: new Date().toISOString(),
  };
}

/**
 * Create curated content from raw data
 */
export function createCuratedContent(
  rawContent: {
    title: string;
    summary?: string;
    url?: string;
    source: string;
    content_type: 'paper' | 'article' | 'tip';
  },
  userId: string,
  phaseGoals: PhaseGoal[]
): CuratedContent {
  const { score, matchedGoals, explanation } = calculateRelevanceScore(rawContent, phaseGoals);
  
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    content_type: rawContent.content_type,
    title: rawContent.title,
    summary: rawContent.summary,
    url: rawContent.url,
    source: rawContent.source,
    relevance_score: score,
    matched_goals: matchedGoals,
    relevance_explanation: explanation,
    is_pushed: false,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get top recommendation for user
 */
export function getTopRecommendation(contents: CuratedContent[]): CuratedContent | null {
  const recommendable = filterRecommendableContent(contents);
  
  if (recommendable.length === 0) return null;
  
  // Sort by relevance score descending
  const sorted = [...recommendable].sort((a, b) => b.relevance_score - a.relevance_score);
  
  // Return the highest scoring unpushed content
  return sorted.find(c => !c.is_pushed) || sorted[0];
}

/**
 * Simulate content curation pipeline (for testing)
 */
export function simulateCurationPipeline(
  userId: string,
  phaseGoals: PhaseGoal[],
  rawContents: Array<{
    title: string;
    summary?: string;
    url?: string;
    source: string;
    content_type: 'paper' | 'article' | 'tip';
  }>
): ContentCurationResult {
  const startTime = Date.now();
  
  // Create curated content
  const curatedContents = rawContents.map(raw => 
    createCuratedContent(raw, userId, phaseGoals)
  );
  
  // Filter by relevance
  const filteredContents = curatedContents.filter(c => c.relevance_score > 0.3);
  
  return {
    content: filteredContents,
    totalFetched: rawContents.length,
    totalFiltered: filteredContents.length,
    executionTimeMs: Date.now() - startTime,
  };
}
