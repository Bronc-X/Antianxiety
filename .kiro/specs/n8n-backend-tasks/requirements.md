# Requirements Document

## Introduction

本规范定义了 Neuromind 后台任务层的需求。n8n 作为"备货"系统，负责定时执行数据预处理任务，为前端实时服务提供预热数据，降低用户等待时间和 API 调用成本。

## Glossary

- **n8n**: 开源工作流自动化平台，用于编排后台定时任务
- **科学搬运工 (Paper Harvester)**: 定时（每日小抓取，每周大抓取）从 Semantic Scholar 抓取论文并总结的任务
- **每日洞察生成器 (Daily Insight Generator)**: 每天凌晨为活跃用户预生成个性化洞察的任务
- **knowledge_base**: 存储科学论文及其中文摘要的数据库表
- **pre_insights**: 存储预生成用户洞察的数据库表
- **Comforting Truth**: Neuromind 的核心语言风格，将生理数据重构为安慰性解释

## Requirements

### Requirement 1: 科学搬运工 (Paper Harvester)

**User Story:** As a system administrator, I want the system to automatically fetch and summarize the latest metabolic health papers weekly, so that the knowledge base stays current without manual intervention.

#### Acceptance Criteria

1. WHEN the weekly cron job triggers (Sunday 2:00 AM UTC) THEN the system SHALL query Semantic Scholar API for papers matching health-related keywords
2. WHEN papers are retrieved THEN the system SHALL filter papers with citation_count >= 10 to ensure quality
3. WHEN a new paper is found THEN the system SHALL call LLM to generate a Chinese summary in "Comforting Truth" style
4. WHEN the summary is generated THEN the system SHALL generate an embedding vector using OpenAI text-embedding-3-small
5. WHEN storing the paper THEN the system SHALL upsert into knowledge_base table with paper_id as unique key
6. WHEN the task completes THEN the system SHALL log the number of papers processed and any errors encountered

### Requirement 2: 每日洞察生成器 (Daily Insight Generator)

**User Story:** As a user opening the app in the morning, I want to see a personalized insight immediately without waiting for AI generation, so that I can start my day with a comforting message.

#### Acceptance Criteria

1. WHEN the daily cron job triggers (4:00 AM local time) THEN the system SHALL query all active users (logged in within 7 days)
2. WHEN processing each user THEN the system SHALL fetch their yesterday's daily_logs data
3. WHEN daily_logs exist THEN the system SHALL call LLM to generate a personalized "清晨洞察" in Comforting Truth style
4. WHEN generating the insight THEN the system SHALL reference specific data points (sleep_hours, hrv, stress_level)
5. WHEN the insight is generated THEN the system SHALL store it in pre_insights table with user_id and insight_date
6. WHEN a user has no daily_logs THEN the system SHALL skip that user without generating an insight
7. WHEN the task completes THEN the system SHALL log the number of insights generated and any errors

### Requirement 3: 论文向量化 (Paper Vectorization)

**User Story:** As a RAG system, I want all papers in the knowledge base to have embedding vectors, so that semantic search can find relevant papers for user queries.

#### Acceptance Criteria

1. WHEN a new paper is added to knowledge_base THEN the system SHALL generate an embedding vector within the same transaction
2. WHEN the embedding is generated THEN the system SHALL use OpenAI text-embedding-3-small model with 1536 dimensions
3. WHEN storing the embedding THEN the system SHALL store it in the embedding column of knowledge_base table
4. WHEN a paper already has an embedding THEN the system SHALL skip re-vectorization unless content changed

### Requirement 4: 错误处理与监控

**User Story:** As a system administrator, I want to be notified when background tasks fail, so that I can investigate and fix issues promptly.

#### Acceptance Criteria

1. WHEN any n8n workflow fails THEN the system SHALL log the error with full context (task name, timestamp, error message)
2. WHEN a critical task fails 3 times consecutively THEN the system SHALL send an alert notification
3. WHEN API rate limits are hit THEN the system SHALL implement exponential backoff retry logic
4. WHEN the task completes successfully THEN the system SHALL update a health_check timestamp in the database

### Requirement 5: 数据库表结构

**User Story:** As a developer, I want well-defined database tables for storing pre-processed data, so that the frontend can efficiently query pre-generated content.

#### Acceptance Criteria

1. WHEN creating knowledge_base table THEN the system SHALL include columns: id, paper_id, title, abstract, summary_zh, keywords, citation_count, year, url, doi, embedding, created_at, updated_at
2. WHEN creating pre_insights table THEN the system SHALL include columns: id, user_id, insight_date, content, data_summary, generated_at, viewed_at
3. WHEN defining constraints THEN the system SHALL enforce unique constraint on (user_id, insight_date) in pre_insights
4. WHEN defining constraints THEN the system SHALL enforce unique constraint on paper_id in knowledge_base
