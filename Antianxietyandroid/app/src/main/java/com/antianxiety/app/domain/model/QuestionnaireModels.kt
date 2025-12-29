package com.antianxiety.app.domain.model

import kotlinx.serialization.Serializable

/**
 * Questionnaire Scale Definition
 * Mirrors web version: lib/questionnaire-scales.ts
 */

@Serializable
data class ScaleQuestion(
    val id: String,
    val text: String,
    val textEn: String,
    val options: List<ScaleOption>
)

@Serializable
data class ScaleOption(
    val label: String,
    val labelEn: String,
    val value: String,
    val score: Int
)

@Serializable
data class ScaleThreshold(
    val minScore: Int,
    val maxScore: Int,
    val severity: Severity,
    val label: String,
    val labelEn: String
)

enum class Severity {
    MINIMAL, MILD, MODERATE, SEVERE
}

@Serializable
data class TagMapping(
    val tag: String,
    val tagEn: String
)

@Serializable
data class ScaleDefinition(
    val id: String,
    val name: String,
    val nameEn: String,
    val description: String,
    val source: String,
    val questions: List<ScaleQuestion>,
    val thresholds: List<ScaleThreshold>
)

@Serializable
data class ScaleResult(
    val scaleId: String,
    val totalScore: Int,
    val subscores: Map<String, Int>? = null,
    val severity: String,
    val tags: List<String>
)

/**
 * Calibration Question for daily check-in
 */
@Serializable
data class CalibrationQuestion(
    val id: String,
    val type: QuestionType,
    val question: String,
    val inputType: InputType,
    val options: List<QuestionOption>? = null,
    val min: Int? = null,
    val max: Int? = null,
    val goalRelation: String? = null
)

enum class QuestionType {
    ANCHOR, ADAPTIVE, EVOLUTION
}

enum class InputType {
    SINGLE, SLIDER, TEXT
}

@Serializable
data class QuestionOption(
    val label: String,
    val value: String
)
