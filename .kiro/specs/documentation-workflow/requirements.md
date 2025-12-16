# Requirements Document

## Introduction

本规范定义了 No More Anxious 项目的文档管理工作流，确保项目文档的及时更新、知识传承和市场营销素材的系统化收集。核心目标是建立一个可持续的文档管理机制，让开发过程中的每一个亮点都能被记录和复用。

## Glossary

- **Constitution**: 项目宪法文件 (`PROJECT_CONSTITUTION.md`)，定义项目的核心理念、技术栈和编码规范
- **Diary**: 开发日志文件 (`DEVELOPMENT_DIARY.md`)，记录每日开发进展和技术决策
- **Workflow**: 技术栈与工作流文件 (`TECH_STACK_AND_WORKFLOW.md`)，记录技术架构和开发流程
- **Marketing Assets**: 市场营销素材，包括截图、录屏、功能亮点描述
- **Feature Highlight**: 功能亮点，值得对外宣传的新功能或改进

## Requirements

### Requirement 1: 每日开工检查

**User Story:** As a developer, I want to have a clear daily startup routine, so that I can stay aligned with project standards and recent changes.

#### Acceptance Criteria

1. WHEN a developer starts their workday THEN the system SHALL provide a checklist for reviewing Constitution and recent Diary entries
2. WHEN architecture or workflow changes are detected THEN the system SHALL prompt immediate update to TECH_STACK_AND_WORKFLOW.md
3. WHEN the developer completes the startup checklist THEN the system SHALL record the check timestamp in the Diary

### Requirement 2: 每日结束记录

**User Story:** As a developer, I want to efficiently record my daily work, so that knowledge is preserved and progress is trackable.

#### Acceptance Criteria

1. WHEN a developer ends their workday THEN the system SHALL prompt for Diary entry with structured template
2. WHEN recording daily work THEN the system SHALL include sections for core updates, code statistics, and next steps
3. WHEN significant features are completed THEN the system SHALL flag them for README update consideration

### Requirement 3: README 重大更新

**User Story:** As a project maintainer, I want README to reflect major milestones, so that new users and stakeholders understand current capabilities.

#### Acceptance Criteria

1. WHEN a major feature is completed THEN the system SHALL prompt for README update
2. WHEN updating README THEN the system SHALL maintain consistent formatting with existing sections
3. WHEN a feature affects user-facing functionality THEN the system SHALL update the feature list in README

### Requirement 4: 市场营销素材自动收集

**User Story:** As a product manager, I want marketing assets to be automatically collected during development, so that no highlight is missed and future promotional activities have rich material.

#### Acceptance Criteria

1. WHEN a new UI component or page is completed THEN the system SHALL automatically add an entry to MARKETING_ASSETS.md with TODO status
2. WHEN a feature has notable animations or interactions THEN the system SHALL flag it for screen recording in the asset log
3. WHEN automatic capture is not possible THEN the system SHALL display a prominent reminder to the developer
4. WHEN a feature is highlight-worthy THEN the system SHALL auto-generate a brief marketing description template
5. WHEN the developer completes a task THEN the system SHALL check if marketing assets are needed and prompt accordingly

### Requirement 5: 素材元数据管理

**User Story:** As a marketing team member, I want organized assets with context, so that I can quickly find and use appropriate materials.

#### Acceptance Criteria

1. WHEN storing a marketing asset THEN the system SHALL record date, feature name, asset type, and status (TODO/DONE)
2. WHEN storing a marketing asset THEN the system SHALL include a brief description of what the asset demonstrates
3. WHEN assets are organized THEN the system SHALL categorize by feature area and asset type
4. WHEN an asset is marked TODO for more than 3 days THEN the system SHALL highlight it as overdue

### Requirement 6: 自动化提醒机制

**User Story:** As a developer, I want to be reminded about pending documentation tasks, so that nothing falls through the cracks.

#### Acceptance Criteria

1. WHEN a spec task is completed THEN the system SHALL check for pending marketing asset entries
2. WHEN pending assets exist THEN the system SHALL display a reminder message with specific action items
3. IF automatic screenshot is not possible THEN the system SHALL provide clear manual instructions
4. WHEN the developer ignores a reminder THEN the system SHALL escalate the reminder in subsequent sessions
