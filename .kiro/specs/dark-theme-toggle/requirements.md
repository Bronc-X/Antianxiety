# Requirements Document

## Introduction

本功能为 No More Anxious 应用添加暗色主题支持。用户选择了「极简黑」(Minimal Dark) 作为暗色主题方案，使用纯黑渐变背景 (#0a0a0a → #171717) 配合微妙的中心光晕效果。用户可以在当前的燕麦绿色（California Calm）配色和极简黑主题之间切换，切换入口位于个人设置页面。

**重要约束**: 由于系统深色模式会影响 CSS 变量，导致浅色背景上出现银灰色文字（不可读），系统必须强制使用浅色主题作为默认，禁用系统偏好跟随功能。

## Glossary

- **Light Theme (燕麦绿主题)**: 当前默认主题，使用 Sand (#E8DFD0)、Clay (#C4A77D)、Sage (#9CAF88)、Soft Black (#2C2C2C)、Whitespace (#FAF6EF) 等暖色调
- **Dark Theme (极简黑主题)**: 新增的深色主题，使用纯黑渐变 (#0a0a0a → #171717)，白色文字 (#f5f5f5)，微妙的中心光晕效果
- **Theme Toggle**: 主题切换开关，允许用户在两种主题间切换
- **Theme Provider**: 主题上下文提供者，管理全局主题状态，配置 `defaultTheme="light"` 和 `enableSystem={false}`

## Requirements

### Requirement 1

**User Story:** As a user, I want to switch between light and dark themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN a user opens the settings page THEN the system SHALL display a theme toggle option with clear visual indication of current theme
2. WHEN a user toggles the theme switch THEN the system SHALL immediately apply the selected theme across all pages without page reload
3. WHEN a user selects a theme THEN the system SHALL persist the preference to localStorage for future sessions
4. WHEN a user returns to the app THEN the system SHALL restore the previously selected theme preference
5. WHEN the theme changes THEN the system SHALL apply smooth transition animations (300ms) to prevent jarring visual changes

### Requirement 2

**User Story:** As a user, I want the dark theme to feel calming and premium, so that it maintains the app's "California Calm" aesthetic.

#### Acceptance Criteria

1. WHEN dark theme is active THEN the system SHALL use a deep indigo-to-purple gradient background inspired by the SleepAnimation component
2. WHEN dark theme is active THEN the system SHALL display text in soft white/cream tones (#F5F5F5, #E8E8E8) for optimal readability
3. WHEN dark theme is active THEN the system SHALL use muted accent colors (teal-400, amber-400) that complement the dark background
4. WHEN dark theme is active THEN the system SHALL maintain the same visual hierarchy and spacing as light theme
5. WHEN dark theme is active THEN the system SHALL ensure all interactive elements have sufficient contrast (WCAG AA compliance)

### Requirement 3

**User Story:** As a developer, I want a centralized theme management system, so that theme changes propagate consistently across all components.

#### Acceptance Criteria

1. WHEN the app initializes THEN the system SHALL create a ThemeProvider context that wraps the entire application
2. WHEN any component needs theme information THEN the system SHALL provide a useTheme hook that returns current theme and toggle function
3. WHEN theme CSS variables are defined THEN the system SHALL organize them in globals.css under :root (light) and .dark (dark) selectors
4. WHEN a component uses theme-aware styling THEN the system SHALL support both Tailwind dark: prefix and CSS variable approaches

### Requirement 4

**User Story:** As a user, I want the option to follow my system's dark mode preference, so that the app automatically matches my device settings.

#### Acceptance Criteria

1. WHEN a user selects "System" preference THEN the system SHALL detect and apply the operating system's color scheme
2. WHEN the system preference changes while app is open THEN the system SHALL automatically update the theme to match
3. WHEN displaying theme options THEN the system SHALL show three choices: Light, Dark, and System
4. WHEN "System" is selected and system preference is unavailable THEN the system SHALL default to light theme

### Requirement 5

**User Story:** As a user, I want all UI components to properly support dark theme, so that I have a consistent experience throughout the app.

#### Acceptance Criteria

1. WHEN dark theme is active THEN the system SHALL update all Card components to use dark background colors
2. WHEN dark theme is active THEN the system SHALL update all Button components to maintain proper contrast
3. WHEN dark theme is active THEN the system SHALL update all Input/Form components with dark-friendly styling
4. WHEN dark theme is active THEN the system SHALL update navigation and header components appropriately
5. WHEN dark theme is active THEN the system SHALL ensure Lottie animations and icons remain visible

### Requirement 6

**User Story:** As a user, I want the settings page theme toggle to be intuitive and visually appealing, so that I can easily find and use it.

#### Acceptance Criteria

1. WHEN viewing the settings page THEN the system SHALL display the theme toggle in a prominent "Appearance" section
2. WHEN displaying theme options THEN the system SHALL show visual previews (icons or mini-previews) for each theme option
3. WHEN a theme option is selected THEN the system SHALL highlight it with a clear selected state indicator
4. WHEN hovering over theme options THEN the system SHALL provide subtle hover feedback

