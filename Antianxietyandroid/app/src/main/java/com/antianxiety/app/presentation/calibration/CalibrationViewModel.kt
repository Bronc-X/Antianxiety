package com.antianxiety.app.presentation.calibration

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.antianxiety.app.domain.engine.CalibrationEngine
import com.antianxiety.app.domain.engine.HealthAssessmentEngine
import com.antianxiety.app.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CalibrationViewModel @Inject constructor(
    private val calibrationEngine: CalibrationEngine,
    private val healthAssessmentEngine: HealthAssessmentEngine
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState.asStateFlow()
    
    init {
        // Initialize source ratios
        val (scales, logic, ai) = calibrationEngine.getSourceRatioDisplay()
        _uiState.update { it.copy(sourceScales = scales, sourceLogic = logic, sourceAI = ai) }
    }
    
    fun onEvent(event: CalibrationEvent) {
        when (event) {
            is CalibrationEvent.StartCalibration -> startCalibration()
            is CalibrationEvent.AnswerQuestion -> answerQuestion(event.questionId, event.answer)
            is CalibrationEvent.NextQuestion -> nextQuestion()
            is CalibrationEvent.PreviousQuestion -> previousQuestion()
            is CalibrationEvent.RunAssessment -> runAssessment()
            is CalibrationEvent.Reset -> reset()
        }
    }
    
    private fun startCalibration() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                // Simulate network delay
                delay(300)
                
                val questions = calibrationEngine.generateDailyQuestions(0)
                
                _uiState.update { 
                    it.copy(
                        step = CalibrationStep.QUESTIONS,
                        questions = questions,
                        currentQuestionIndex = 0,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    private fun answerQuestion(questionId: String, answer: Any) {
        _uiState.update { state ->
            val newAnswers = state.answers.toMutableMap()
            newAnswers[questionId] = answer
            state.copy(answers = newAnswers)
        }
        
        // Auto-advance after brief delay
        viewModelScope.launch {
            delay(400)
            if (_uiState.value.isLastQuestion) {
                runAssessment()
            } else {
                nextQuestion()
            }
        }
    }
    
    private fun nextQuestion() {
        _uiState.update { state ->
            if (state.currentQuestionIndex < state.questions.size - 1) {
                state.copy(currentQuestionIndex = state.currentQuestionIndex + 1)
            } else {
                state
            }
        }
    }
    
    private fun previousQuestion() {
        _uiState.update { state ->
            if (state.currentQuestionIndex > 0) {
                state.copy(currentQuestionIndex = state.currentQuestionIndex - 1)
            } else {
                state
            }
        }
    }
    
    private fun runAssessment() {
        viewModelScope.launch {
            _uiState.update { it.copy(step = CalibrationStep.ANALYZING, isLoading = true) }
            
            try {
                // Simulate analysis time for visual effect
                delay(2000)
                
                // Build scores from answers
                val gad7Answers = mutableMapOf<String, String>()
                val answers = _uiState.value.answers
                
                // Map stress level to GAD-7 proxy
                val stressLevel = answers["anchor_stress_level"] as? String
                if (stressLevel != null) {
                    val mapped = when (stressLevel) {
                        "low" -> "not_at_all"
                        "medium" -> "several_days"
                        "high" -> "more_than_half"
                        else -> "several_days"
                    }
                    gad7Answers["gad7_1"] = mapped
                    gad7Answers["gad7_2"] = mapped
                    gad7Answers["gad7_3"] = mapped
                }
                
                // Run assessment
                val result = healthAssessmentEngine.runAssessment(
                    userProfile = UserProfile(id = "demo_user"),
                    scores = QuestionnaireScores(
                        gad7 = if (gad7Answers.isNotEmpty()) gad7Answers else null
                    )
                )
                
                _uiState.update {
                    it.copy(
                        step = CalibrationStep.RESULT,
                        assessmentResult = result,
                        hasCompletedToday = true,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        step = CalibrationStep.RESULT,
                        isLoading = false,
                        error = e.message
                    )
                }
            }
        }
    }
    
    private fun reset() {
        _uiState.update { CalibrationUiState() }
    }
}
