package com.antianxiety.app.di

import com.antianxiety.app.domain.engine.CalibrationEngine
import com.antianxiety.app.domain.engine.HealthAssessmentEngine
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    
    @Provides
    @Singleton
    fun provideCalibrationEngine(): CalibrationEngine {
        return CalibrationEngine()
    }
    
    @Provides
    @Singleton
    fun provideHealthAssessmentEngine(): HealthAssessmentEngine {
        return HealthAssessmentEngine()
    }
}
