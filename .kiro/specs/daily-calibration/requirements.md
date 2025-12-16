# Requirements Document

## Introduction

本功能实现"每日校准"(Daily Calibration) 工作流，将被动的异常监测逻辑替换为主动的"每日仪式"。用户在设定的时间收到本地推送提醒，打开 App 后弹出极简浮层输入当日指标（睡眠时长、压力值、运动意愿），系统立即对比过去 7 天平均值，检测异常后触发渐进式探询，最终生成个性化的每日任务和仪表盘内容。

## Glossary

- **Daily Calibration (每日校准)**: 用户每日固定时间进行的状态输入仪式
- **Bio-Voltage (生物电压)**: 用户能量/气的调节状态表示
- **Progressive Inquiry (渐进式探询)**: 基于异常检测后的智能追问机制
- **Anomaly (异常)**: 当日输入值与过去 7 天平均值的显著偏差
- **Calibration Sheet (校准浮层)**: 用于输入每日指标的底部弹出界面
- **Wisdom Carousel (智慧轮播)**: 每日刷新的 5 条金句卡片组件
- **Low-Energy Mode (低耗能模式)**: 检测到睡眠不足时的特殊任务模式

## Requirements

### Requirement 1: Daily Wisdom Carousel

**User Story:** As a user, I want to see calming wisdom quotes when I open the app, so that I can start my day with a peaceful mindset.

#### Acceptance Criteria

1. WHEN the user opens the landing page THEN the Daily_Calibration_System SHALL display a swipeable wisdom carousel at the top of the dashboard
2. WHEN displaying wisdom quotes THEN the Daily_Calibration_System SHALL show 5 golden sentences refreshed daily from Stoic/Taoist/Health philosophy
3. WHEN the user swipes or clicks navigation THEN the Daily_Calibration_System SHALL transition to the next or previous quote with smooth animation
4. WHEN 8 seconds elapse without user interaction THEN the Daily_Calibration_System SHALL auto-advance to the next quote

### Requirement 2: Scheduled Reminder Setup

**User Story:** As a user, I want to set a daily reminder time for calibration, so that I can build a consistent morning routine.

#### Acceptance Criteria

1. WHEN the user accesses settings THEN the Daily_Calibration_System SHALL provide a time picker for setting checkin_time
2. WHEN the user saves a checkin_time THEN the Daily_Calibration_System SHALL persist the time to the user profile in Supabase
3. WHEN the scheduled checkin_time arrives THEN the Daily_Calibration_System SHALL trigger a local push notification with message "该校准今日电压了"
4. WHEN the user taps the notification THEN the Daily_Calibration_System SHALL open the app and display the calibration sheet

### Requirement 3: Calibration Input Interface

**User Story:** As a user, I want to quickly input my daily metrics through a minimal interface, so that I can complete my morning calibration efficiently.

#### Acceptance Criteria

1. WHEN the user opens the app after notification or manually triggers calibration THEN the Daily_Calibration_System SHALL display a bottom sheet titled "Bio-Voltage Calibration"
2. WHEN displaying the calibration sheet THEN the Daily_Calibration_System SHALL show a slider for sleep duration (0-12 hours)
3. WHEN displaying the calibration sheet THEN the Daily_Calibration_System SHALL show a segmented control for stress level (Low/Medium/High)
4. WHEN displaying the calibration sheet THEN the Daily_Calibration_System SHALL show a segmented control for exercise intention (Rest/Moderate/Challenge)
5. WHEN the user has already completed calibration today THEN the Daily_Calibration_System SHALL skip showing the calibration sheet automatically

### Requirement 4: Weekly Comparison and Anomaly Detection

**User Story:** As a user, I want the system to compare my daily input with my weekly average, so that I can understand deviations in my health patterns.

#### Acceptance Criteria

1. WHEN the user submits calibration data THEN the Daily_Calibration_System SHALL fetch the past 7 days average from Supabase
2. WHEN comparing sleep duration THEN the Daily_Calibration_System SHALL flag an anomaly if current value is more than 1.5 hours below the weekly average
3. WHEN comparing stress level THEN the Daily_Calibration_System SHALL flag an anomaly if current value exceeds the weekly average by one level
4. WHEN no anomaly is detected THEN the Daily_Calibration_System SHALL display "Systems stable. Ready to generate plan?"

### Requirement 5: Progressive Inquiry Flow

**User Story:** As a user, I want the AI to ask follow-up questions when anomalies are detected, so that I can provide context for personalized recommendations.

#### Acceptance Criteria

1. WHEN a sleep anomaly is detected THEN the Daily_Calibration_System SHALL ask "Sleep is lower than your weekly average. Trouble falling asleep or early wake up?" with two tap options
2. WHEN a stress anomaly is detected THEN the Daily_Calibration_System SHALL ask "High tension detected. Work pressure or physical fatigue?" with two tap options
3. WHEN the user selects an inquiry option THEN the Daily_Calibration_System SHALL record the response and proceed to closure
4. WHEN multiple anomalies are detected THEN the Daily_Calibration_System SHALL prioritize sleep anomaly inquiry first

### Requirement 6: Dashboard Update and Task Generation

**User Story:** As a user, I want my dashboard to update based on my calibration results, so that I can see personalized tasks and insights.

#### Acceptance Criteria

1. WHEN the progressive inquiry is completed THEN the Daily_Calibration_System SHALL close the calibration modal
2. WHEN sleep anomaly with "trouble falling asleep" is recorded THEN the Daily_Calibration_System SHALL generate a task "午间 15 分钟 NSDR 休息" and enter Low-Energy Mode
3. WHEN calibration is complete THEN the Daily_Calibration_System SHALL update the Bio-Voltage card with the final context
4. WHEN calibration is complete THEN the Daily_Calibration_System SHALL update the Biometrics card with the manually entered data
5. WHEN calibration data is submitted THEN the Daily_Calibration_System SHALL persist all data to Supabase user_metrics table

### Requirement 7: Data Persistence and Serialization

**User Story:** As a developer, I want calibration data to be reliably stored and retrieved, so that weekly comparisons are accurate.

#### Acceptance Criteria

1. WHEN calibration data is saved THEN the Daily_Calibration_System SHALL serialize the data to JSON format for storage
2. WHEN retrieving weekly data THEN the Daily_Calibration_System SHALL deserialize stored JSON and calculate averages correctly
3. WHEN serializing calibration data THEN the Daily_Calibration_System SHALL include timestamp, sleep_hours, stress_level, exercise_intention, and inquiry_response fields
4. WHEN deserializing calibration data THEN the Daily_Calibration_System SHALL produce an equivalent object to the original input
