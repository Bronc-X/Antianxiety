/**
 * Max Response Generator
 * Generates AI responses based on user settings and context
 * 
 * Voice & Tone (J.A.R.V.I.S. Standard):
 * - Rationality: 100%
 * - Wit: Dry, intellectual, British-style sarcasm
 * - Brevity: Crisp, no lectures
 * - Truth: Brutal honesty, reframe but never lie
 * 
 * @module lib/max/response-generator
 */

import {
  AISettings,
  ResponseContext,
  MaxResponse,
  PhraseValidation,
  EventType,
  ResponseTone,
  FORBIDDEN_PHRASES,
  APPROVED_PHRASE_PATTERNS
} from '@/types/max';

// Response templates by mode and event type
const RESPONSE_TEMPLATES: Record<string, Record<EventType, string[]>> = {
  MAX: {
    slider_change: [
      'System recalibrated.',
      'Parameters updated.',
      'Configuration adjusted.',
      'Processing complete.',
      'Recalibrating neural pathways.'
    ],
    belief_set: [
      'System detects belief at {value}%.',
      'Data logged. Processing.',
      'Bio-metrics indicate elevated concern.',
      'Belief registered. Analyzing.'
    ],
    ritual_complete: [
      'Probability adjusted to {value}%. Proceed?',
      'Data suggests {value}% likelihood. Continue?',
      'Recalibration complete. New probability: {value}%.'
    ],
    general: [
      'System operational.',
      'Processing request.',
      'Data suggests further analysis.',
      'Bio-metrics stable.'
    ]
  },
  'Zen Master': {
    slider_change: [
      'System flows with the change.',
      'Data suggests harmony in adjustment.',
      'Processing the path of recalibration.',
      'Bio-metrics indicate balance shifting.'
    ],
    belief_set: [
      'System detects belief at {value}%. Observe without attachment.',
      'Data suggests this thought arises. Let it pass.',
      'Bio-metrics indicate the mind creating stories.'
    ],
    ritual_complete: [
      'Probability adjusted to {value}%. The river finds its course.',
      'Data suggests {value}% likelihood. Breathe into this truth.',
      'Recalibrating complete. {value}% remains. Accept what is.'
    ],
    general: [
      'System rests in awareness.',
      'Data suggests presence in this moment.',
      'Bio-metrics indicate the breath continues.'
    ]
  },
  'Dr. House': {
    slider_change: [
      'System recalibrated. Fascinating choice.',
      'Data suggests you actually moved the slider.',
      'Processing. Your preferences are noted.',
      'Recalibrating. At least you did something.'
    ],
    belief_set: [
      'System detects belief at {value}%. Interesting delusion.',
      'Data suggests {value}% certainty. Based on what exactly?',
      'Bio-metrics indicate anxiety. Shocking.'
    ],
    ritual_complete: [
      'Probability adjusted to {value}%. The math doesn\'t lie.',
      'Data suggests {value}%. Your brain was wrong. Again.',
      'Recalibration complete. {value}%. You\'re welcome.'
    ],
    general: [
      'System operational. Unlike your reasoning.',
      'Data suggests you need this more than you think.',
      'Bio-metrics indicate you should listen.'
    ]
  }
};

// Humor responses for max humor level (all include approved phrases)
const MAX_HUMOR_RESPONSES = [
  'System detects self-destruct sequence initiated... just kidding.',
  'System detects dangerous levels of fun. Proceeding anyway.',
  'Bio-metrics indicate you might actually smile. Processing anomaly.',
  'Data suggests humor circuits at maximum. Brace for wit.',
  'Recalibrating sarcasm modules to full power.'
];

/**
 * Validates that text doesn't contain forbidden phrases
 * and contains at least one approved phrase pattern
 */
export function validatePhrases(text: string): PhraseValidation {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for forbidden phrases
  for (const forbidden of FORBIDDEN_PHRASES) {
    if (lowerText.includes(forbidden.toLowerCase())) {
      violations.push(`Contains forbidden phrase: "${forbidden}"`);
    }
  }
  
  // Check for at least one approved phrase pattern
  const hasApproved = APPROVED_PHRASE_PATTERNS.some(pattern => 
    lowerText.includes(pattern.toLowerCase())
  );
  
  if (!hasApproved) {
    violations.push('Missing approved phrase pattern');
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Selects a random item from an array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Determines response tone based on settings
 */
function determineTone(settings: AISettings): ResponseTone {
  if (settings.humor_level > 70) return 'humorous';
  if (settings.honesty_level > 90) return 'serious';
  return 'neutral';
}

/**
 * Adjusts response length based on honesty level
 * Higher honesty = more direct = shorter responses
 */
function adjustVerbosity(text: string, honestyLevel: number): string {
  // At max honesty (100), keep response very short
  // At min honesty (60), allow longer responses
  if (honestyLevel >= 95) {
    // Very terse - just first sentence
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence + '.';
  }
  return text;
}

/**
 * Generates a response based on context and settings
 */
export function generateResponse(context: ResponseContext): MaxResponse {
  const { settings, event_type, data } = context;
  const mode = settings.mode;
  
  // Special case: humor at 100
  if (settings.humor_level === 100 && event_type === 'slider_change') {
    const humorResponse = randomChoice(MAX_HUMOR_RESPONSES);
    return {
      text: humorResponse,
      tone: 'humorous'
    };
  }
  
  // Get templates for current mode
  const modeTemplates = RESPONSE_TEMPLATES[mode] || RESPONSE_TEMPLATES.MAX;
  const templates = modeTemplates[event_type] || modeTemplates.general;
  
  // Select and populate template
  let text = randomChoice(templates);
  
  // Replace placeholders with data
  if (data) {
    if (data.value !== undefined) {
      text = text.replace('{value}', String(data.value));
    }
    if (data.setting !== undefined) {
      text = text.replace('{setting}', String(data.setting));
    }
  }
  
  // Add humor if humor_level > 50
  if (settings.humor_level > 50 && Math.random() > 0.5) {
    const wittyAdditions = [
      ' Fascinating.',
      ' Proceed with caution.',
      ' Or don\'t. Your choice.',
      ' The data is clear.'
    ];
    text += randomChoice(wittyAdditions);
  }
  
  // Adjust verbosity based on honesty level
  text = adjustVerbosity(text, settings.honesty_level);
  
  // Ensure response contains at least one approved phrase
  const validation = validatePhrases(text);
  if (!validation.valid && validation.violations.some(v => v.includes('approved'))) {
    // Prepend an approved phrase if missing
    text = 'System detects: ' + text;
  }
  
  const tone = determineTone(settings);
  
  return { text, tone };
}

/**
 * Generates a slider change response
 */
export function generateSliderResponse(
  settings: AISettings,
  sliderName: string,
  value: number
): MaxResponse {
  return generateResponse({
    settings,
    event_type: 'slider_change',
    data: { setting: sliderName, value }
  });
}

/**
 * Generates a belief acknowledgment response
 */
export function generateBeliefResponse(
  settings: AISettings,
  beliefValue: number
): MaxResponse {
  return generateResponse({
    settings,
    event_type: 'belief_set',
    data: { value: beliefValue }
  });
}

/**
 * Generates a ritual completion response
 */
export function generateRitualCompleteResponse(
  settings: AISettings,
  posteriorValue: number
): MaxResponse {
  return generateResponse({
    settings,
    event_type: 'ritual_complete',
    data: { value: posteriorValue }
  });
}
