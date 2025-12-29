package com.antianxiety.app.presentation.calibration

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.antianxiety.app.domain.model.*
import com.antianxiety.app.presentation.common.*
import com.antianxiety.app.presentation.theme.*

/**
 * Unified Daily Calibration Screen
 * 
 * Premium Apple-inspired design with:
 * - Glass morphism cards
 * - Smooth page transitions
 * - Pulsing ring animations
 * - Clean typography hierarchy
 */
@Composable
fun CalibrationScreen(
    viewModel: CalibrationViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        AnimatedContent(
            targetState = uiState.step,
            transitionSpec = {
                slideInHorizontally(
                    initialOffsetX = { if (targetState.ordinal > initialState.ordinal) it else -it },
                    animationSpec = tween(400, easing = FastOutSlowInEasing)
                ) + fadeIn() togetherWith slideOutHorizontally(
                    targetOffsetX = { if (targetState.ordinal > initialState.ordinal) -it else it },
                    animationSpec = tween(400, easing = FastOutSlowInEasing)
                ) + fadeOut()
            },
            label = "step_transition"
        ) { step ->
            when (step) {
                CalibrationStep.WELCOME -> WelcomeStep(
                    userName = uiState.userName,
                    sourceScales = uiState.sourceScales,
                    sourceLogic = uiState.sourceLogic,
                    sourceAI = uiState.sourceAI,
                    isLoading = uiState.isLoading,
                    onStart = { viewModel.onEvent(CalibrationEvent.StartCalibration) }
                )
                CalibrationStep.QUESTIONS -> QuestionStep(
                    question = uiState.currentQuestion,
                    currentIndex = uiState.currentQuestionIndex,
                    totalQuestions = uiState.questions.size,
                    progress = uiState.progressPercent,
                    selectedAnswer = uiState.answers[uiState.currentQuestion?.id],
                    onAnswer = { id, answer -> 
                        viewModel.onEvent(CalibrationEvent.AnswerQuestion(id, answer))
                    }
                )
                CalibrationStep.ANALYZING -> AnalyzingStep()
                CalibrationStep.RESULT -> ResultStep(
                    result = uiState.assessmentResult
                )
            }
        }
    }
}

