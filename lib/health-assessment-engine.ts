/**
 * Health Assessment Engine
 * 
 * Core evaluation engine implementing cross-analysis logic for identifying
 * "deep-level root causes" (深层病灶) from user questionnaire data.
 * 
 * Key Features:
 * - Basic metrics analysis (BMI, waist circumference)
 * - Metabolic status analysis (from scales like AMS)
 * - Stress/cortisol analysis (from GAD-7)
 * - Cross-analysis for syndromes like "Stress Belly", "Hormonal Decline"
 * 
 * Design Principle: "用真相打破焦虑" - Truth vs Anxiety
 */

import {
    type ScaleResult,
    calculateScaleScore,
    GAD7_SCALE,
    SHSQ25_SCALE,
} from './questionnaire-scales';

// ============ Types ============

export interface UserProfile {
    id: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    height?: number;      // in meters (e.g., 1.75)
    weight?: number;      // in kg
    waistLine?: number;   // in cm
}

export interface QuestionnaireScores {
    gad7?: Record<string, string>;   // GAD-7 answers
    shsq25?: Record<string, string>; // SHSQ-25 answers
    ams?: Record<string, string>;    // AMS answers (future)
    mrs?: Record<string, string>;    // MRS answers (future)
    customData?: {
        muscleWeakness?: boolean;
        hairSkinScore?: number;
    };
}

export interface CrossAnalysisResult {
    syndrome: string;
    syndromeEn: string;
    insight: string;
    insightEn: string;
    recommendation?: string;
}

export interface HealthAssessmentResult {
    userId: string;
    tags: string[];                       // User tags for CRM/recommendation
    analysisReport: string[];             // Report paragraphs (Chinese)
    analysisReportEn: string[];           // Report paragraphs (English)
    scaleResults: ScaleResult[];          // Individual scale results
    crossAnalysis?: CrossAnalysisResult;  // Cross-analysis if triggered
    bmi?: number;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
}

// ============ Constants ============

// Clinical thresholds
const BMI_OVERWEIGHT_THRESHOLD = 24;
const WAIST_LINE_MALE_THRESHOLD = 90;    // cm
const WAIST_LINE_FEMALE_THRESHOLD = 85;  // cm
const GAD7_MODERATE_ANXIETY_THRESHOLD = 10;
const SHSQ25_SUBHEALTH_THRESHOLD = 38;

// Predefined tags
export const AVAILABLE_TAGS = [
    // Anxiety/Stress Related
    '高皮质醇风险',
    '重度焦虑',
    '情绪困扰',

    // Metabolic Related
    '中心性肥胖',
    '代谢低谷期',
    '亚健康状态',

    // Physical Related
    '慢性疲劳',
    '免疫力差',
    '睡眠障碍',

    // Cross-Analysis Syndromes
    '压力型肥胖',
    '激素衰退型',
] as const;

export type UserTag = typeof AVAILABLE_TAGS[number];

// ============ Main Engine Class ============

export class HealthAssessmentEngine {
    private user: UserProfile;
    private scores: QuestionnaireScores;
    private report: string[] = [];
    private reportEn: string[] = [];
    private tags: Set<string> = new Set();
    private scaleResults: ScaleResult[] = [];
    private crossAnalysis?: CrossAnalysisResult;
    private bmi?: number;

    constructor(userProfile: UserProfile, scores: QuestionnaireScores) {
        this.user = userProfile;
        this.scores = scores;
    }

