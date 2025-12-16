# 逻辑链与工作流（数据闭环 / 去幻觉 / 高匹配推荐）

本文档描述本项目中「用户数据持续采集」与「AI 对话/推荐计划/推荐文章」之间如何形成**可追溯、可验证**的闭环，并标注关键的代码入口与数据表。

---

## 目标

1. **紧密结合**：用户每日输入、AI 助理互动、每日记录、问卷、个人信息、重点关注项 → 能够真实影响推荐计划与推荐文章匹配。
2. **去幻觉**：AI 不“编造用户数据/状态/引用”，缺数据就明确说未知并追问关键问题。
3. **持续更新**：新增每日数据后，系统自动刷新「AI 分析/方案」与「用户画像向量」。

---

## 数据源与落库（事实来源）

### 1) 用户档案（静态 + 半动态）
- 表：`profiles`
- 核心字段（与本闭环相关）：
  - `current_focus`（当前健康关注/限制）
  - `primary_focus_topics`（重点关注话题）
  - `metabolic_concerns`（代谢困扰，多选）
  - `ai_analysis_result`（AI 分析结果，JSON）
  - `ai_recommendation_plan`（AI 推荐方案，JSON）
  - `user_persona_embedding`（用于文章 RAG 匹配的向量）

### 2) 每日记录（持续采集）
- 表：`daily_wellness_logs`
- 字段：`log_date`, `sleep_duration_minutes`, `sleep_quality`, `exercise_duration_minutes`, `exercise_type`, `mood_status`, `stress_level`, `notes`

### 3) 每日问卷（持续采集）
- 表：`daily_questionnaire_responses`
- 字段：`responses`（JSONB 问题ID→答案索引）, `questions`（当天题目ID数组）, `ai_analysis` / `insights`（可选）

### 4) AI 助理互动（对话事实与记忆）
- 表：`ai_conversations`（前端保存对话历史）
- 表：`ai_memory`（向量记忆库，用于检索式上下文；由 `/api/chat` 写入）

### 5) 推荐文章内容池（RAG）
- 表：`content_feed_vectors`
- 用法：`/api/feed` 基于 `profiles.user_persona_embedding` 调用 `match_content_feed_vectors` 检索高相似内容并过滤高分。

---

## 核心闭环（Logic Chain）

用一句话表示：

**采集（Profile / Daily Logs / Questionnaire / Chat） → 归档（Supabase 表） → 刷新（AI 分析/方案 + Persona Embedding） → 输出（Chat 回复 + 推荐计划 + 推荐文章）**

---

## 工作流（Workflow）

### A. 用户资料保存 → 方案/文章推荐刷新
1. 用户在 `components/HealthProfileForm.tsx` 提交设置
2. `POST /api/profile/save`：写入 `profiles`（含 `metabolic_concerns` 等）
3. 前端后台调用 `POST /api/user/refresh`
4. `POST /api/user/refresh` 做两件事：
   - 1) 计算「最近 7 天」睡眠/压力派生值（从 `daily_wellness_logs`）
   - 2) 重新生成并写回：
     - `profiles.ai_analysis_result`
     - `profiles.ai_recommendation_plan`
     - `profiles.user_persona_embedding`（用于 `/api/feed`）

关键文件：
- `components/HealthProfileForm.tsx`
- `app/api/profile/save/route.ts`
- `app/api/user/refresh/route.ts`
- `lib/aiAnalysis.ts`
- `lib/userPersona.ts`

### B. 每日记录 → 方案/文章推荐刷新
1. 用户在 `components/EnhancedDailyCheckIn.tsx` 保存今日状态（写 `daily_wellness_logs`）
2. 前端后台调用 `POST /api/user/refresh`
3. 刷新后的 `profiles.ai_recommendation_plan` 与 `profiles.user_persona_embedding` 会反映近期真实数据（避免“凭空建议”）

关键文件：
- `components/EnhancedDailyCheckIn.tsx`
- `app/api/user/refresh/route.ts`

