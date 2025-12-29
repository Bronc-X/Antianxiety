# AntiAnxiety Android

> "用真相打破焦虑" - Break anxiety with truth

Native Android app built with Jetpack Compose, implementing the same health assessment and precision content recommendation features as the web version.

## Tech Stack

- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM + Clean Architecture
- **DI**: Hilt
- **Network**: Supabase Kotlin SDK + Ktor
- **Local Storage**: Room + DataStore
- **Build**: Gradle KTS with Version Catalog

## Setup

1. Copy Supabase credentials to `gradle.properties`:
   ```properties
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

2. Sync Gradle and build:
   ```bash
   ./gradlew build
   ```

3. Run on device:
   ```bash
   ./gradlew installDebug
   ```

## Project Structure

```
app/src/main/java/com/antianxiety/app/
├── AntiAnxietyApp.kt          # Application class (Hilt)
├── MainActivity.kt            # Main entry point
├── di/                        # Dependency injection
│   └── AppModule.kt
├── domain/                    # Business logic
│   ├── engine/
│   │   ├── CalibrationEngine.kt
│   │   └── HealthAssessmentEngine.kt
│   └── model/
│       ├── HealthAssessmentModels.kt
│       └── QuestionnaireModels.kt
└── presentation/              # UI layer
    ├── calibration/
    │   ├── CalibrationScreen.kt
    │   ├── CalibrationState.kt
    │   └── CalibrationViewModel.kt
    ├── common/
    │   └── Components.kt
    ├── navigation/
    │   └── AppNavigation.kt
    └── theme/
        ├── Color.kt
        ├── Theme.kt
        └── Type.kt
```

## Design Reference

UI inspired by:
- **Apple Fitness**: Activity rings, clean typography, premium feel
- **Whoop**: Health score visualization, pulsing animations, dark theme option

## Features

### Implemented
- [x] Daily Calibration flow (Welcome → Questions → Analyzing → Result)
- [x] Health Assessment Engine (cross-analysis for "Stress Belly" etc.)
- [x] 30/30/40 question source ratio
- [x] Premium Apple-style UI components

### TODO
- [ ] Supabase authentication
- [ ] Content aggregation feed
- [ ] Offline caching with Room
- [ ] Push notifications
