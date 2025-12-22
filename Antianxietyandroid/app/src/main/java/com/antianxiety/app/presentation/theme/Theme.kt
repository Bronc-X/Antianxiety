package com.antianxiety.app.presentation.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * AntiAnxiety Theme
 * Apple-inspired premium design system
 */

private val DarkColorScheme = darkColorScheme(
    primary = Neutral50,
    onPrimary = Neutral900,
    primaryContainer = Neutral800,
    onPrimaryContainer = Neutral100,
    
    secondary = Emerald400,
    onSecondary = Neutral900,
    secondaryContainer = Emerald600,
    onSecondaryContainer = Emerald100,
    
    tertiary = Amber500,
    onTertiary = Neutral900,
    tertiaryContainer = Amber600,
    onTertiaryContainer = Amber100,
    
    error = Rose500,
    onError = Neutral50,
    errorContainer = Rose600,
    onErrorContainer = Rose100,
    
    background = Neutral900,
    onBackground = Neutral50,
    
    surface = Neutral800,
    onSurface = Neutral50,
    surfaceVariant = Neutral700,
    onSurfaceVariant = Neutral300,
    
    outline = Neutral600,
    outlineVariant = Neutral700,
    
    scrim = Color.Black.copy(alpha = 0.5f)
)

private val LightColorScheme = lightColorScheme(
    primary = Neutral900,
    onPrimary = Neutral50,
    primaryContainer = Neutral100,
    onPrimaryContainer = Neutral800,
    
    secondary = Emerald500,
    onSecondary = Neutral50,
    secondaryContainer = Emerald100,
    onSecondaryContainer = Emerald600,
    
    tertiary = Amber500,
    onTertiary = Neutral50,
    tertiaryContainer = Amber100,
    onTertiaryContainer = Amber600,
    
    error = Rose500,
    onError = Neutral50,
    errorContainer = Rose100,
    onErrorContainer = Rose600,
    
    background = Neutral50,
    onBackground = Neutral900,
    
    surface = Color.White,
    onSurface = Neutral900,
    surfaceVariant = Neutral100,
    onSurfaceVariant = Neutral600,
    
    outline = Neutral300,
    outlineVariant = Neutral200,
    
    scrim = Color.Black.copy(alpha = 0.3f)
)

@Composable
fun AntiAnxietyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