### C. 每日问卷 → 方案/文章推荐刷新
1. 用户在 `components/DailyQuestionnaire.tsx` / `components/DailyInsightHub.tsx` 提交问卷（写 `daily_questionnaire_responses`）
2. 前端后台调用 `POST /api/user/refresh`
3. `lib/userPersona.ts` 会把问卷关键题转成语义摘要，写入向量（提升推荐文章匹配度）

关键文件：
- `components/DailyQuestionnaire.tsx`
- `components/DailyInsightHub.tsx`
- `lib/userPersona.ts`

### D. Chat（对话）上下文注入与“去幻觉”约束
1. 前端 `components/AIAssistantChat.tsx` 调用 `POST /api/chat`（携带对话历史）
2. `app/api/chat/route.ts` 在服务端读取：
   - `profiles`（包含 `current_focus` / `primary_focus_topics` / `metabolic_concerns` / `ai_recommendation_plan` 等）
   - 今日 + 近 7 天 `daily_wellness_logs`
   - 今日 `daily_questionnaire_responses`
   - `ai_memory`（向量检索相关历史记忆）
3. `buildUserContext(...)` 将这些事实拼成可读上下文块注入系统提示词
4. 系统提示词包含 **DATA GROUNDING POLICY**：
   - 只能引用上下文中出现的事实
   - 缺数据就明确“未知”并追问关键问题
   - 论文引用只能引用提供的论文列表（不虚构）

关键文件：
- `components/AIAssistantChat.tsx`
- `app/api/chat/route.ts`
- `lib/aiMemory.ts`
- `lib/persona-prompt.ts`

---

## 为什么现在能“扣得上”（一致性说明）

1. **数据表统一**：Chat 的每日数据读取统一为 `daily_wellness_logs`，避免读到旧表导致上下文空、AI 只能泛化建议。
2. **推荐计划可持续更新**：通过 `POST /api/user/refresh`，每日记录/问卷/档案变更都会触发方案重算（不是“一次生成终身不变”）。
3. **文章推荐更贴合**：`lib/userPersona.ts` 生成画像文本时，纳入了近期每日趋势与问卷语义摘要，提升 `user_persona_embedding` 与 `content_feed_vectors` 的相似匹配质量。
4. **去幻觉策略落地**：
   - `lib/persona-prompt.ts` 不再暗示“全知全记”，避免模型编造记忆
   - `app/api/chat/route.ts` 增加 DATA GROUNDING POLICY（缺数据就问，不猜）
   - `lib/aiAnalysis.ts` 修正置信度计算：只在有真实输入字段时加分，并统一枚举值，减少“凭默认值给高置信度”的伪精确

---

## Mermaid：端到端数据闭环图

```mermaid
flowchart TD
  U[用户输入] --> P[profiles\n(个人信息/重点关注/代谢困扰)]
  U --> D[daily_wellness_logs\n(每日记录)]
  U --> Q[daily_questionnaire_responses\n(每日问卷)]
  U --> C[ai_conversations\n(对话历史-前端保存)]

  C --> M[ai_memory\n(向量记忆库-服务端写入)]

  P --> R[/api/user/refresh/]
  D --> R
  Q --> R

  R --> A[ai_analysis_result + ai_recommendation_plan\n(lib/aiAnalysis.ts)]
  R --> E[user_persona_embedding\n(lib/userPersona.ts)]

  E --> F[/api/feed\nmatch_content_feed_vectors/]
  F --> V[content_feed_vectors\n(文章内容池)]

  P --> CH[/api/chat/]
  D --> CH
  Q --> CH
  M --> CH
  CH --> OUT[AI 回复（严格 grounding）]
```

---

## 数据库迁移（需要在 Supabase 执行）

本次新增/补齐（已落到 `supabase/migrations/`）：
- `supabase/migrations/20251215_add_metabolic_concerns.sql`
- `supabase/migrations/20251215_add_daily_wellness_logs_exercise_type.sql`

---

## 验证清单（你可以如何自测）

1. 保存健康设置（含代谢困扰）→ 进入 `/assistant` 看报告是否出现对应微习惯
2. 填写今日状态 → Chat 中询问建议，回复应引用“今日睡眠/压力/运动/情绪”等（存在则引用，不存在则询问）
3. 提交问卷 → `/api/feed` 的内容匹配应更贴近近期主题（若 embedding 服务未配置会回退）

