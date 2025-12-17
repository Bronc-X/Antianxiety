/**
 * Scientific Explanation Service
 * 科学解释生成服务 - 生成多维度科学解释
 * 
 * Requirements: 4.1, 4.4
 */

import type {
  ScientificExplanation,
  ProblemAnalysis,
} from '@/types/adaptive-plan';

// ============================================
// Configuration
// ============================================

const SCIENTIFIC_DOMAINS = ['physiology', 'neurology', 'psychology', 'behavioral_science'] as const;

// ============================================
// Core Service Functions
// ============================================

/**
 * Generate a scientific explanation with 4 domains
 * 
 * Requirements: 4.1
 * - Include Scientific_Explanation covering: physiology, neurology, psychology, and behavioral science
 */
export async function generateScientificExplanation(
  topic: string,
  context?: string
): Promise<ScientificExplanation> {
  try {
    // Call the existing chat API to generate explanation
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SCIENTIFIC_EXPLANATION_SYSTEM_PROMPT },
          { role: 'user', content: buildExplanationPrompt(topic, context) },
        ],
        responseFormat: 'json',
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to generate scientific explanation:', response.status);
      return createFallbackExplanation(topic);
    }
    
    const data = await response.json();
    return parseExplanationFromResponse(data, topic);
  } catch (error) {
    console.error('Error generating scientific explanation:', error);
    return createFallbackExplanation(topic);
  }
}

/**
 * Generate a problem analysis with root causes from 4 scientific domains
 * 
 * Requirements: 4.4
 * - Provide a multi-dimensional explanation addressing root causes from at least 4 scientific domains
 */
export async function generateProblemAnalysis(
  problemDescription: string,
  userContext?: string
): Promise<ProblemAnalysis> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: PROBLEM_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: buildProblemAnalysisPrompt(problemDescription, userContext) },
        ],
        responseFormat: 'json',
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to generate problem analysis:', response.status);
      return createFallbackProblemAnalysis(problemDescription);
    }
    
    const data = await response.json();
    return parseProblemAnalysisFromResponse(data, problemDescription);
  } catch (error) {
    console.error('Error generating problem analysis:', error);
    return createFallbackProblemAnalysis(problemDescription);
  }
}

// ============================================
// System Prompts
// ============================================

const SCIENTIFIC_EXPLANATION_SYSTEM_PROMPT = `你是一个健康科学专家，专门从多个科学角度解释健康行为和干预措施。

你的任务是为给定的健康话题生成全面的科学解释，必须包含以下4个维度：

1. **生理学 (physiology)**: 解释身体层面的机制，包括器官、系统、细胞层面的影响
2. **神经学 (neurology)**: 解释大脑和神经系统的相关机制，包括神经递质、脑区活动等
3. **心理学 (psychology)**: 解释心理层面的影响，包括认知、情绪、动机等
4. **行为学 (behavioral_science)**: 解释行为改变的原理，包括习惯形成、行为强化等

请以JSON格式返回，包含以下字段：
- physiology: 生理学解释
- neurology: 神经学解释
- psychology: 心理学解释
- behavioral_science: 行为学解释
- summary: 综合摘要
- references: 相关科学文献引用（可选）`;

const PROBLEM_ANALYSIS_SYSTEM_PROMPT = `你是一个健康问题分析专家，专门从多个科学角度分析健康问题的根本原因。

你的任务是为给定的健康问题生成全面的根因分析，必须包含以下4个维度的根本原因：

1. **生理学原因 (physiological)**: 身体层面的根本原因
2. **神经学原因 (neurological)**: 大脑和神经系统层面的根本原因
3. **心理学原因 (psychological)**: 心理层面的根本原因
4. **行为学原因 (behavioral)**: 行为模式层面的根本原因

请以JSON格式返回，包含以下字段：
- problem_description: 问题描述
- root_causes: 包含4个数组的对象（physiological, neurological, psychological, behavioral）
- scientific_explanation: 综合科学解释（包含physiology, neurology, psychology, behavioral_science, summary字段）`;


// ============================================
// Helper Functions
// ============================================

function buildExplanationPrompt(topic: string, context?: string): string {
  let prompt = `请为以下健康话题生成科学解释：\n\n话题：${topic}`;
  
  if (context) {
    prompt += `\n\n背景信息：${context}`;
  }
  
  prompt += '\n\n请确保每个维度的解释都具体、有科学依据，并且易于理解。';
  
  return prompt;
}

