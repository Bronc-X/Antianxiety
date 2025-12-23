# Requirements Document

## Introduction

本功能旨在增强问卷系统的权威性和专业性，通过为每个临床量表集成详细的学术出处信息（包括原始文献引用、开发机构、验证研究等），让用户在填写问卷时能够看到量表的科学背景，增强信任感和专业形象。

## Glossary

- **Scale_Source_Attribution**: 量表出处归属系统，负责存储和展示量表的学术来源信息
- **Clinical_Scale**: 临床量表，如 GAD-7、PHQ-9、SHSQ-25 等经过验证的标准化评估工具
- **Citation**: 学术引用，包含作者、期刊、年份、DOI 等完整文献信息
- **Validation_Study**: 验证研究，证明量表在特定人群中有效性的研究
- **Scale_Metadata**: 量表元数据，包含量表的出处、版权、使用许可等信息

## Requirements

### Requirement 1: 量表出处数据结构

**User Story:** As a developer, I want a standardized data structure for scale source attribution, so that all clinical scales have consistent and complete provenance information.

#### Acceptance Criteria

1. THE Scale_Source_Attribution SHALL include the following fields: original authors, publication year, journal name, article title, DOI link, and developing institution
2. THE Scale_Source_Attribution SHALL include Chinese translation source information when applicable (translator, translation validation study)
3. THE Scale_Source_Attribution SHALL include copyright status (public domain, licensed, etc.) and usage permissions
4. THE Scale_Source_Attribution SHALL support multiple validation studies with their respective citations
5. WHEN a scale has a short version (e.g., GAD-2 from GAD-7), THE Scale_Source_Attribution SHALL reference the relationship and any separate validation studies

### Requirement 2: 量表出处信息展示

**User Story:** As a user, I want to see the authoritative source of each questionnaire, so that I can trust the scientific validity of the assessment.

#### Acceptance Criteria

1. WHEN a user views a questionnaire, THE System SHALL display the scale name with its official abbreviation (e.g., "GAD-7 广泛性焦虑障碍量表")
2. WHEN a user views a questionnaire, THE System SHALL display a brief source citation (e.g., "Spitzer et al., 2006")
3. WHEN a user taps on the source citation, THE System SHALL show detailed attribution information including full citation, developing institution, and validation information
4. THE System SHALL display the source information in a non-intrusive manner that does not interfere with questionnaire completion
5. WHEN displaying source information, THE System SHALL support both Chinese and English display based on user language preference

### Requirement 3: 已有量表出处信息补充

**User Story:** As a product owner, I want all existing clinical scales to have complete source attribution, so that the platform maintains professional credibility.

#### Acceptance Criteria

1. THE System SHALL include complete source attribution for GAD-7/GAD-2 (Spitzer RL, et al., Archives of Internal Medicine, 2006)
2. THE System SHALL include complete source attribution for PHQ-9/PHQ-2 (Kroenke K, et al., Journal of General Internal Medicine, 2001)
3. THE System SHALL include complete source attribution for ISI (Morin CM, et al., Sleep, 2011)
4. THE System SHALL include complete source attribution for PSS-10/PSS-4 (Cohen S, et al., Journal of Health and Social Behavior, 1983)
5. THE System SHALL include complete source attribution for SHSQ-25 (Yan YX, et al., Journal of Epidemiology, 2009; 南方医科大学)
6. IF a scale has Chinese validation studies, THEN THE System SHALL include those citations (e.g., GAD-7 中文版验证研究)

### Requirement 4: 疲劳量表集成

**User Story:** As a user experiencing fatigue symptoms, I want to complete a validated fatigue assessment, so that I can understand my fatigue level with scientific backing.

#### Acceptance Criteria

1. THE System SHALL include the Chalder Fatigue Scale (CFS-11) with complete source attribution (Chalder T, et al., Journal of Psychosomatic Research, 1993)
2. THE System SHALL include the Fatigue Severity Scale (FSS-9) with complete source attribution (Krupp LB, et al., Archives of Neurology, 1989)
3. WHEN displaying fatigue scales, THE System SHALL show the scale's primary use case (e.g., chronic fatigue syndrome, general fatigue assessment)
4. THE System SHALL support the 5-point Likert scale format as shown in the provided image (从不/偶尔/经常/经常/总是)
5. IF the user's profile indicates fatigue-related concerns, THEN THE System SHALL recommend appropriate fatigue assessment scales

### Requirement 5: 出处信息国际化

**User Story:** As a multilingual user, I want to see scale source information in my preferred language, so that I can understand the scientific background regardless of language.

#### Acceptance Criteria

1. THE System SHALL store source attribution in both Chinese and English
2. WHEN displaying source information, THE System SHALL use the user's preferred language setting
3. THE System SHALL display original English citations alongside Chinese translations when applicable
4. WHEN a scale was originally developed in a non-English language, THE System SHALL note the original language and translation history

### Requirement 6: 出处信息序列化与存储

**User Story:** As a developer, I want scale source attribution to be properly serialized and stored, so that the information can be reliably retrieved and displayed.

#### Acceptance Criteria

1. THE System SHALL serialize scale source attribution to JSON format for storage
2. THE System SHALL deserialize scale source attribution from JSON format for display
3. FOR ALL valid Scale_Source_Attribution objects, serializing then deserializing SHALL produce an equivalent object (round-trip property)
4. THE System SHALL validate source attribution data completeness before storage
