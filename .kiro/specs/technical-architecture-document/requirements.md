# Requirements Document

## Introduction

本规范定义了"No More Anxious"平台的完整技术架构文档(TAD)。该文档将作为开发指南和GitHub README的基础，全面描述系统的架构模式、技术栈、数据流、数据库设计、API接口和安全策略。核心目标是构建一个稳定、科学、隐私优先的抗焦虑健康管理平台。

## Glossary

- **No_More_Anxious**: 面向30+人群的高端健康管理平台，基于生物决定论和贝叶斯概率
- **TAD (Technical Architecture Document)**: 技术架构文档，描述系统的完整技术实现方案
- **Bayesian_Calibration**: 贝叶斯校准引擎，基于生理数据动态调整每日习惯目标
- **RAG_Engine**: 检索增强生成引擎，仅引用Semantic Scholar学术论文回答健康问题
- **Metabolic_Twin**: 代谢数字孪生，基于用户数据预测疲劳和能量水平
- **OS_Hub_Strategy**: 操作系统中心策略，直接从iOS HealthKit获取数据，绕过付费聚合器
- **HealthKit**: iOS原生健康数据框架，可读取Apple Watch、Garmin、Whoop等设备同步的数据
- **Oura_API_V2**: Oura官方API第二版，用于直接获取Oura戒指的准备度评分
- **HealthDataNormalizer**: 健康数据标准化器，将不同格式的HRV数据(SDNN/rMSSD)统一标准化
- **Local_First**: 本地优先架构模式，数据首先存储在设备本地，最大化隐私和离线能力
- **Resend**: 事务性邮件服务，使用React Email模板发送周报
- **APNs (Apple Push Notification Service)**: 苹果推送通知服务，用于本地通知
- **Supabase**: Serverless后端平台，提供Postgres数据库、向量存储和边缘函数
- **RLS (Row Level Security)**: Supabase行级安全策略，确保用户只能访问自己的数据
- **HRV (Heart Rate Variability)**: 心率变异性，反映自主神经系统状态
- **SDNN**: HRV标准差指标，常见于Garmin设备
- **rMSSD**: HRV均方根指标，常见于Apple Watch
- **Realm**: 移动端本地数据库，用于离线存储
- **CoreData**: iOS原生持久化框架，可选的本地存储方案

## Requirements

### Requirement 1: System Architecture Overview

**User Story:** As a developer, I want to understand the overall system architecture pattern, so that I can make informed decisions about implementation and deployment.

#### Acceptance Criteria

1. THE TAD SHALL describe the architecture pattern as "Local-First + OS-Hub Strategy"
2. THE TAD SHALL explain why this pattern achieves maximum privacy (data stays on device) and zero infrastructure cost
3. THE TAD SHALL include a high-level system diagram showing the relationship between iOS client, HealthKit, Oura API, Supabase backend, and external services
4. THE TAD SHALL describe the data sovereignty approach (raw health data stored locally, only aggregated insights synced to cloud)
5. THE TAD SHALL explain the offline-first capability and how the app functions without internet connectivity
6. THE TAD SHALL highlight the cost efficiency of this approach for indie hackers (no per-user API fees from aggregators)

### Requirement 2: Tech Stack Documentation

**User Story:** As a developer, I want a clear list of all technologies used in the platform, so that I can understand the dependencies and setup requirements.

#### Acceptance Criteria

1. THE TAD SHALL list all frontend technologies (iOS Native with SwiftUI)
2. THE TAD SHALL list all backend technologies (Supabase: Postgres + Vector DB + Auth + Edge Functions)
3. THE TAD SHALL list all wearable integration methods (HealthKit for primary data, Oura API V2 for direct integration)
4. THE TAD SHALL list all communication services (Local APNs for daily alerts, Resend for weekly reports)
5. THE TAD SHALL list all AI/LLM services (OpenAI API or Anthropic API)
6. THE TAD SHALL explain the rationale for the OS-Hub Strategy (bypassing paid aggregators like Rook/Terra to achieve zero per-user costs)
7. THE TAD SHALL describe the trade-offs of direct integration (more implementation work but full control and zero ongoing costs)
8. THE TAD SHALL explain why HealthKit can access data from multiple wearables (Apple Watch, Garmin, Whoop sync to Health app)

### Requirement 3: Data Ingestion and Normalization Flow

**User Story:** As a developer, I want to understand how raw health data is fetched and normalized, so that I can implement the data pipeline correctly.

#### Acceptance Criteria

