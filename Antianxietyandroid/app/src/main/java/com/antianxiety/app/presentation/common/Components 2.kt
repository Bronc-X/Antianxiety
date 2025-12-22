package com.antianxiety.app.presentation.common

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.antianxiety.app.presentation.theme.*

/**
 * Apple-style Glass Card
 * Premium frosted glass effect with subtle border
 */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    backgroundColor: Color = Color.White.copy(alpha = 0.9f),
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = modifier
            .shadow(
                elevation = 20.dp,
                shape = RoundedCornerShape(28.dp),
                spotColor = Color.Black.copy(alpha = 0.08f),
                ambientColor = Color.Black.copy(alpha = 0.04f)
            ),
        shape = RoundedCornerShape(28.dp),
        color = backgroundColor,
        tonalElevation = 0.dp
    ) {
        Column(content = content)
    }
}

/**
 * Apple-style Primary Button
 * Clean black button with subtle animations
 */
@Composable
fun AppleButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    content: @Composable RowScope.() -> Unit
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(56.dp),
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Neutral900,
            contentColor = Color.White,
            disabledContainerColor = Neutral400,
            disabledContentColor = Color.White.copy(alpha = 0.6f)
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 0.dp,
            pressedElevation = 0.dp
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            content()
        }
    }
}

/**
 * Pulsing Rings Animation (Whoop-style)
 * Used for analyzing/loading states
 */
@Composable
fun PulsingRings(
    modifier: Modifier = Modifier,
    color: Color = Neutral900,
    ringCount: Int = 3
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulsing")
    
    Box(modifier = modifier) {
        repeat(ringCount) { index ->
            val scale by infiniteTransition.animateFloat(
                initialValue = 0.5f,
                targetValue = 1.5f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000, easing = EaseOut),
                    repeatMode = RepeatMode.Restart,
                    initialStartOffset = StartOffset(index * 600)
                ),
                label = "scale_$index"
            )
            
            val alpha by infiniteTransition.animateFloat(
                initialValue = 0.8f,
                targetValue = 0f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2000, easing = EaseOut),
                    repeatMode = RepeatMode.Restart,
                    initialStartOffset = StartOffset(index * 600)
                ),
                label = "alpha_$index"
            )
            
            Canvas(modifier = Modifier.matchParentSize()) {
                drawCircle(
                    color = color.copy(alpha = alpha),
                    radius = size.minDimension / 2 * scale,
                    style = Stroke(width = 2.dp.toPx())
                )
            }
        }
    }
}

/**
 * Progress Ring (Apple Fitness-style)
 */
@Composable
fun ProgressRing(
    progress: Float,
    modifier: Modifier = Modifier,
    strokeWidth: Dp = 12.dp,
    trackColor: Color = Neutral200,
    progressColor: Color = Emerald500
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(500, easing = FastOutSlowInEasing),
        label = "progress"
    )
    
    Canvas(modifier = modifier) {
        val sweepAngle = animatedProgress * 360f
        
        // Track
        drawArc(
            color = trackColor,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            style = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
        )
        
        // Progress
        drawArc(
            color = progressColor,
            startAngle = -90f,
            sweepAngle = sweepAngle,
            useCenter = false,
            style = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
        )
    }
}

/**
 * Status Pill (Severity indicator)
 */
@Composable
fun StatusPill(
    text: String,
    status: PillStatus,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor) = when (status) {
        PillStatus.SUCCESS -> Emerald100 to Emerald600
        PillStatus.WARNING -> Amber100 to Amber600
        PillStatus.ERROR -> Rose100 to Rose600
    }
    
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = backgroundColor
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            color = textColor
        )
    }
}

enum class PillStatus {
    SUCCESS, WARNING, ERROR
}

/**
 * Source Ratio Chip
 */
@Composable
fun SourceChip(
    icon: String,
    label: String,
    percentage: Int,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = Neutral100
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = icon, style = MaterialTheme.typography.labelMedium)
            Text(
                text = "$label $percentage%",
                style = MaterialTheme.typography.labelSmall,
                color = Neutral600
            )
        }
    }
}

/**
 * Icon Circle (for success/complete states)
 */
@Composable
fun IconCircle(
    modifier: Modifier = Modifier,
    gradient: Brush = Brush.verticalGradient(
        colors = listOf(Emerald400, Emerald600)
    ),
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .shadow(
                elevation = 24.dp,
                shape = CircleShape,
                spotColor = Emerald500.copy(alpha = 0.3f)
            )
            .clip(CircleShape)
            .background(gradient),
        contentAlignment = Alignment.Center,
        content = content
    )
}
