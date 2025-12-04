import { z } from 'zod';

// ============================================
// Phase & Status Enums
// ============================================
export const AssessmentPhase = z.enum(['welcome', 'baseline', 'chief_complaint', 'differential', 'report', 'emergency']);
export type AssessmentPhase = z.infer<typeof AssessmentPhase>;

export const SessionStatus = z.enum(['active', 'completed', 'expired', 'emergency_triggered']);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const UrgencyLevel = z.enum(['emergency', 'urgent', 'routine', 'self_care']);
export type UrgencyLevel = z.infer<typeof UrgencyLevel>;

export const QuestionType = z.enum(['single_choice', 'multiple_choice', 'boolean', 'scale', 'text', 'symptom_search']);
export type QuestionType = z.infer<typeof QuestionType>;

export const QuestionCategory = z.enum(['demographics', 'history', 'location', 'severity', 'timing', 'associated', 'triggers']);
export type QuestionCategory = z.infer<typeof QuestionCategory>;

export const InputMethod = z.enum(['tap', 'type', 'voice']);
export type InputMethod = z.infer<typeof InputMethod>;

// ============================================
// Demographics Schema
// ============================================
export const DemographicsSchema = z.object({
  biological_sex: z.enum(['male', 'female']).optional(),
  age: z.number().min(0).max(120).optional(),
  smoking_status: z.enum(['never', 'former', 'current']).optional(),
  medical_history: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});
export type Demographics = z.infer<typeof DemographicsSchema>;

// ============================================
// Answer Record Schema
// ============================================
export const AnswerRecordSchema = z.object({
  question_id: z.string(),
  question_text: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
  input_method: InputMethod.optional(),
  answered_at: z.string().datetime(),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

// ============================================
// Session Schema
// ============================================
export const AssessmentSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  phase: AssessmentPhase,
  status: SessionStatus,
  demographics: DemographicsSchema,
  chief_complaint: z.string().nullable(),
  symptoms: z.array(z.string()),
  history: z.array(AnswerRecordSchema),
  language: z.enum(['zh', 'en']),
  country_code: z.string().length(2),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});
export type AssessmentSession = z.infer<typeof AssessmentSessionSchema>;

// ============================================
// Question Option Schema
// ============================================
export const QuestionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
});
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

// ============================================
// API Request Schema
// ============================================
export const AssessmentRequestSchema = z.object({
  session_id: z.string().uuid().optional(), // Optional for start
  answer: z
    .object({
      question_id: z.string(),
      value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
      input_method: InputMethod.optional(),
    })
    .optional(),
  language: z.enum(['zh', 'en']).default('zh'),
  country_code: z.string().length(2).default('CN'),
});
export type AssessmentRequest = z.infer<typeof AssessmentRequestSchema>;

// ============================================
// API Response Schemas (Discriminated Union)
// ============================================

export const QuestionStepSchema = z.object({
  step_type: z.literal('question'),
  session_id: z.string().uuid(),
  phase: z.enum(['baseline', 'chief_complaint', 'differential']),
  question: z.object({
    id: z.string(),
    text: z.string(),
    description: z.string().optional(),
    type: QuestionType,
    options: z.array(QuestionOptionSchema).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    progress: z.number().min(0).max(100),
    category: QuestionCategory,
  }),
});
export type QuestionStep = z.infer<typeof QuestionStepSchema>;

export const ConditionSchema = z.object({
  name: z.string(),
  description: z.string(),
  probability: z.number().min(0).max(100),
  matched_symptoms: z.array(z.string()),
  is_best_match: z.boolean(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ReportStepSchema = z.object({
  step_type: z.literal('report'),
  session_id: z.string().uuid(),
  phase: z.literal('report'),
  report: z.object({
    conditions: z.array(ConditionSchema),
    urgency: UrgencyLevel,
    next_steps: z.array(
      z.object({
        action: z.string(),
        icon: z.string(),
      }),
    ),
    disclaimer: z.string(),
  }),
});
export type ReportStep = z.infer<typeof ReportStepSchema>;

export const EmergencyStepSchema = z.object({
  step_type: z.literal('emergency'),
  session_id: z.string().uuid(),
  phase: z.literal('emergency'),
  emergency: z.object({
    title: z.string(),
    message: z.string(),
    detected_pattern: z.string(),
    emergency_number: z.string(),
    emergency_name: z.string(),
    instructions: z.array(z.string()),
  }),
});
export type EmergencyStep = z.infer<typeof EmergencyStepSchema>;

export const AssessmentResponseSchema = z.discriminatedUnion('step_type', [
  QuestionStepSchema,
  ReportStepSchema,
  EmergencyStepSchema,
]);
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;

// ============================================
// Error Response Schema
// ============================================
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================
// Red Flag Patterns
// ============================================
export interface RedFlagPattern {
  id: string;
  patterns: string[];
  min_matches: number;
  message_zh: string;
  message_en: string;
}

export const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  {
    id: 'cardiac_emergency',
    patterns: ['chest pain', 'radiating to arm', 'radiating to jaw', 'crushing pressure', '胸痛', '放射到手臂', '压迫感'],
    min_matches: 2,
    message_zh: '您描述的症状可能提示心脏紧急情况。请立刻拨打急救电话或前往最近的急诊室。',
    message_en:
      'Your symptoms may indicate a cardiac emergency. Call emergency services or go to the nearest ER immediately.',
  },
  {
    id: 'stroke_warning',
    patterns: [
      'sudden severe headache',
      'worst headache',
      'facial drooping',
      'arm weakness',
      'speech difficulty',
      '突发剧烈头痛',
      '面部下垂',
      '言语困难',
    ],
    min_matches: 2,
    message_zh: '您描述的症状可能提示中风。时间就是大脑！请立刻拨打急救电话。',
    message_en: 'Your symptoms may indicate a stroke. Time is brain! Call emergency services immediately.',
  },
  {
    id: 'anaphylaxis',
    patterns: [
      'difficulty breathing',
      'throat swelling',
      'severe allergic',
      'hives spreading',
      '呼吸困难',
      '喉咙肿胀',
      '严重过敏',
    ],
    min_matches: 2,
    message_zh: '您可能正在经历严重过敏反应。请立即拨打急救电话并使用肾上腺素笔（如有）。',
    message_en: 'You may be experiencing anaphylaxis. Call emergency services immediately and use epinephrine if available.',
  },
];

// ============================================
// Emergency Numbers by Country
// ============================================
export const EMERGENCY_NUMBERS: Record<string, { number: string; name: string }> = {
  CN: { number: '120', name: '急救中心' },
  US: { number: '911', name: 'Emergency Services' },
  UK: { number: '999', name: 'Emergency Services' },
  EU: { number: '112', name: 'Emergency Services' },
  AU: { number: '000', name: 'Emergency Services' },
  DEFAULT: { number: '112', name: 'Emergency Services' },
};

export function getEmergencyNumber(countryCode: string): { number: string; name: string } {
  return EMERGENCY_NUMBERS[countryCode] || EMERGENCY_NUMBERS.DEFAULT;
}
