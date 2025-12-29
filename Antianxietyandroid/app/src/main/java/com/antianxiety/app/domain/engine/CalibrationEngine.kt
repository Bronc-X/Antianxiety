package com.antianxiety.app.domain.engine

import com.antianxiety.app.domain.model.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Calibration Engine for Adaptive Daily Check-in
 * 
 * Generates daily calibration questions based on user's Phase Goals.
 * Implements 30/30/40 question source ratio.
 * 
 * Mirrors web version: lib/calibration-engine.ts
 */
@Singleton
class CalibrationEngine @Inject constructor() {
    
    companion object {
        const val MAX_DAILY_QUESTIONS = 5
        const val EVOLUTION_TRIGGER_DAYS = 7
        
        // Question source ratio
        const val DECISION_TREE_RATIO = 0.3f
        const val PRESET_SCALES_RATIO = 0.3f
        const val AI_ADAPTIVE_RATIO = 0.4f
    }
    
    // Anchor questions - always included
    private val anchorQuestions = listOf(
        CalibrationQuestion(
            id = "anchor_sleep_hours",
            type = QuestionType.ANCHOR,
            question = "昨晚睡了多少小时？",
            inputType = InputType.SLIDER,
            min = 0,
            max = 12
        ),
        CalibrationQuestion(
            id = "anchor_stress_level",
            type = QuestionType.ANCHOR,
            question = "当前压力水平？",
            inputType = InputType.SINGLE,
            options = listOf(
                QuestionOption("低压", "low"),
                QuestionOption("中压", "medium"),
                QuestionOption("高压", "high")
            )
        )
    )
    
    // Goal-specific questions
    private val sleepQuestions = listOf(
        CalibrationQuestion(
            id = "sleep_quality",
            type = QuestionType.ADAPTIVE,
            question = "睡眠质量如何？",
            inputType = InputType.SLIDER,
            min = 1,
            max = 10,
            goalRelation = "sleep"
        ),
        CalibrationQuestion(
            id = "sleep_onset_time",
            type = QuestionType.ADAPTIVE,
            question = "入睡花了多长时间？",
            inputType = InputType.SINGLE,
            options = listOf(
                QuestionOption("15分钟以内", "quick"),
                QuestionOption("15-30分钟", "moderate"),
                QuestionOption("超过30分钟", "long")
            ),
            goalRelation = "sleep"
        )
    )
    
    private val stressQuestions = listOf(
        CalibrationQuestion(
            id = "stress_triggers",
            type = QuestionType.ADAPTIVE,
            question = "今天主要的压力来源是？",
            inputType = InputType.SINGLE,
            options = listOf(
                QuestionOption("工作", "work"),
                QuestionOption("人际关系", "relationships"),
                QuestionOption("健康", "health"),
                QuestionOption("其他", "other")
            ),
            goalRelation = "stress"
        )
    )
    
    private val energyQuestions = listOf(
        CalibrationQuestion(
            id = "morning_energy",
            type = QuestionType.ADAPTIVE,
            question = "早上起床时精力如何？",
            inputType = InputType.SLIDER,
            min = 1,
            max = 10,
            goalRelation = "energy"
        )
    )
    
    private val evolutionQuestions = listOf(
        CalibrationQuestion(
            id = "evo_overall_progress",
            type = QuestionType.EVOLUTION,
            question = "这周整体感觉如何？",
            inputType = InputType.SLIDER,
            min = 1,
            max = 10
        )
    )
    
    fun generateDailyQuestions(
        consecutiveDays: Int = 0
    ): List<CalibrationQuestion> {
        val questions = mutableListOf<CalibrationQuestion>()
        
        // Always include anchor questions
        questions.addAll(anchorQuestions)
        
        // Add adaptive questions based on goals (simplified)
        questions.addAll(stressQuestions.take(1))
        questions.addAll(energyQuestions.take(1))
        
        // Add evolution questions if triggered
        if (shouldEvolve(consecutiveDays)) {
            questions.addAll(evolutionQuestions.take(1))
        }
        
        return questions.take(MAX_DAILY_QUESTIONS)
    }
    
    fun shouldEvolve(consecutiveDays: Int): Boolean {
        return consecutiveDays > 0 && consecutiveDays % EVOLUTION_TRIGGER_DAYS == 0
    }
    
    fun getSourceRatioDisplay(): Triple<Int, Int, Int> {
        return Triple(
            (PRESET_SCALES_RATIO * 100).toInt(),
            (DECISION_TREE_RATIO * 100).toInt(),
            (AI_ADAPTIVE_RATIO * 100).toInt()
        )
    }
}