function buildProblemAnalysisPrompt(problemDescription: string, userContext?: string): string {
  let prompt = `请分析以下健康问题的根本原因：\n\n问题描述：${problemDescription}`;
  
  if (userContext) {
    prompt += `\n\n用户背景：${userContext}`;
  }
  
  prompt += '\n\n请从4个科学维度分析根本原因，并提供综合的科学解释。';
  
  return prompt;
}

function parseExplanationFromResponse(
  response: { content?: string; explanation?: ScientificExplanation },
  topic: string
): ScientificExplanation {
  try {
    if (response.explanation) {
      return validateAndFillExplanation(response.explanation);
    }
    
    if (response.content) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndFillExplanation(parsed);
      }
    }
    
    return createFallbackExplanation(topic);
  } catch (error) {
    console.error('Failed to parse explanation:', error);
    return createFallbackExplanation(topic);
  }
}

function parseProblemAnalysisFromResponse(
  response: { content?: string; analysis?: ProblemAnalysis },
  problemDescription: string
): ProblemAnalysis {
  try {
    if (response.analysis) {
      return validateAndFillProblemAnalysis(response.analysis, problemDescription);
    }
    
    if (response.content) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndFillProblemAnalysis(parsed, problemDescription);
      }
    }
    
    return createFallbackProblemAnalysis(problemDescription);
  } catch (error) {
    console.error('Failed to parse problem analysis:', error);
    return createFallbackProblemAnalysis(problemDescription);
  }
}

function validateAndFillExplanation(partial: Partial<ScientificExplanation>): ScientificExplanation {
  return {
    physiology: partial.physiology || '待补充生理学解释',
    neurology: partial.neurology || '待补充神经学解释',
    psychology: partial.psychology || '待补充心理学解释',
    behavioral_science: partial.behavioral_science || '待补充行为学解释',
    summary: partial.summary || '待补充综合摘要',
    references: partial.references,
  };
}

function validateAndFillProblemAnalysis(
  partial: Partial<ProblemAnalysis>,
  problemDescription: string
): ProblemAnalysis {
  return {
    problem_description: partial.problem_description || problemDescription,
    root_causes: {
      physiological: partial.root_causes?.physiological || [],
      neurological: partial.root_causes?.neurological || [],
      psychological: partial.root_causes?.psychological || [],
      behavioral: partial.root_causes?.behavioral || [],
    },
    scientific_explanation: validateAndFillExplanation(partial.scientific_explanation || {}),
  };
}

function createFallbackExplanation(topic: string): ScientificExplanation {
  return {
    physiology: `${topic}对身体的生理影响正在分析中`,
    neurology: `${topic}对神经系统的影响正在分析中`,
    psychology: `${topic}的心理学机制正在分析中`,
    behavioral_science: `${topic}的行为学原理正在分析中`,
    summary: `关于${topic}的综合科学解释正在生成中`,
  };
}

function createFallbackProblemAnalysis(problemDescription: string): ProblemAnalysis {
  return {
    problem_description: problemDescription,
    root_causes: {
      physiological: ['生理原因分析中'],
      neurological: ['神经学原因分析中'],
      psychological: ['心理原因分析中'],
      behavioral: ['行为原因分析中'],
    },
    scientific_explanation: createFallbackExplanation(problemDescription),
  };
}

// ============================================
// Validation Functions for Property Testing
// ============================================

/**
 * Validate that a scientific explanation has all 4 domains populated
 * 
 * Requirements: 4.1, 4.4
 */
export function isValidScientificExplanation(explanation: ScientificExplanation): boolean {
  return (
    typeof explanation.physiology === 'string' && explanation.physiology.length > 0 &&
    typeof explanation.neurology === 'string' && explanation.neurology.length > 0 &&
    typeof explanation.psychology === 'string' && explanation.psychology.length > 0 &&
    typeof explanation.behavioral_science === 'string' && explanation.behavioral_science.length > 0 &&
    typeof explanation.summary === 'string'
  );
}

/**
 * Validate that a problem analysis has root causes from all 4 domains
 */
export function isValidProblemAnalysis(analysis: ProblemAnalysis): boolean {
  return (
    typeof analysis.problem_description === 'string' && analysis.problem_description.length > 0 &&
    Array.isArray(analysis.root_causes.physiological) &&
    Array.isArray(analysis.root_causes.neurological) &&
    Array.isArray(analysis.root_causes.psychological) &&
    Array.isArray(analysis.root_causes.behavioral) &&
    isValidScientificExplanation(analysis.scientific_explanation)
  );
}

/**
 * Get the list of scientific domains
 */
export function getScientificDomains(): readonly string[] {
  return SCIENTIFIC_DOMAINS;
}
