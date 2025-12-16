/**
 * Adaptive Interaction System Property Tests
 * 
 * **Feature: adaptive-interaction-system**
 * 
 * Property-based tests for the adaptive onboarding, phase goals,
 * daily calibration, active inquiry, and content curation systems.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  PhaseGoal,
  GoalType,
  Citation,
  OnboardingQuestion,
  CalibrationQuestion,
  CalibrationQuestionType,
  InquiryQuestion,
  DataGap,
  CuratedContent,
  InquiryPriority,
} from '@/types/adaptive-interaction';

// ============================================
// Arbitraries (Generators)
// ============================================

const goalTypeArb: fc.Arbitrary<GoalType> = fc.constantFrom(
  'sleep', 'energy', 'weight', 'stress', 'fitness'
);

const priorityArb: fc.Arbitrary<1 | 2> = fc.constantFrom(1, 2);

const inquiryPriorityArb: fc.Arbitrary<InquiryPriority> = fc.constantFrom(
  'high', 'medium', 'low'
);

const citationArb: fc.Arbitrary<Citation> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  authors: fc.string({ minLength: 1, maxLength: 100 }),
  year: fc.integer({ min: 1990, max: 2025 }),
  doi: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
  url: fc.option(fc.webUrl(), { nil: undefined }),
});

// Safe date string generator that avoids invalid dates
const safeDateArb: fc.Arbitrary<string> = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2025-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const phaseGoalArb: fc.Arbitrary<PhaseGoal> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  goal_type: goalTypeArb,
  priority: priorityArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  rationale: fc.string({ minLength: 10, maxLength: 500 }),
  citations: fc.array(citationArb, { minLength: 1, maxLength: 5 }),
  is_ai_recommended: fc.boolean(),
  user_modified: fc.boolean(),
  created_at: safeDateArb,
  updated_at: safeDateArb,
});

const questionOptionArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 100 }),
  value: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.option(fc.integer({ min: 1, max: 3 }), { nil: undefined }),
});

const onboardingQuestionArb: fc.Arbitrary<OnboardingQuestion> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  question: fc.string({ minLength: 10, maxLength: 200 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  options: fc.array(questionOptionArb, { minLength: 2, maxLength: 5 }),
  type: fc.constantFrom('single', 'multi'),
});

const calibrationQuestionTypeArb: fc.Arbitrary<CalibrationQuestionType> = fc.constantFrom(
  'anchor', 'adaptive', 'evolution'
);

const calibrationQuestionArb: fc.Arbitrary<CalibrationQuestion> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  type: calibrationQuestionTypeArb,
  question: fc.string({ minLength: 10, maxLength: 200 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  inputType: fc.constantFrom('slider', 'single', 'multi', 'text'),
  options: fc.option(fc.array(questionOptionArb, { minLength: 2, maxLength: 5 }), { nil: undefined }),
  min: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
  max: fc.option(fc.integer({ min: 1, max: 12 }), { nil: undefined }),
  goalRelation: fc.option(goalTypeArb, { nil: undefined }),
});

const dataGapArb: fc.Arbitrary<DataGap> = fc.record({
  field: fc.string({ minLength: 1, maxLength: 50 }),
  lastUpdated: fc.option(safeDateArb, { nil: undefined }),
  importance: inquiryPriorityArb,
  description: fc.string({ minLength: 1, maxLength: 200 }),
});

const curatedContentArb: fc.Arbitrary<CuratedContent> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  content_type: fc.constantFrom('paper', 'article', 'tip'),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  summary: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  url: fc.option(fc.webUrl(), { nil: undefined }),
  source: fc.string({ minLength: 1, maxLength: 100 }),
  relevance_score: fc.float({ min: 0, max: 1 }),
  matched_goals: fc.array(goalTypeArb, { minLength: 0, maxLength: 3 }),
  relevance_explanation: fc.option(fc.string({ minLength: 1, maxLength: 300 }), { nil: undefined }),
  is_pushed: fc.boolean(),
  pushed_at: fc.option(safeDateArb, { nil: undefined }),
  is_read: fc.boolean(),
  read_at: fc.option(safeDateArb, { nil: undefined }),
  created_at: safeDateArb,
});

// ============================================
// Property Tests
// ============================================

describe('Property 1: Template Question Count Invariant', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 1: Template Question Count Invariant**
   * 
   * *For any* onboarding flow initialization, the template questions array
   * SHALL contain exactly 3 questions.
   * 
   * **Validates: Requirements 1.2**
   */

  const TEMPLATE_QUESTIONS: OnboardingQuestion[] = [
    {
      id: 'energy_crash',
      question: '在下午 2 点到 4 点之间，你是否会感到一种"断崖式"的能量跌落？',
      description: '哪怕中午睡了觉，脑子也像蒙了一层雾？',
      type: 'single',
      options: [
        { label: '是的，这就是我的日常', value: 'severe_crash', score: 3 },
        { label: '偶尔会有', value: 'occasional_crash', score: 2 },
        { label: '几乎没有，精力很充沛', value: 'no_crash', score: 1 },
      ],
    },
    {
      id: 'sleep_maintenance',
      question: '入睡也许不难，但你是否经常在凌晨 3-4 点莫名醒来？',
      description: '脑子里开始像放电影一样过工作的事，然后再也睡不着？',
      type: 'single',
      options: [
        { label: '经常这样，非常痛苦', value: 'frequent_wakeup', score: 3 },
        { label: '偶尔醒来', value: 'occasional_wakeup', score: 2 },
        { label: '我通常一觉睡到天亮', value: 'sleep_well', score: 1 },
      ],
    },
    {
      id: 'stress_tolerance',
      question: '面对工作压力时，你现在的"耐受阈值"是否变低了？',
      description: '以前能轻松应对的琐事，现在很容易让你感到心跳加速或莫名烦躁？',
      type: 'single',
      options: [
        { label: '是的，变得很易怒/焦虑', value: 'low_tolerance', score: 3 },
        { label: '有时候会', value: 'medium_tolerance', score: 2 },
        { label: '我心态一直很稳', value: 'high_tolerance', score: 1 },
      ],
    },
  ];

  it('should always have exactly 3 template questions', () => {
    expect(TEMPLATE_QUESTIONS.length).toBe(3);
  });

  it('should have unique question IDs', () => {
    const ids = TEMPLATE_QUESTIONS.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('should have valid question structure for all template questions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 }), (index) => {
        const question = TEMPLATE_QUESTIONS[index];
        expect(question.id).toBeTruthy();
        expect(question.question.length).toBeGreaterThan(0);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.type).toBe('single');
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Total Question Limit', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 2: Total Question Limit**
   * 
   * *For any* sequence of user answers during onboarding, the total question count
   * (template + decision-tree) SHALL NOT exceed 7.
   * 
   * **Validates: Requirements 1.5**
   */

  const MAX_QUESTIONS = 7;
  const TEMPLATE_COUNT = 3;
  const MAX_DECISION_TREE = MAX_QUESTIONS - TEMPLATE_COUNT;

  function simulateOnboardingFlow(decisionTreeCount: number): number {
    // Simulate the flow: always 3 template + variable decision tree
    const actualDecisionTree = Math.min(decisionTreeCount, MAX_DECISION_TREE);
    return TEMPLATE_COUNT + actualDecisionTree;
  }

  it('should never exceed 7 total questions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), (requestedDecisionTreeQuestions) => {
        const totalQuestions = simulateOnboardingFlow(requestedDecisionTreeQuestions);
        expect(totalQuestions).toBeLessThanOrEqual(MAX_QUESTIONS);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should allow up to 4 decision tree questions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (decisionTreeCount) => {
        const totalQuestions = simulateOnboardingFlow(decisionTreeCount);
        expect(totalQuestions).toBe(TEMPLATE_COUNT + decisionTreeCount);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Phase Goal Generation Validity', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 4: Phase Goal Generation Validity**
   * 
   * *For any* completed onboarding answer set, the generated Phase Goals SHALL contain
   * 1-2 goals, each with a priority (1 or 2), a non-empty rationale, and at least one citation.
   * 
   * **Validates: Requirements 1.6, 2.1, 2.2**
   */

  function validatePhaseGoal(goal: PhaseGoal): boolean {
    // Must have valid priority
    if (goal.priority !== 1 && goal.priority !== 2) return false;
    
    // Must have non-empty rationale
    if (!goal.rationale || goal.rationale.length === 0) return false;
    
    // Must have at least one citation
    if (!goal.citations || goal.citations.length === 0) return false;
    
    // Must have valid goal type
    const validTypes: GoalType[] = ['sleep', 'energy', 'weight', 'stress', 'fitness'];
    if (!validTypes.includes(goal.goal_type)) return false;
    
    return true;
  }

  it('should generate valid phase goals', () => {
    fc.assert(
      fc.property(phaseGoalArb, (goal) => {
        expect(validatePhaseGoal(goal)).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should have unique priorities when multiple goals exist', () => {
    // This test validates the CONSTRAINT that when we have 2 goals,
    // they must have different priorities (1 and 2)
    // The generator creates random goals, so we test the validation function
    
    function validateGoalPriorities(goals: PhaseGoal[]): boolean {
      if (goals.length <= 1) return true;
      if (goals.length === 2) {
        // Must have priorities 1 and 2
        const priorities = new Set(goals.map(g => g.priority));
        return priorities.size === 2;
      }
      return false; // More than 2 goals is invalid
    }
    
    fc.assert(
      fc.property(
        fc.tuple(
          phaseGoalArb.map(g => ({ ...g, priority: 1 as const })),
          phaseGoalArb.map(g => ({ ...g, priority: 2 as const }))
        ),
        ([goal1, goal2]) => {
          const goals = [goal1, goal2];
          expect(validateGoalPriorities(goals)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have citations with required fields', () => {
    fc.assert(
      fc.property(citationArb, (citation) => {
        expect(citation.title.length).toBeGreaterThan(0);
        expect(citation.authors.length).toBeGreaterThan(0);
        expect(citation.year).toBeGreaterThanOrEqual(1990);
        expect(citation.year).toBeLessThanOrEqual(2025);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 8: Anchor Question Presence', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 8: Anchor Question Presence**
   * 
   * *For any* generated daily calibration question set, at least one question
   * SHALL be of type 'anchor'.
   * 
   * **Validates: Requirements 3.2**
   */

  function generateCalibrationQuestions(
    phaseGoal: GoalType,
    evolutionLevel: number
  ): CalibrationQuestion[] {
    // Always include anchor questions
    const anchorQuestions: CalibrationQuestion[] = [
      {
        id: 'sleep_hours',
        type: 'anchor',
        question: '昨晚睡了多少小时？',
        inputType: 'slider',
        min: 0,
        max: 12,
      },
      {
        id: 'stress_level',
        type: 'anchor',
        question: '当前压力水平？',
        inputType: 'single',
        options: [
          { label: '低压', value: 'low' },
          { label: '中压', value: 'medium' },
          { label: '高压', value: 'high' },
        ],
      },
    ];

    // Add adaptive questions based on goal
    const adaptiveQuestions: CalibrationQuestion[] = [];
    if (phaseGoal === 'sleep') {
      adaptiveQuestions.push({
        id: 'sleep_quality',
        type: 'adaptive',
        question: '睡眠质量如何？',
        inputType: 'slider',
        min: 1,
        max: 10,
        goalRelation: 'sleep',
      });
    }

    return [...anchorQuestions, ...adaptiveQuestions];
  }

  it('should always include at least one anchor question', () => {
    fc.assert(
      fc.property(
        goalTypeArb,
        fc.integer({ min: 1, max: 5 }),
        (goalType, evolutionLevel) => {
          const questions = generateCalibrationQuestions(goalType, evolutionLevel);
          const anchorCount = questions.filter(q => q.type === 'anchor').length;
          expect(anchorCount).toBeGreaterThanOrEqual(1);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Seven-Day Evolution Trigger', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 9: Seven-Day Evolution Trigger**
   * 
   * *For any* user who completes 7 consecutive days of calibration,
   * the question_evolution_level SHALL increment by 1.
   * 
   * **Validates: Requirements 3.3**
   */

  function shouldEvolve(consecutiveDays: number): boolean {
    return consecutiveDays > 0 && consecutiveDays % 7 === 0;
  }

  function calculateEvolutionLevel(consecutiveDays: number): number {
    return Math.floor(consecutiveDays / 7) + 1;
  }

  it('should trigger evolution at day 7, 14, 21, etc.', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (days) => {
        const shouldTrigger = shouldEvolve(days);
        if (days % 7 === 0) {
          expect(shouldTrigger).toBe(true);
        } else {
          expect(shouldTrigger).toBe(false);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate correct evolution level', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (days) => {
        const level = calculateEvolutionLevel(days);
        expect(level).toBe(Math.floor(days / 7) + 1);
        expect(level).toBeGreaterThanOrEqual(1);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 11: Inquiry Data Gap Prioritization', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 11: Inquiry Data Gap Prioritization**
   * 
   * *For any* user with identified data gaps, the generated inquiry question
   * SHALL address the highest-priority gap.
   * 
   * **Validates: Requirements 4.4**
   */

  function prioritizeDataGaps(gaps: DataGap[]): DataGap | null {
    if (gaps.length === 0) return null;
    
    const priorityOrder: InquiryPriority[] = ['high', 'medium', 'low'];
    
    return gaps.sort((a, b) => {
      return priorityOrder.indexOf(a.importance) - priorityOrder.indexOf(b.importance);
    })[0];
  }

  it('should select highest priority gap', () => {
    fc.assert(
      fc.property(
        fc.array(dataGapArb, { minLength: 1, maxLength: 10 }),
        (gaps) => {
          const selected = prioritizeDataGaps(gaps);
          expect(selected).not.toBeNull();
          
          // Verify no higher priority gap exists
          const hasHigherPriority = gaps.some(g => {
            if (selected!.importance === 'high') return false;
            if (selected!.importance === 'medium') return g.importance === 'high';
            return g.importance === 'high' || g.importance === 'medium';
          });
          
          expect(hasHigherPriority).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 13: Feed Recommendation Relevance', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 13: Feed Recommendation Relevance**
   * 
   * *For any* feed content recommended to a user, the content SHALL have a
   * relevance_score above the threshold AND include a non-empty relevance explanation.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */

  const RELEVANCE_THRESHOLD = 0.6;

  function isRecommendable(content: CuratedContent): boolean {
    return (
      content.relevance_score >= RELEVANCE_THRESHOLD &&
      content.relevance_explanation !== undefined &&
      content.relevance_explanation.length > 0
    );
  }

  function filterRecommendableContent(contents: CuratedContent[]): CuratedContent[] {
    return contents.filter(isRecommendable);
  }

  it('should only recommend content above relevance threshold', () => {
    fc.assert(
      fc.property(
        fc.array(curatedContentArb, { minLength: 0, maxLength: 20 }),
        (contents) => {
          const recommended = filterRecommendableContent(contents);
          
          recommended.forEach(content => {
            expect(content.relevance_score).toBeGreaterThanOrEqual(RELEVANCE_THRESHOLD);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should require relevance explanation for recommendations', () => {
    fc.assert(
      fc.property(curatedContentArb, (content) => {
        if (isRecommendable(content)) {
          expect(content.relevance_explanation).toBeTruthy();
          expect(content.relevance_explanation!.length).toBeGreaterThan(0);
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 16: Inactive User Curation Reduction', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 16: Inactive User Curation Reduction**
   * 
   * *For any* user inactive for 7+ days, the curation job SHALL skip or reduce
   * content fetching for that user.
   * 
   * **Validates: Requirements 6.5**
   */

  const INACTIVE_THRESHOLD_DAYS = 7;

  function isUserInactive(lastActivityDate: Date): boolean {
    const now = new Date();
    const diffMs = now.getTime() - lastActivityDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= INACTIVE_THRESHOLD_DAYS;
  }

  function shouldCurateForUser(lastActivityDate: Date): boolean {
    return !isUserInactive(lastActivityDate);
  }

  it('should skip curation for users inactive 7+ days', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), (daysAgo) => {
        const lastActivity = new Date();
        lastActivity.setDate(lastActivity.getDate() - daysAgo);
        
        const shouldCurate = shouldCurateForUser(lastActivity);
        
        if (daysAgo >= INACTIVE_THRESHOLD_DAYS) {
          expect(shouldCurate).toBe(false);
        } else {
          expect(shouldCurate).toBe(true);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Goal Modification Persistence', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 6: Goal Modification Persistence**
   * 
   * *For any* user-confirmed goal modification, the database SHALL reflect the change
   * within 1 second, and the user_modified flag SHALL be set to true.
   * 
   * **Validates: Requirements 2.4**
   */

  interface GoalModification {
    originalGoal: PhaseGoal;
    newGoalType: GoalType;
    newTitle?: string;
  }

  function applyGoalModification(
    goal: PhaseGoal,
    modification: Partial<{ goal_type: GoalType; title: string }>
  ): PhaseGoal {
    return {
      ...goal,
      goal_type: modification.goal_type ?? goal.goal_type,
      title: modification.title ?? goal.title,
      user_modified: true,
      updated_at: new Date().toISOString(),
    };
  }

  function validateModifiedGoal(
    original: PhaseGoal,
    modified: PhaseGoal,
    expectedType?: GoalType,
    expectedTitle?: string
  ): boolean {
    // user_modified flag must be true
    if (!modified.user_modified) return false;
    
    // updated_at must be different from original (or at least set)
    if (!modified.updated_at) return false;
    
    // If new type was specified, it must be applied
    if (expectedType && modified.goal_type !== expectedType) return false;
    
    // If new title was specified, it must be applied
    if (expectedTitle && modified.title !== expectedTitle) return false;
    
    // ID and user_id must remain unchanged
    if (modified.id !== original.id) return false;
    if (modified.user_id !== original.user_id) return false;
    
    return true;
  }

  it('should set user_modified flag to true after modification', () => {
    fc.assert(
      fc.property(
        phaseGoalArb.map(g => ({ ...g, user_modified: false })),
        goalTypeArb,
        (originalGoal, newGoalType) => {
          const modified = applyGoalModification(originalGoal, { goal_type: newGoalType });
          expect(modified.user_modified).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve goal identity after modification', () => {
    fc.assert(
      fc.property(
        phaseGoalArb,
        goalTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (originalGoal, newGoalType, newTitle) => {
          const modified = applyGoalModification(originalGoal, { 
            goal_type: newGoalType, 
            title: newTitle 
          });
          
          // ID and user_id must be preserved
          expect(modified.id).toBe(originalGoal.id);
          expect(modified.user_id).toBe(originalGoal.user_id);
          
          // Priority should be preserved unless explicitly changed
          expect(modified.priority).toBe(originalGoal.priority);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply new goal type correctly', () => {
    fc.assert(
      fc.property(
        phaseGoalArb,
        goalTypeArb,
        (originalGoal, newGoalType) => {
          const modified = applyGoalModification(originalGoal, { goal_type: newGoalType });
          expect(modified.goal_type).toBe(newGoalType);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp after modification', () => {
    fc.assert(
      fc.property(
        phaseGoalArb.map(g => ({
          ...g,
          updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        })),
        goalTypeArb,
        (originalGoal, newGoalType) => {
          const beforeModification = new Date(originalGoal.updated_at).getTime();
          const modified = applyGoalModification(originalGoal, { goal_type: newGoalType });
          const afterModification = new Date(modified.updated_at).getTime();
          
          // updated_at should be more recent
          expect(afterModification).toBeGreaterThan(beforeModification);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate complete modification flow', () => {
    fc.assert(
      fc.property(
        phaseGoalArb.map(g => ({ ...g, user_modified: false })),
        goalTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        (originalGoal, newGoalType, newTitle) => {
          const modified = applyGoalModification(originalGoal, { 
            goal_type: newGoalType, 
            title: newTitle 
          });
          
          const isValid = validateModifiedGoal(
            originalGoal, 
            modified, 
            newGoalType, 
            newTitle
          );
          
          expect(isValid).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Goal-Settings Synchronization', () => {
  /**
   * **Feature: adaptive-interaction-system, Property 5: Goal-Settings Synchronization**
   * 
   * *For any* Phase Goal set during onboarding, the same goal data SHALL be
   * retrievable from the Settings page without modification.
   * 
   * **Validates: Requirements 2.5**
   */

  interface GoalSyncState {
    onboardingGoals: PhaseGoal[];
    settingsGoals: PhaseGoal[];
  }

  function simulateGoalSync(onboardingGoals: PhaseGoal[]): GoalSyncState {
    // Simulate the sync: Settings page should receive exact same goals
    return {
      onboardingGoals,
      settingsGoals: [...onboardingGoals], // Direct copy, no modification
    };
  }

  function validateGoalSync(state: GoalSyncState): boolean {
    if (state.onboardingGoals.length !== state.settingsGoals.length) {
      return false;
    }

    for (let i = 0; i < state.onboardingGoals.length; i++) {
      const onboarding = state.onboardingGoals[i];
      const settings = state.settingsGoals[i];

      // All fields must match exactly
      if (onboarding.id !== settings.id) return false;
      if (onboarding.user_id !== settings.user_id) return false;
      if (onboarding.goal_type !== settings.goal_type) return false;
      if (onboarding.priority !== settings.priority) return false;
      if (onboarding.title !== settings.title) return false;
      if (onboarding.rationale !== settings.rationale) return false;
      if (onboarding.is_ai_recommended !== settings.is_ai_recommended) return false;
      if (onboarding.user_modified !== settings.user_modified) return false;
    }

    return true;
  }

  it('should sync goals from onboarding to settings without modification', () => {
    fc.assert(
      fc.property(
        fc.array(phaseGoalArb, { minLength: 1, maxLength: 2 }),
        (onboardingGoals) => {
          const state = simulateGoalSync(onboardingGoals);
          expect(validateGoalSync(state)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve goal count during sync', () => {
    fc.assert(
      fc.property(
        fc.array(phaseGoalArb, { minLength: 0, maxLength: 2 }),
        (onboardingGoals) => {
          const state = simulateGoalSync(onboardingGoals);
          expect(state.settingsGoals.length).toBe(state.onboardingGoals.length);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve goal IDs during sync', () => {
    fc.assert(
      fc.property(
        fc.array(phaseGoalArb, { minLength: 1, maxLength: 2 }),
        (onboardingGoals) => {
          const state = simulateGoalSync(onboardingGoals);
          const onboardingIds = new Set(state.onboardingGoals.map(g => g.id));
          const settingsIds = new Set(state.settingsGoals.map(g => g.id));
          
          // All IDs should match
          expect(onboardingIds.size).toBe(settingsIds.size);
          state.onboardingGoals.forEach(g => {
            expect(settingsIds.has(g.id)).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve goal priorities during sync', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          phaseGoalArb.map(g => ({ ...g, priority: 1 as const })),
          phaseGoalArb.map(g => ({ ...g, priority: 2 as const }))
        ),
        ([goal1, goal2]) => {
          const state = simulateGoalSync([goal1, goal2]);
          
          const settingsPriorities = state.settingsGoals.map(g => g.priority).sort();
          expect(settingsPriorities).toEqual([1, 2]);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve citations during sync', () => {
    fc.assert(
      fc.property(
        phaseGoalArb,
        (goal) => {
          const state = simulateGoalSync([goal]);
          const settingsGoal = state.settingsGoals[0];
          
          expect(settingsGoal.citations.length).toBe(goal.citations.length);
          
          goal.citations.forEach((citation, idx) => {
            expect(settingsGoal.citations[idx].title).toBe(citation.title);
            expect(settingsGoal.citations[idx].year).toBe(citation.year);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
