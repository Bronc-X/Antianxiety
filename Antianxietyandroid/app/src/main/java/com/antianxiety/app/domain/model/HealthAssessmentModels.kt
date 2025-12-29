package com.antianxiety.app.domain.model

import kotlinx.serialization.Serializable

/**
 * Health Assessment Result
 * Mirrors web version: lib/health-assessment-engine.ts
 */

@Serializable
data class UserProfile(
    val id: String,
    val gender: Gender? = null,
    val age: Int? = null,
    val height: Float? = null,  // in meters
    val weight: Float? = null,  // in kg
    val waistLine: Float? = null  // in cm
)

enum class Gender {
    MALE, FEMALE, OTHER
}

@Serializable
data class QuestionnaireScores(
    val gad7: Map<String, String>? = null,
    val shsq25: Map<String, String>? = null,
    val customData: CustomData? = null
)

@Serializable
data class CustomData(
    val muscleWeakness: Boolean? = null,
    val hairSkinScore: Int? = null
)

@Serializable
data class CrossAnalysisResult(
    val syndrome: String,
    val syndromeEn: String,
    val insight: String,
    val insightEn: String,
    val recommendation: String? = null
)

@Serializable
data class HealthAssessmentResult(
    val userId: String,
    val tags: List<String>,
    val analysisReport: List<String>,
    val analysisReportEn: List<String>,
    val scaleResults: List<ScaleResult>,
    val crossAnalysis: CrossAnalysisResult? = null,
    val bmi: Float? = null,
    val severity: AssessmentSeverity,
    val timestamp: String
)

enum class AssessmentSeverity {
    LOW, MEDIUM, HIGH
}

/**
 * Predefined tags available in the system
 */
object AvailableTags {
    // Anxiety/Stress Related
    const val HIGH_CORTISOL_RISK = "高皮质醇风险"
    const val SEVERE_ANXIETY = "重度焦虑"
    const val EMOTIONAL_DISTRESS = "情绪困扰"
    
    // Metabolic Related
    const val CENTRAL_OBESITY = "中心性肥胖"
    const val METABOLIC_DECLINE = "代谢低谷期"
    const val SUB_HEALTH = "亚健康状态"
    
    // Physical Related
    const val CHRONIC_FATIGUE = "慢性疲劳"
    const val WEAK_IMMUNITY = "免疫力差"
    const val SLEEP_DISORDER = "睡眠障碍"
    
    // Cross-Analysis Syndromes
    const val STRESS_BELLY = "压力型肥胖"
    const val HORMONAL_DECLINE = "激素衰退型"
    
    val ALL = listOf(
        HIGH_CORTISOL_RISK, SEVERE_ANXIETY, EMOTIONAL_DISTRESS,
        CENTRAL_OBESITY, METABOLIC_DECLINE, SUB_HEALTH,
        CHRONIC_FATIGUE, WEAK_IMMUNITY, SLEEP_DISORDER,
        STRESS_BELLY, HORMONAL_DECLINE
    )
}
