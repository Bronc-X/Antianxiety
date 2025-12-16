/**
 * Template Questions for Adaptive Onboarding
 * 
 * These 3 questions are asked to ALL users during onboarding.
 * They form the foundation for the AI decision tree to generate
 * personalized follow-up questions.
 * 
 * **Property 1: Template Question Count Invariant**
 * This array MUST contain exactly 3 questions.
 */

import type { OnboardingQuestion } from '@/types/adaptive-interaction';

/**
 * Template questions - exactly 3 questions for all users
 * Covers: Energy, Sleep, Stress (the core metabolic anxiety indicators)
 */
export const TEMPLATE_QUESTIONS: OnboardingQuestion[] = [
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

/**
 * English version of template questions
 */
export const TEMPLATE_QUESTIONS_EN: OnboardingQuestion[] = [
  {
    id: 'energy_crash',
    question: 'Between 2–4 PM, do you feel a sudden "cliff drop" in energy?',
    description: 'Even after a nap, does your brain still feel foggy?',
    type: 'single',
    options: [
      { label: "Yes — that's my daily life", value: 'severe_crash', score: 3 },
      { label: 'Sometimes', value: 'occasional_crash', score: 2 },
      { label: 'Rarely — I feel energetic', value: 'no_crash', score: 1 },
    ],
  },
  {
    id: 'sleep_maintenance',
    question: "Falling asleep may be easy — but do you often wake up around 3–4 AM for no reason?",
    description: "Do work thoughts start playing like a movie, and you can't fall back asleep?",
    type: 'single',
    options: [
      { label: "Often — it's exhausting", value: 'frequent_wakeup', score: 3 },
      { label: 'Occasionally', value: 'occasional_wakeup', score: 2 },
      { label: 'I usually sleep through the night', value: 'sleep_well', score: 1 },
    ],
  },
  {
    id: 'stress_tolerance',
    question: 'Has your stress "tolerance threshold" gotten lower?',
    description: 'Do small things that used to be easy now trigger a racing heart or irritability?',
    type: 'single',
    options: [
      { label: 'Yes — more irritable/anxious', value: 'low_tolerance', score: 3 },
      { label: 'Sometimes', value: 'medium_tolerance', score: 2 },
      { label: "I'm usually steady", value: 'high_tolerance', score: 1 },
    ],
  },
];

/**
 * Get template questions by language
 */
export function getTemplateQuestions(language: 'zh' | 'en' = 'zh'): OnboardingQuestion[] {
  return language === 'en' ? TEMPLATE_QUESTIONS_EN : TEMPLATE_QUESTIONS;
}

/**
 * Validate that template questions array has exactly 3 questions
 * This is a runtime check for Property 1
 */
export function validateTemplateQuestions(): boolean {
  return TEMPLATE_QUESTIONS.length === 3 && TEMPLATE_QUESTIONS_EN.length === 3;
}

// Runtime assertion
if (typeof window === 'undefined') {
  // Server-side check
  if (!validateTemplateQuestions()) {
    throw new Error('Template questions must contain exactly 3 questions');
  }
}