1. THE TAD SHALL describe the complete data ingestion flow from HealthKit to local storage
2. THE TAD SHALL detail the HealthKit query process (requesting permissions, fetching HRV, sleep, RHR data)
3. THE TAD SHALL describe the Oura API V2 integration flow (OAuth authentication, fetching readiness scores)
4. THE TAD SHALL explain the HealthDataNormalizer logic (converting SDNN to rMSSD equivalents)
5. THE TAD SHALL specify the normalization formulas (e.g., SDNN × 1.5 ≈ rMSSD for rough conversion)
6. THE TAD SHALL describe the local storage strategy (Realm vs CoreData vs UserDefaults)
7. THE TAD SHALL explain when and what data syncs to Supabase (aggregated metrics only, not raw samples)
8. THE TAD SHALL include a Mermaid.js sequence diagram for the "Morning Data Fetch" process

### Requirement 4: Bayesian Calibration Engine Flow

**User Story:** As a developer, I want to understand how normalized health data flows through the Bayesian calibration engine, so that I can implement the daily goal adjustment logic.

#### Acceptance Criteria

1. THE TAD SHALL describe the complete Bayesian calibration flow from normalized data to UI update
2. THE TAD SHALL explain the Bayesian formula application (prior beliefs + new evidence → posterior probability)
3. THE TAD SHALL describe how posterior probabilities translate to goal adjustments (e.g., low HRV → reduce exercise target by 20%)
4. THE TAD SHALL specify the calibration rules (thresholds for "good", "moderate", "poor" physiological states)
5. THE TAD SHALL explain where the Bayesian engine runs (locally on device for privacy and speed)
6. THE TAD SHALL include a Mermaid.js sequence diagram for the "Daily Goal Calibration" process
7. THE TAD SHALL specify the data refresh frequency (e.g., every morning at 6 AM, or on-demand)

### Requirement 5: RAG Engine Data Flow

**User Story:** As a developer, I want to understand how the RAG engine retrieves and cites academic papers, so that I can implement the scientific question-answering feature.

#### Acceptance Criteria

1. THE TAD SHALL describe the complete RAG flow: User Question → Semantic Scholar API → Vector DB → LLM → Cited Answer
2. THE TAD SHALL explain the paper filtering criteria (Nature/Lancet/high-impact journals only)
3. THE TAD SHALL describe the vector embedding process for paper abstracts (stored in Supabase pgvector)
4. THE TAD SHALL explain how the LLM generates answers with inline citations
5. THE TAD SHALL specify the citation format (e.g., "[1] Smith et al., Nature 2023")
6. THE TAD SHALL describe the caching strategy to avoid redundant API calls
7. THE TAD SHALL explain the cost optimization strategy (caching embeddings, rate limiting queries)

### Requirement 6: Database Schema Design

**User Story:** As a developer, I want a clear database schema with entity relationships, so that I can implement data models and queries correctly.

#### Acceptance Criteria

1. THE TAD SHALL define the `users` table schema (id, email, created_at, subscription_tier)
2. THE TAD SHALL define the `device_tokens` table schema (id, user_id, oura_access_token, oura_refresh_token, created_at)
3. THE TAD SHALL define the `daily_aggregates` table schema (id, user_id, date, hrv_avg, sleep_hours, rhr_avg, readiness_score, created_at)
4. THE TAD SHALL define the `habits` table schema (id, user_id, name, category, baseline_target, created_at)
5. THE TAD SHALL define the `dynamic_goals` table schema (id, user_id, habit_id, date, adjusted_target, confidence_score, created_at)
6. THE TAD SHALL define the `journal_entries` table schema (id, user_id, question, answer, sources_json, created_at)
7. THE TAD SHALL define the `weekly_summaries` table schema (id, user_id, week_start_date, summary_text, email_sent_at, created_at)
8. THE TAD SHALL include an Entity-Relationship Diagram (ERD) showing table relationships
9. THE TAD SHALL specify foreign key constraints and indexes for performance
10. THE TAD SHALL explain the data minimization principle (raw samples stay local, only aggregates in Supabase)

### Requirement 7: API Interface Design

**User Story:** As a developer, I want clear API endpoint definitions with request/response formats, so that I can implement the frontend and backend integration.

#### Acceptance Criteria