    /**
     * Execute full assessment pipeline
     */
    runAssessment(): HealthAssessmentResult {
        // Step 1: Basic metrics (BMI, waist)
        this._checkBasicMetrics();

        // Step 2: Process questionnaire scales
        this._processScales();

        // Step 3: Analyze metabolic status (from SHSQ-25 fatigue/immune dimensions)
        this._analyzeMetabolicStatus();

        // Step 4: Analyze stress/cortisol (from GAD-7)
        this._analyzeStressCortisol();

        // Step 5: Cross-analysis for root cause identification
        this._crossAnalysisRootCause();

        // Step 6: Determine overall severity
        const severity = this._calculateOverallSeverity();

        return {
            userId: this.user.id,
            tags: Array.from(this.tags),
            analysisReport: this.report,
            analysisReportEn: this.reportEn,
            scaleResults: this.scaleResults,
            crossAnalysis: this.crossAnalysis,
            bmi: this.bmi,
            severity,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Step 1: Basic physiological metrics analysis
     */
    private _checkBasicMetrics(): void {
        // BMI Calculation
        if (this.user.height && this.user.weight && this.user.height > 0) {
            this.bmi = this.user.weight / (this.user.height * this.user.height);

            if (this.bmi > BMI_OVERWEIGHT_THRESHOLD) {
                this.report.push('【体型警示】您的 BMI 显示超重。');
                this.reportEn.push('[Body Alert] Your BMI indicates overweight.');

                // Check waist circumference for central obesity
                const waistThreshold = this.user.gender === 'female'
                    ? WAIST_LINE_FEMALE_THRESHOLD
                    : WAIST_LINE_MALE_THRESHOLD;

                if (this.user.waistLine && this.user.waistLine > waistThreshold) {
                    this.tags.add('中心性肥胖');
                    this.report.push(
                        '【关键风险】检测到"中心性肥胖"，这意味着内脏脂肪堆积，通常与胰岛素抵抗有关。'
                    );
                    this.reportEn.push(
                        '[Critical Risk] Central obesity detected. This indicates visceral fat accumulation, typically associated with insulin resistance.'
                    );
                }
            }
        }
    }

    /**
     * Step 2: Process all questionnaire scales
     */
    private _processScales(): void {
        // Process GAD-7 if available
        if (this.scores.gad7 && Object.keys(this.scores.gad7).length > 0) {
            const gad7Result = calculateScaleScore(GAD7_SCALE, this.scores.gad7);
            this.scaleResults.push(gad7Result);

            // Add tags from scale
            for (const tag of gad7Result.tags) {
                this.tags.add(tag);
            }
        }

        // Process SHSQ-25 if available
        if (this.scores.shsq25 && Object.keys(this.scores.shsq25).length > 0) {
            const shsqResult = calculateScaleScore(SHSQ25_SCALE, this.scores.shsq25);
            this.scaleResults.push(shsqResult);

            // Add tags from scale
            for (const tag of shsqResult.tags) {
                this.tags.add(tag);
            }
        }
    }

    /**
     * Step 3: Analyze metabolic status from SHSQ-25 dimensions
     */
    private _analyzeMetabolicStatus(): void {
        const shsqResult = this.scaleResults.find(r => r.scaleId === 'shsq25');

        if (shsqResult && shsqResult.totalScore >= SHSQ25_SUBHEALTH_THRESHOLD) {
            this.tags.add('代谢低谷期');
            this.report.push(
                '【代谢机能】您的主动代谢能力正在显著下滑。这解释了为什么您感觉"喝凉水都长肉"以及精力无法支撑一整天的工作。'
            );
            this.reportEn.push(
                '[Metabolic Function] Your active metabolism is significantly declining. This explains why you feel like you gain weight easily and lack energy throughout the day.'
            );
        }

        // Check fatigue subscore specifically
        if (shsqResult?.subscores?.fatigue && shsqResult.subscores.fatigue >= 18) {
            this.report.push(
                '【疲劳警示】检测到慢性疲劳症状，可能与线粒体功能下降或 HPA 轴失调有关。'
            );
            this.reportEn.push(
                '[Fatigue Alert] Chronic fatigue symptoms detected, possibly related to mitochondrial dysfunction or HPA axis dysregulation.'
            );
        }

        // Check sleep subscore from mental dimension
        if (shsqResult?.subscores?.mental && shsqResult.subscores.mental >= 8) {
            this.tags.add('睡眠障碍');
        }
    }

    /**
     * Step 4: Analyze stress/cortisol from GAD-7
     */
    private _analyzeStressCortisol(): void {
        const gad7Result = this.scaleResults.find(r => r.scaleId === 'gad7');

        if (gad7Result && gad7Result.totalScore >= GAD7_MODERATE_ANXIETY_THRESHOLD) {
            this.report.push(
                '【神经系统】您处于中度以上焦虑状态。这种心理压力会导致体内"皮质醇"长期升高。'
            );
            this.reportEn.push(
                '[Nervous System] You are in a moderate-to-severe anxiety state. This psychological stress can lead to chronically elevated cortisol levels.'
            );
        }
    }

    /**
     * Step 5: Cross-analysis for identifying root causes
     * This is the CORE commercial value - identifying syndromes that single scales miss
     */
    private _crossAnalysisRootCause(): void {
        // Scenario A: Stress Belly (压力型肥胖)
        // Logic: High anxiety + Central obesity
        if (this.tags.has('高皮质醇风险') && this.tags.has('中心性肥胖')) {
            this.tags.add('压力型肥胖');

            this.crossAnalysis = {
                syndrome: '压力型肥胖 (Stress Belly)',
                syndromeEn: 'Stress Belly Syndrome',
                insight: `【深度洞察：您不是单纯的胖，是"过劳肥"】
系统检测到您的肥胖与高焦虑水平强相关。
高水平的皮质醇正在分解您的肌肉并促进腹部脂肪堆积。
结论：单纯的健身房举铁不仅无效，反而可能加重身体压力。`,
                insightEn: `[Deep Insight: You're not just overweight - it's "Stress Belly"]
The system detected a strong correlation between your obesity and high anxiety levels.
Elevated cortisol is breaking down muscle and promoting abdominal fat storage.
Conclusion: Gym weight training alone is not only ineffective but may worsen body stress.`,
                recommendation: '方案A：减压降脂-舒缓调理包',
            };

            this.report.push(this.crossAnalysis.insight);
            this.reportEn.push(this.crossAnalysis.insightEn);
        }
        // Scenario B: Hormonal Decline (激素衰退型)
        // Logic: Metabolic decline + Muscle weakness
        else if (
            this.tags.has('代谢低谷期') &&
            this.scores.customData?.muscleWeakness === true
        ) {
            this.tags.add('激素衰退型');

            this.crossAnalysis = {
                syndrome: '激素衰退型 (Hormonal Decline)',
                syndromeEn: 'Hormonal Decline Syndrome',
                insight: `【深度洞察：身体正在"生锈"】
您的体重问题并非源于饮食过量，而是基础合成代谢激素（如睾酮/生长激素）水平下降。
您的身体处于"分解模式"。
结论：您急需抗阻力训练和特定的微量元素补充（锌/镁/D3）来重启引擎。`,
                insightEn: `[Deep Insight: Your body is "rusting"]
Your weight issue is not from overeating, but from declining anabolic hormones (testosterone/growth hormone).
Your body is in "catabolic mode".
Conclusion: You urgently need resistance training and specific micronutrient supplementation (Zinc/Magnesium/D3) to restart the engine.`,
                recommendation: '方案B：荷尔蒙重启-力量重塑包',
            };

            this.report.push(this.crossAnalysis.insight);
            this.reportEn.push(this.crossAnalysis.insightEn);
        }
        // Scenario C: Anxiety-Fatigue Loop (焦虑-疲劳恶性循环)
        // Logic: High anxiety + Chronic fatigue
        else if (
            this.tags.has('高皮质醇风险') &&
            this.tags.has('慢性疲劳')
        ) {
            this.crossAnalysis = {
                syndrome: '焦虑-疲劳恶性循环',
                syndromeEn: 'Anxiety-Fatigue Vicious Cycle',
                insight: `【深度洞察：您陷入了"越焦虑越累，越累越焦虑"的循环】
系统检测到焦虑和慢性疲劳同时存在。
这表明您的 HPA 轴（下丘脑-垂体-肾上腺轴）可能处于失调状态。
结论：需要同时干预情绪和体能，单独处理任何一方都难以打破循环。`,
                insightEn: `[Deep Insight: You're in an "anxiety breeds fatigue, fatigue breeds anxiety" loop]
The system detected the coexistence of anxiety and chronic fatigue.
This indicates your HPA axis may be dysregulated.
Conclusion: Both emotional and physical interventions are needed - addressing either alone won't break the cycle.`,
            };

            this.report.push(this.crossAnalysis.insight);
            this.reportEn.push(this.crossAnalysis.insightEn);
        }
    }

    /**
     * Calculate overall severity based on tags and scores
     */
    private _calculateOverallSeverity(): 'low' | 'medium' | 'high' {
        // High severity conditions
        if (
            this.tags.has('重度焦虑') ||
            this.tags.has('压力型肥胖') ||
            this.tags.has('激素衰退型') ||
            this.tags.size >= 4
        ) {
            return 'high';
        }

        // Medium severity conditions
        if (
            this.tags.has('高皮质醇风险') ||
            this.tags.has('代谢低谷期') ||
            this.tags.has('亚健康状态') ||
            this.tags.size >= 2
        ) {
            return 'medium';
        }

        return 'low';
    }
}

// ============ Utility Functions ============

/**
 * Run assessment and return result (functional style)
 */
export function runHealthAssessment(
    userProfile: UserProfile,
    scores: QuestionnaireScores
): HealthAssessmentResult {
    const engine = new HealthAssessmentEngine(userProfile, scores);
    return engine.runAssessment();
}

/**
 * Extract tags from assessment result for database storage
 */
export function extractTagsForStorage(result: HealthAssessmentResult): string[] {
    return result.tags.filter(tag =>
        AVAILABLE_TAGS.includes(tag as UserTag)
    );
}

/**
 * Check if assessment result requires immediate attention
 */
export function requiresImmediateAttention(result: HealthAssessmentResult): boolean {
    return (
        result.severity === 'high' ||
        result.tags.includes('重度焦虑') ||
        result.crossAnalysis !== undefined
    );
}

/**
 * Get localized report based on language preference
 */
export function getLocalizedReport(
    result: HealthAssessmentResult,
    language: 'zh' | 'en' = 'zh'
): string[] {
    return language === 'en' ? result.analysisReportEn : result.analysisReport;
}
