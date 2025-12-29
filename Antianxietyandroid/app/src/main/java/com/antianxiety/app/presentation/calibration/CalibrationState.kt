package com.antianxiety.app.presentation.calibration

import com.antianxiety.app.domain.model.CalibrationQuestion
import com.antianxiety.app.domain.model.HealthAssessmentResult

/**
 * Calibration Screen UI State
 */
data class CalibrationUiState(
    val step: CalibrationStep = CalibrationStep.WELCOME,
    val questions: List<CalibrationQuestion> = emptyList(),
    val currentQuestionIndex: Int = 0,
    val answers: Map<String, Any> = emptyMap(),
    val isLoading: Boolean = false,
    val hasCompletedToday: Boolean = false,
    val assessmentResult: HealthAssessmentResult? = null,
    val error: String? = null,
    val userName: String? = null,
    
    // Source ratio display
    val sourceScales: Int = 30,
    val sourceLogic: Int = 30,
    val sourceAI: Int = 40
) {
    val currentQuestion: CalibrationQuestion?
        get() = questions.getOrNull(currentQuestionIndex)
    
    val progressPercent: Float
        get() = if (questions.isEmpty()) 0f 
                else (currentQuestionIndex + 1).toFloat() / questions.size
    
    val isLastQuestion: Boolean
        get() = currentQuestionIndex >= questions.size - 1
}

enum class CalibrationStep {
    WELCOME,
    QUESTIONS,
    ANALYZING,
    RESULT
}

/**
 * Calibration Events
 */
sealed interface CalibrationEvent {
    data object StartCalibration : CalibrationEvent
    data class AnswerQuestion(val questionId: String, val answer: Any) : CalibrationEvent
    data object NextQuestion : CalibrationEvent
    data object PreviousQuestion : CalibrationEvent
    data object RunAssessment : CalibrationEvent
    data object Reset : CalibrationEvent
}
