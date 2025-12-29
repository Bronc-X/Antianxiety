package com.antianxiety.app.domain.engine

import com.antianxiety.app.domain.model.*
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Health Assessment Engine
 * 
 * Core evaluation engine implementing cross-analysis logic for identifying
 * "deep-level root causes" (深层病灶) from user questionnaire data.
 * 
 * Mirrors web version: lib/health-assessment-engine.ts
 */
@Singleton
class HealthAssessmentEngine @Inject constructor() {
    
    companion object {
        // Clinical thresholds
        private const val BMI_OVERWEIGHT_THRESHOLD = 24f
        private const val WAIST_LINE_MALE_THRESHOLD = 90f
        private const val WAIST_LINE_FEMALE_THRESHOLD = 85f
        private const val GAD7_MODERATE_ANXIETY_THRESHOLD = 10
        private const val SHSQ25_SUBHEALTH_THRESHOLD = 38
    }
    
    fun runAssessment(
        userProfile: UserProfile,
        scores: QuestionnaireScores
    ): HealthAssessmentResult {
        val tags = mutableSetOf<String>()
        val report = mutableListOf<String>()
        val reportEn = mutableListOf<String>()
        val scaleResults = mutableListOf<ScaleResult>()
        var crossAnalysis: CrossAnalysisResult? = null
        var bmi: Float? = null
        
        // Step 1: Basic metrics
        if (userProfile.height != null && userProfile.weight != null && userProfile.height > 0) {
            bmi = userProfile.weight / (userProfile.height * userProfile.height)
            
            if (bmi > BMI_OVERWEIGHT_THRESHOLD) {
                report.add("【体型警示】您的 BMI 显示超重。")
                reportEn.add("[Body Alert] Your BMI indicates overweight.")
                
                val waistThreshold = if (userProfile.gender == Gender.FEMALE) 
                    WAIST_LINE_FEMALE_THRESHOLD else WAIST_LINE_MALE_THRESHOLD
                
                if (userProfile.waistLine != null && userProfile.waistLine > waistThreshold) {
                    tags.add(AvailableTags.CENTRAL_OBESITY)
                    report.add("【关键风险】检测到"中心性肥胖"，这意味着内脏脂肪堆积，通常与胰岛素抵抗有关。")
                    reportEn.add("[Critical Risk] Central obesity detected. This indicates visceral fat accumulation.")
                }
            }
        }
        
        // Step 2: Process GAD-7
        if (scores.gad7 != null && scores.gad7.isNotEmpty()) {
            val gad7Result = calculateGAD7Score(scores.gad7)
            scaleResults.add(gad7Result)
            tags.addAll(gad7Result.tags)
            
            if (gad7Result.totalScore >= GAD7_MODERATE_ANXIETY_THRESHOLD) {
                report.add("【神经系统】您处于中度以上焦虑状态。这种心理压力会导致体内"皮质醇"长期升高。")
                reportEn.add("[Nervous System] You are in a moderate-to-severe anxiety state.")
            }
        }
        
        // Step 3: Cross-analysis
        // Scenario A: Stress Belly
        if (tags.contains(AvailableTags.HIGH_CORTISOL_RISK) && 
            tags.contains(AvailableTags.CENTRAL_OBESITY)) {
            tags.add(AvailableTags.STRESS_BELLY)
            crossAnalysis = CrossAnalysisResult(
                syndrome = "压力型肥胖 (Stress Belly)",
                syndromeEn = "Stress Belly Syndrome",
                insight = "【深度洞察：您不是单纯的胖，是"过劳肥"】\n系统检测到您的肥胖与高焦虑水平强相关。",
                insightEn = "[Deep Insight: You're not just overweight - it's \"Stress Belly\"]\nThe system detected a strong correlation between your obesity and high anxiety levels.",
                recommendation = "方案A：减压降脂-舒缓调理包"
            )
            report.add(crossAnalysis.insight)
            reportEn.add(crossAnalysis.insightEn)
        }
        
        // Calculate severity
        val severity = when {
            tags.contains(AvailableTags.SEVERE_ANXIETY) ||
            tags.contains(AvailableTags.STRESS_BELLY) ||
            tags.contains(AvailableTags.HORMONAL_DECLINE) ||
            tags.size >= 4 -> AssessmentSeverity.HIGH
            
            tags.contains(AvailableTags.HIGH_CORTISOL_RISK) ||
            tags.contains(AvailableTags.METABOLIC_DECLINE) ||
            tags.contains(AvailableTags.SUB_HEALTH) ||
            tags.size >= 2 -> AssessmentSeverity.MEDIUM
            
            else -> AssessmentSeverity.LOW
        }
        
        return HealthAssessmentResult(
            userId = userProfile.id,
            tags = tags.toList(),
            analysisReport = report,
            analysisReportEn = reportEn,
            scaleResults = scaleResults,
            crossAnalysis = crossAnalysis,
            bmi = bmi,
            severity = severity,
            timestamp = Instant.now().toString()
        )
    }
    
    private fun calculateGAD7Score(answers: Map<String, String>): ScaleResult {
        val scoreMap = mapOf(
            "not_at_all" to 0,
            "several_days" to 1,
            "more_than_half" to 2,
            "nearly_every_day" to 3
        )
        
        var totalScore = 0
        for ((_, answer) in answers) {
            totalScore += scoreMap[answer] ?: 0
        }
        
        val severity = when {
            totalScore <= 4 -> "极轻微焦虑"
            totalScore <= 9 -> "轻度焦虑"
            totalScore <= 14 -> "中度焦虑"
            else -> "重度焦虑"
        }
        
        val tags = mutableListOf<String>()
        if (totalScore >= 10) tags.add(AvailableTags.HIGH_CORTISOL_RISK)
        if (totalScore >= 15) tags.add(AvailableTags.SEVERE_ANXIETY)
        
        return ScaleResult(
            scaleId = "gad7",
            totalScore = totalScore,
            severity = severity,
            tags = tags
        )
    }
}
