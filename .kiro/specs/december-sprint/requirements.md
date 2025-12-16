# Requirements Document

## Introduction

December Sprint 是 No More Anxious 平台 2025 年 12 月初的冲刺计划，聚焦四个核心方向：贝叶斯系统 UI 重设计、React 开发工具集成、营销素材收集、以及 Android 端调试。本 Sprint 旨在提升产品视觉体验、开发效率、市场准备度和移动端稳定性。

## Glossary

- **Bayesian Redesign (贝叶斯重设计)**: 对现有贝叶斯信念循环 UI 的视觉和交互升级
- **React Grab**: 一种 React 组件检查工具，允许点击页面元素直接跳转到源代码
- **LocatorJS**: 类似 React Grab 的开发工具，支持自定义 URL Scheme
- **Marketing Assets (营销素材)**: 用于产品推广的截图、录屏、GIF 等视觉材料
- **Android Debug (安卓调试)**: 使用 Capacitor 构建的 Android 应用的调试和优化
- **Capacitor**: 跨平台移动应用框架，将 Web 应用打包为原生应用
- **ADB (Android Debug Bridge)**: Android 调试工具

## Requirements

### Requirement 1

**User Story:** As a user experiencing anxiety, I want a more visually calming and intuitive Bayesian interface, so that the anxiety reduction experience feels more immersive and trustworthy.

#### Acceptance Criteria

1. WHEN the user opens the Bayesian ritual THEN the system SHALL display a redesigned full-screen interface with improved visual hierarchy
2. WHEN displaying the cognitive scale THEN the system SHALL use smoother animations with spring physics and glassmorphism effects
3. WHEN evidence weights drop onto the scale THEN the system SHALL provide enhanced visual feedback with particle effects and subtle sound cues
4. WHEN the posterior score is revealed THEN the system SHALL animate the number transition with a more dramatic "truth moment" effect
5. WHEN the user views the anxiety curve THEN the system SHALL display an improved chart with better color gradients and data point interactions

### Requirement 2

**User Story:** As a developer, I want to quickly locate React components in the source code by clicking on UI elements, so that I can debug and modify components more efficiently.

#### Acceptance Criteria

1. WHEN the developer clicks on a UI element with the dev tool active THEN the system SHALL open the corresponding source file in Kiro IDE
2. WHEN configuring the dev tool THEN the system SHALL support the `kiro://` URL scheme for IDE integration
3. WHEN the dev tool is enabled THEN the system SHALL display a visual indicator on hoverable components
4. WHEN the dev tool is disabled THEN the system SHALL not affect production performance or user experience
5. IF the source file cannot be located THEN the system SHALL display a helpful error message with debugging suggestions

### Requirement 3

**User Story:** As a marketing team member, I want comprehensive visual assets of the product, so that I can create compelling promotional materials.

#### Acceptance Criteria

1. WHEN capturing the landing page THEN the system SHALL produce high-resolution screenshots (1920x1080 and 390x844 mobile)
2. WHEN capturing the Bayesian ritual flow THEN the system SHALL produce a screen recording or GIF showing the complete animation sequence
3. WHEN capturing the AI assistant THEN the system SHALL produce screenshots showing conversation flow and plan generation
4. WHEN capturing the daily calibration THEN the system SHALL produce screenshots of the questionnaire and task cards
5. WHEN organizing assets THEN the system SHALL follow the naming convention defined in MARKETING_ASSETS.md

### Requirement 4

**User Story:** As a mobile user, I want the Android app to work smoothly without crashes or visual glitches, so that I can use the app reliably on my device.

#### Acceptance Criteria

1. WHEN launching the Android app THEN the system SHALL display the splash screen and load the main interface within 3 seconds
2. WHEN navigating between pages THEN the system SHALL maintain smooth transitions without white flashes or layout shifts
3. WHEN using the AI assistant on Android THEN the system SHALL handle keyboard input and streaming responses correctly
4. WHEN the device is offline THEN the system SHALL display appropriate offline indicators and cached content
5. IF a JavaScript error occurs THEN the system SHALL log the error and display a user-friendly recovery option

### Requirement 5

**User Story:** As a developer, I want clear documentation of the Android debugging process, so that I can efficiently troubleshoot issues on physical devices.

#### Acceptance Criteria

1. WHEN setting up Android debugging THEN the documentation SHALL include ADB connection steps and common troubleshooting commands
2. WHEN debugging WebView issues THEN the documentation SHALL include Chrome DevTools remote debugging instructions
3. WHEN testing on physical devices THEN the documentation SHALL include device-specific configuration requirements
4. WHEN encountering common errors THEN the documentation SHALL provide solutions for known Capacitor issues
5. WHEN building for release THEN the documentation SHALL include signing and optimization steps

### Requirement 6

**User Story:** As a product owner, I want to track the progress of all sprint tasks, so that I can ensure timely delivery of the December sprint goals.

#### Acceptance Criteria

1. WHEN viewing the sprint progress THEN the system SHALL display completion status for each major task area
2. WHEN a task is completed THEN the system SHALL update the DEVELOPMENT_DIARY.md with the accomplishment
3. WHEN a blocker is encountered THEN the system SHALL document the issue and proposed solution
4. WHEN the sprint ends THEN the system SHALL produce a summary of completed vs planned items
5. WHEN reviewing sprint outcomes THEN the system SHALL identify items to carry over to the next sprint

