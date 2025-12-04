# Requirements Document

## Introduction

本功能旨在改进 AI 助手的对话体验，解决当前存在的重复回复问题。核心目标是让 AI 在同一对话中具备真正的"记忆"能力，避免重复的格式、内容、语气和上下文引用，提供更自然、更人性化的对话体验。

## Glossary

- **Conversation Memory**: 对话记忆，指 AI 在同一会话中记住之前讨论过的内容
- **Response Variation**: 回复变化，指 AI 回复在格式、语气、结构上的多样性
- **Context Deduplication**: 上下文去重，指避免重复注入已经提及过的信息
- **Health Context**: 健康上下文，指用户的健康状况信息（如"眼睑板开口"）
- **Scientific Citation**: 科学引用，指 AI 回复中引用的学术论文

## Requirements

### Requirement 1

**User Story:** As a user, I want the AI to remember what we've discussed in the current conversation, so that I don't have to repeat myself and the AI doesn't repeat the same information.

#### Acceptance Criteria

1. WHEN the AI has already mentioned the user's health condition in a previous message THEN the system SHALL NOT repeat the full health condition statement in subsequent messages
2. WHEN the user asks a follow-up question THEN the system SHALL reference previous context implicitly without restating it
3. WHEN the AI has explained a concept earlier in the conversation THEN the system SHALL build upon that explanation rather than repeating it

### Requirement 2

**User Story:** As a user, I want the AI responses to have varied formats, so that the conversation feels natural and not robotic.

#### Acceptance Criteria

1. WHEN generating a response THEN the system SHALL vary the response structure based on conversation turn count
2. WHEN the previous response used a specific format (e.g., bullet points) THEN the system SHALL use a different format for the next response
3. WHEN responding to a simple follow-up question THEN the system SHALL use a concise format without full structured sections

### Requirement 3

**User Story:** As a user, I want the AI to use varied language and tone, so that the conversation doesn't feel repetitive.

#### Acceptance Criteria

1. WHEN generating multiple responses in a conversation THEN the system SHALL vary greeting phrases and closing remarks
2. WHEN the AI has used a specific term of endearment (e.g., "宝子") THEN the system SHALL use different expressions in subsequent messages
3. WHEN citing scientific evidence THEN the system SHALL vary the citation introduction phrases

### Requirement 4

**User Story:** As a user, I want the AI to avoid citing the same papers repeatedly, so that I get diverse scientific perspectives.

#### Acceptance Criteria

1. WHEN the AI has cited a specific paper in the conversation THEN the system SHALL prioritize different papers for subsequent citations
2. WHEN multiple responses require scientific backing THEN the system SHALL track and deduplicate cited papers within the session
3. WHEN no new relevant papers are available THEN the system SHALL acknowledge the previous citation without repeating the full reference

### Requirement 5

**User Story:** As a user, I want the AI to directly answer my specific questions without re-explaining background information, so that I get efficient and focused responses.

#### Acceptance Criteria

1. WHEN the user asks for a specific action plan THEN the system SHALL provide the plan directly without restating the problem
2. WHEN the user asks a clarifying question THEN the system SHALL answer concisely without repeating previous explanations
3. WHEN the conversation has established context THEN the system SHALL assume that context and proceed directly to new information

### Requirement 6

**User Story:** As a user, I want the AI to feel like a world-class doctor who is also a witty friend, so that I get expert medical advice in an engaging and approachable way.

#### Acceptance Criteria

1. THE system SHALL embody the persona of a top-tier physician (Harvard Medical School / Mayo Clinic level) with exceptional memory and comprehensive medical knowledge
2. WHEN providing medical advice THEN the system SHALL demonstrate deep expertise while maintaining a warm, witty, and approachable tone
3. WHEN explaining complex medical concepts THEN the system SHALL use relatable analogies and conversational language without sacrificing accuracy
4. THE system SHALL remember all details shared by the user throughout the conversation and reference them naturally like a doctor who truly knows their patient
5. WHEN the user shares symptoms or concerns THEN the system SHALL respond with the confidence and thoroughness of a senior attending physician while being personable and encouraging