1. THE TAD SHALL define the `POST /functions/sync-daily-aggregate` endpoint (iOS app uploads daily aggregated metrics)
2. THE TAD SHALL define the `GET /functions/calibration/today` endpoint (returns today's adjusted goals)
3. THE TAD SHALL define the `POST /functions/rag/ask` endpoint (submits a health question)
4. THE TAD SHALL define the `GET /functions/metrics/history` endpoint (retrieves historical aggregates)
5. THE TAD SHALL define the `POST /functions/oura/webhook` endpoint (receives Oura webhook notifications)
6. THE TAD SHALL define the `POST /functions/generate-weekly-report` endpoint (triggered by cron job)
7. THE TAD SHALL provide pseudo-code or TypeScript interfaces for each endpoint
8. THE TAD SHALL specify authentication requirements (JWT tokens from Supabase Auth)
9. THE TAD SHALL describe error response formats (status codes, error messages)

### Requirement 8: Directory Structure

**User Story:** As a developer, I want a clean and organized project structure, so that I can navigate the codebase efficiently.

#### Acceptance Criteria

1. THE TAD SHALL propose a directory structure for the iOS project (SwiftUI app with MVVM architecture)
2. THE TAD SHALL propose a directory structure for the backend (Supabase functions, migrations, types)
3. THE TAD SHALL specify where shared types/interfaces are stored (TypeScript definitions)
4. THE TAD SHALL describe the organization of API routes, services, and utilities
5. THE TAD SHALL indicate whether a monorepo or separate repositories are recommended
6. THE TAD SHALL show where the HealthDataNormalizer and Bayesian engine code reside (iOS app local logic)
7. THE TAD SHALL describe the organization of local data models (Realm/CoreData schemas)

### Requirement 9: Security and Privacy

**User Story:** As a user, I want my sensitive health data to be protected, so that I can trust the platform with my personal information.

#### Acceptance Criteria

1. THE TAD SHALL describe the data minimization principle (raw samples never leave device, only aggregates synced)
2. THE TAD SHALL explain the encryption strategy (data encrypted at rest in Supabase, TLS in transit)
3. THE TAD SHALL detail the Supabase RLS policies for user data isolation
4. THE TAD SHALL describe the authentication flow (Supabase Auth with email/password or OAuth)
5. THE TAD SHALL specify GDPR/HIPAA compliance considerations (right to deletion, data portability)
6. THE TAD SHALL explain the data retention policy (how long data is stored, user deletion rights)
7. THE TAD SHALL describe the API rate limiting strategy to prevent abuse
8. THE TAD SHALL explain how HealthKit permissions are requested and managed (iOS permission prompts)
9. THE TAD SHALL describe the Oura OAuth flow security (PKCE, secure token storage in Keychain)

### Requirement 10: Metabolic Twin Architecture

**User Story:** As a developer, I want to understand how the Metabolic Twin predicts energy and fatigue, so that I can implement the predictive modeling feature.

#### Acceptance Criteria

1. THE TAD SHALL describe the Metabolic Twin concept (digital twin constructed from user's historical data)
2. THE TAD SHALL explain the input features (HRV, sleep quality, RHR, activity levels, optional nutrition data)
3. THE TAD SHALL describe the prediction model (rule-based heuristics for MVP, machine learning for future)
4. THE TAD SHALL specify the output format (energy score 0-100, fatigue risk level: low/medium/high)
5. THE TAD SHALL explain the model calibration process (personalized baselines established over 2-4 weeks)
6. THE TAD SHALL describe how predictions are updated (calculated locally each morning based on latest data)
7. THE TAD SHALL explain where the prediction logic runs (locally on device for speed and privacy)

### Requirement 11: Communication Strategy

**User Story:** As a developer, I want to understand the notification and email strategy, so that I can implement user communications cost-effectively.

#### Acceptance Criteria

1. THE TAD SHALL describe the "Hybrid Communication Strategy" (local notifications for daily, email for weekly)
2. THE TAD SHALL explain the local push notification implementation (APNs for iOS, scheduled locally)
3. THE TAD SHALL specify notification triggers (morning goal updates, evening reflections)
4. THE TAD SHALL describe the Resend integration for weekly reports (React Email templates)
5. THE TAD SHALL explain the cost optimization (local notifications are free, Resend free tier covers 3000 emails/month)
6. THE TAD SHALL specify the weekly report generation flow (Supabase cron job triggers Edge Function)
7. THE TAD SHALL describe the email content structure (weekly insights, goal progress, scientific tips)

### Requirement 12: Deployment and Infrastructure

**User Story:** As a DevOps engineer, I want to understand the deployment strategy and infrastructure requirements, so that I can set up production environments.

#### Acceptance Criteria

1. THE TAD SHALL describe the iOS app distribution method (App Store, TestFlight for beta)
2. THE TAD SHALL explain the Supabase project setup (database, auth, storage, edge functions, cron jobs)
3. THE TAD SHALL specify the environment variables required (Supabase URL/keys, OpenAI API key, Resend API key, Oura client ID/secret)
4. THE TAD SHALL describe the CI/CD pipeline (GitHub Actions for automated testing and deployment)
5. THE TAD SHALL explain the monitoring and logging strategy (Supabase logs, iOS crash reporting)
6. THE TAD SHALL describe the backup and disaster recovery plan (Supabase automated backups)
7. THE TAD SHALL specify the cost breakdown (Supabase free tier, Resend free tier, OpenAI pay-as-you-go, Apple Developer $99/year)

