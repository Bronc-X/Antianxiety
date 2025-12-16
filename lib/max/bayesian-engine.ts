/**
 * Bayesian Belief Engine
 * Calculates posterior probabilities for anxiety reframing
 * 
 * Formula: Posterior = (Prior × Likelihood) / Evidence
 * 
 * @module lib/max/bayesian-engine
 */

import {
  BeliefInput,
  BeliefOutput,
  Paper,
  CalculationStep,
  HRVData,
  EVIDENCE_WEIGHT_RANGE
} from '@/types/max';

/**
 * Clamps a value to a specified range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates evidence weight from paper relevance scores
 * Returns a value between 0.1 and 0.9
 */
export function calculateEvidenceWeight(papers: Paper[]): number {
  if (!papers || papers.length === 0) {
    // Default evidence weight when no papers
    return 0.5;
  }

  // Average relevance score of papers
  const avgRelevance = papers.reduce((sum, p) => sum + p.relevance_score, 0) / papers.length;
  
  // Map to evidence weight range (0.1 - 0.9)
  // Higher relevance = higher evidence weight = lower posterior
  const weight = EVIDENCE_WEIGHT_RANGE.min + 
    (avgRelevance * (EVIDENCE_WEIGHT_RANGE.max - EVIDENCE_WEIGHT_RANGE.min));
  
  return clamp(weight, EVIDENCE_WEIGHT_RANGE.min, EVIDENCE_WEIGHT_RANGE.max);
}

/**
 * Calculates likelihood from HRV data
 * Returns a value between 0 and 1
 */
export function calculateLikelihood(hrvData?: HRVData): number {
  if (!hrvData) {
    // Default likelihood when no HRV data
    return 0.5;
  }

  // RMSSD (Root Mean Square of Successive Differences)
  // Higher RMSSD = better parasympathetic activity = lower anxiety likelihood
  // Typical range: 20-100ms for adults
  let likelihood = 0.5;

  if (hrvData.rmssd !== undefined) {
    // Normalize RMSSD: higher values indicate calmer state
    // Map 20-100ms to 0.8-0.2 likelihood (inverse relationship)
    const normalizedRmssd = clamp((hrvData.rmssd - 20) / 80, 0, 1);
    likelihood = 0.8 - (normalizedRmssd * 0.6);
  }

  // LF/HF ratio: lower ratio = more parasympathetic = calmer
  if (hrvData.lf_hf_ratio !== undefined) {
    // Typical range: 0.5-2.0
    const normalizedRatio = clamp(hrvData.lf_hf_ratio / 2, 0, 1);
    likelihood = (likelihood + normalizedRatio) / 2;
  }

  return clamp(likelihood, 0.01, 0.99);
}

/**
 * Calculates the posterior probability using Bayesian formula
 * Posterior = (Prior × Likelihood) / Evidence
 */
export function calculateBayesianPosterior(
  prior: number,
  likelihood: number,
  evidence: number
): number {
  // Ensure evidence is never zero to prevent division by zero
  const safeEvidence = Math.max(evidence, EVIDENCE_WEIGHT_RANGE.min);
  
  // Apply Bayesian formula
  const posterior = (prior * likelihood) / safeEvidence;
  
  // Clamp to 0-100 range
  return clamp(Math.round(posterior), 0, 100);
}

/**
 * Main function to calculate posterior from belief input
 */
export async function calculatePosterior(input: BeliefInput): Promise<BeliefOutput> {
  const { prior, hrv_data, paper_ids } = input;
  
  // Validate prior
  const validPrior = clamp(prior, 0, 100);
  
  // Get papers (in real implementation, fetch from Semantic Scholar)
  const papers: Paper[] = paper_ids?.map(id => ({
    id,
    title: `Paper ${id}`,
    relevance_score: 0.7, // Default relevance
    url: `https://semanticscholar.org/paper/${id}`
  })) || [];
  
  // Calculate components
  const likelihood = calculateLikelihood(hrv_data);
  const evidence = calculateEvidenceWeight(papers);
  const posterior = calculateBayesianPosterior(validPrior, likelihood, evidence);
  
  // Build calculation steps for visualization
  const calculation_steps: CalculationStep[] = [
    { step: 1, description: 'Initial belief (Prior)', value: validPrior },
    { step: 2, description: 'Physiological likelihood', value: Math.round(likelihood * 100) },
    { step: 3, description: 'Evidence weight', value: Math.round(evidence * 100) },
    { step: 4, description: 'Adjusted probability (Posterior)', value: posterior }
  ];
  
  return {
    prior: validPrior,
    likelihood,
    evidence,
    posterior,
    papers_used: papers,
    calculation_steps
  };
}

/**
 * Simplified calculation for testing without async
 */
export function calculatePosteriorSync(
  prior: number,
  likelihood: number,
  evidence: number
): number {
  return calculateBayesianPosterior(prior, likelihood, evidence);
}
