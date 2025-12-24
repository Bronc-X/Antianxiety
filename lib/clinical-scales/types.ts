/**
 * Clinical Scales Library - Types
 * 
 * Shared types for all clinical assessment scales
 */

export interface ScaleQuestion {
    id: string;
    text: string;
    textEn?: string;
    options: ScaleOption[];
    isSafetyQuestion?: boolean;
    safetyThreshold?: number;
}

export interface ScaleOption {
    value: number;
    label: string;
    labelEn?: string;
}

export interface ScaleDefinition {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    questions: ScaleQuestion[];
    shortVersion?: {
        questionIds: string[];
        triggerThreshold: number;
    };
    scoring: {
        minScore: number;
        maxScore: number;
        interpretation: ScoreInterpretation[];
    };
    sourceAttribution?: SourceAttribution;
}

export interface SourceAttribution {
    originalCitation: {
        authors: string;
        year: number;
        title: string;
        journal: string;
        doi?: string;
        pmid?: string;
    };
    developingInstitution: string;
    developingInstitutionEn?: string;
    validationStatus: 'validated' | 'widely_used' | 'experimental';
    chineseValidation?: {
        authors: string;
        year: number;
        title?: string;
        journal: string;
    };
    briefDescription?: string;
    primaryUseCase?: string;
    copyrightStatus?: 'public_domain' | 'licensed' | 'restricted';
    usagePermission?: string;
    officialUrl?: string;
}

export interface ScoreInterpretation {
    minScore: number;
    maxScore: number;
    level: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
    label: string;
    labelEn: string;
}

export interface UserScaleResponse {
    userId: string;
    scaleId: string;
    questionId: string;
    answerValue: number;
    answerText?: string;
    source: 'onboarding' | 'daily' | 'weekly' | 'monthly' | 'triggered' | 'chat' | 'active_inquiry';
    createdAt: Date;
}

export interface ScaleTriggerLog {
    userId: string;
    shortScale: string;
    shortScore: number;
    triggeredFullScale?: string;
    triggerReason: string;
    confidence: number;
    createdAt: Date;
}