@Composable
private fun WelcomeStep(
    userName: String?,
    sourceScales: Int,
    sourceLogic: Int,
    sourceAI: Int,
    isLoading: Boolean,
    onStart: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.weight(0.3f))
        
        // Icon
        Box(
            modifier = Modifier
                .size(80.dp)
                .shadow(24.dp, CircleShape, spotColor = Neutral900.copy(alpha = 0.2f))
                .clip(CircleShape)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Neutral900, Neutral800)
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                modifier = Modifier.size(36.dp),
                tint = Color.White
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Title
        Text(
            text = if (userName != null) "$userName，每日校准" else "每日校准",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Subtitle
        Text(
            text = "5 个问题，帮助 Max 更好地了解你",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Source ratio chips
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            SourceChip(icon = "📊", label = "量表", percentage = sourceScales)
            SourceChip(icon = "🧠", label = "逻辑", percentage = sourceLogic)
            SourceChip(icon = "✨", label = "AI", percentage = sourceAI)
        }
        
        Spacer(modifier = Modifier.weight(0.5f))
        
        // CTA Button
        AppleButton(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth(),
            isLoading = isLoading
        ) {
            Text("开始校准", fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.width(8.dp))
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun QuestionStep(
    question: CalibrationQuestion?,
    currentIndex: Int,
    totalQuestions: Int,
    progress: Float,
    selectedAnswer: Any?,
    onAnswer: (String, Any) -> Unit
) {
    if (question == null) return
    
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        Spacer(modifier = Modifier.height(20.dp))
        
        // Progress header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${currentIndex + 1} / $totalQuestions",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = when (question.type) {
                    QuestionType.ANCHOR -> "核心"
                    QuestionType.ADAPTIVE -> "适应"
                    QuestionType.EVOLUTION -> "进化"
                },
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Progress bar
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(4.dp)
                .clip(RoundedCornerShape(2.dp)),
            color = Neutral900,
            trackColor = Neutral200
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        // Question
        Text(
            text = question.question,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Options
        when (question.inputType) {
            InputType.SINGLE -> {
                question.options?.forEachIndexed { index, option ->
                    val isSelected = selectedAnswer == option.value
                    
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp)
                            .clickable { onAnswer(question.id, option.value) },
                        shape = RoundedCornerShape(16.dp),
                        color = if (isSelected) Neutral900 else Color.White,
                        border = if (!isSelected) {
                            androidx.compose.foundation.BorderStroke(2.dp, Neutral200)
                        } else null
                    ) {
                        Text(
                            text = option.label,
                            modifier = Modifier.padding(20.dp),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) Color.White else Neutral900
                        )
                    }
                }
            }
            
            InputType.SLIDER -> {
                var sliderValue by remember { mutableFloatStateOf(
                    (selectedAnswer as? Int)?.toFloat() 
                    ?: ((question.min ?: 0) + (question.max ?: 10)) / 2f
                )}
                
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = sliderValue.toInt().toString(),
                        style = MaterialTheme.typography.displaySmall,
                        fontWeight = FontWeight.Bold,
                        color = Neutral900
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Slider(
                        value = sliderValue,
                        onValueChange = { sliderValue = it },
                        onValueChangeFinished = { 
                            onAnswer(question.id, sliderValue.toInt())
                        },
                        valueRange = (question.min?.toFloat() ?: 0f)..(question.max?.toFloat() ?: 10f),
                        steps = (question.max ?: 10) - (question.min ?: 0) - 1,
                        colors = SliderDefaults.colors(
                            thumbColor = Neutral900,
                            activeTrackColor = Neutral900,
                            inactiveTrackColor = Neutral200
                        )
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = (question.min ?: 0).toString(),
                            style = MaterialTheme.typography.labelMedium,
                            color = Neutral500
                        )
                        Text(
                            text = (question.max ?: 10).toString(),
                            style = MaterialTheme.typography.labelMedium,
                            color = Neutral500
                        )
                    }
                }
            }
            
            else -> {}
        }
    }
}

@Composable
private fun AnalyzingStep() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Pulsing rings
        Box(
            modifier = Modifier.size(96.dp),
            contentAlignment = Alignment.Center
        ) {
            PulsingRings(modifier = Modifier.fillMaxSize())
            
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Neutral900),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    modifier = Modifier.size(28.dp),
                    tint = Color.White
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = "正在分析...",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
            color = Neutral900
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Max 正在交叉分析你的健康数据",
            style = MaterialTheme.typography.bodyMedium,
            color = Neutral500
        )
    }
}

@Composable
private fun ResultStep(
    result: HealthAssessmentResult?
) {
    if (result == null) return
    
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        // Success icon
        IconCircle(
            modifier = Modifier.size(80.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = Color.White
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = "校准完成",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            color = Neutral900
        )
        
        Text(
            text = "你的档案已更新",
            style = MaterialTheme.typography.bodyMedium,
            color = Neutral500
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Tags
        if (result.tags.isNotEmpty()) {
            Text(
                text = "识别到的标签",
                style = MaterialTheme.typography.labelLarge,
                color = Neutral500,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )
            
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                result.tags.forEach { tag ->
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Neutral100
                    ) {
                        Text(
                            text = tag,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            style = MaterialTheme.typography.labelLarge,
                            color = Neutral700
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        // Cross analysis insight
        result.crossAnalysis?.let { analysis ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = Neutral900
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = "深度洞察",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.6f)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = analysis.syndrome,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        // Severity
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = Neutral100
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "整体状态",
                    style = MaterialTheme.typography.labelLarge,
                    color = Neutral500
                )
                
                StatusPill(
                    text = when (result.severity) {
                        AssessmentSeverity.LOW -> "良好"
                        AssessmentSeverity.MEDIUM -> "关注"
                        AssessmentSeverity.HIGH -> "需关注"
                    },
                    status = when (result.severity) {
                        AssessmentSeverity.LOW -> PillStatus.SUCCESS
                        AssessmentSeverity.MEDIUM -> PillStatus.WARNING
                        AssessmentSeverity.HIGH -> PillStatus.ERROR
                    }
                )
            }
        }
    }
}
