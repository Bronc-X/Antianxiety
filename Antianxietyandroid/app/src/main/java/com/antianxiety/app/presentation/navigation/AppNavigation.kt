package com.antianxiety.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.antianxiety.app.presentation.calibration.CalibrationScreen

/**
 * App Navigation
 */

sealed class Screen(val route: String) {
    data object Calibration : Screen("calibration")
    data object Feed : Screen("feed")
    data object Profile : Screen("profile")
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = Screen.Calibration.route
    ) {
        composable(Screen.Calibration.route) {
            CalibrationScreen()
        }
        
        // TODO: Add more screens
        // composable(Screen.Feed.route) { FeedScreen() }
        // composable(Screen.Profile.route) { ProfileScreen() }
    }
}
