# nomoreanxious · Web & iOS

> 让进入退行性年龄的用户通过 AI 辅助真正接受生理的变化，并用最科学的方式进行改变，对抗焦虑。

---

## 1. 🎯 项目愿景与目标用户 (The "Why" & "Who")

* **核心问题：** 30+ 用户在事业 / 家庭 / 生理多重压力下产生焦虑，受到社会压力、职场压力、生理变化带来的容貌焦虑和生活质量下降，需要一个"冷峻理性"的助手帮助他们面对真实的生理信号。
* **解决方案：** 通过 Web/iOS 端记录 → Supabase 算法 → AI 助手反馈的闭环，首先让用户正视真相、停止臆想和不正确的情绪输入（被贩卖的焦虑），分类问题进行个性化AI分析，以第一性原理使用AI辅助持续提供解决方案（最小阻力习惯、贝叶斯信念曲线、高置信度信息推送），排除干扰项，让用户受到代谢退行性影响降至最小。
* **目标用户：** 30-45 岁高知精英人群（主要定位加州硅谷科技圈 / 海外中产），有一定收入，对健康管理和数据准确度要求极高。

## 2. ✨ 核心功能与状态 (The "What")

这是 AI 工作的核心"待办事项列表 (To-Do List)"。

* `[✅ 已实现]` **用户系统** – 核心账号体系已可用，继续补充体验优化  
  * Web 端: `[████████████████████] 100%` ✅ – 支持邮箱/密码注册、登录、登出、忘记密码、语言切换、资料编辑 (`/signup`, `/login`, `/settings`)  
  * iOS 端: `[████████████████████] 100%` ✅ – React Native 端已完成同等流程（详见移动端仓库）  
  * 待办：完善多语言 copy、补充安全审计 checklist

* `[🚧 开发中]` **第三方登录** – 当前专注 web 端，整体进度 `[███████████░░░░░░░] 60%`  
  * ✅ Google OAuth（注册页按钮 + Supabase provider 已打通）  
  * ✅ X (Twitter) OAuth（登录/注册页按钮，已可跳转授权）  
  * ✅ GitHub OAuth（登录页按钮已连通 Supabase）  
  * ⏳ web3钱包登录
  * ⏳ 微信扫码（目前仅展示二维码提示，尚未有后端回调）  
  * ⏳ iOS 端第三方账号尚未集成，需等 Expo 项目接入

* `[🚧 开发中]` **AI 助手** – 进度 `[███████████████░░░] 75%`，可对话但尚未完成预测场景  
  * ✅ Web UI (`AIAssistantChat` / `AIAssistantFloatingChat`)  
  * ✅ 会话接口 `/api/ai/chat`：DeepSeek + Supabase 记忆检索、上下文拼接、失败重试  
  * ✅ 记忆系统：`ai_memory` 表、向量存储、`fetchWithRetry`、历史上下文注入  
  * ⏳ 预测型建议 / 任务编排尚未实现（需要事件触发 + 定时任务联动）  
  * ⏳ iOS 端入口等待 Expo 集成

* `[🚧 开发中]` **个性化信息推送** – 进度 `[████████████████░░░] 85%`  
  * ✅ Reddit & PubMed 抓取：`/api/ingest-content` 已能批量入库并生成 embedding  
  * ✅ RAG 侧：`match_content_feed_vectors`、余弦相似度 fallback、4.5+ 过滤策略  
  * ✅ Dashboard 展示：`<PersonalizedFeed />` + 备用 trending feed  
  * ✅ X.com 数据：已添加手动精选列表 + Twitter API兜底方案  
  * ⏳ 内容质量打分 / 去噪逻辑待落地  
  * ⏳ iOS 端 UI 未接入

* `[✅ 已实现]` **贝叶斯信念循环** – 进度 `[████████████████████] 100%`  
  * ✅ SQL: `supabase_bayesian_functions.sql`、`user_metrics`、触发器函数全部创建  
  * ✅ 图表：`HabitCompletionChart`, `BeliefScoreChart`，Dashboard 已可显示历史数据  
  * ✅ **Web 前端已迁移到新 `habits/habit_completions` 表，触发器已激活**  
  * ✅ 兼容旧数据：新表添加 cue/response/reward/belief_score 字段  
  * ⏳ Onboarding 过程仍缺少信念问卷 & 先验值校准  
  * ⏳ iOS 端图表尚未联调

* `[🚧 开发中]` **AI 预测性提醒** – 进度 `[████████████████░░░] 80%` ✨新增  
  * ✅ `ai_reminders` 表结构完成（支持 habit_prompt / stress_check / exercise_reminder）  
  * ✅ AIReminderList 组件已集成到 dashboard  
  * ✅ 实时订阅：提醒自动刷新  
  * ⏳ 需配置 pg_cron 定时任务触发AI分析  
  * ⏳ iOS 端 UI 未接入

* `[🚧 开发中]` **数据同步** – 进度 `[██████████████░░░░░] 75%`  
  * ✅ Web 端基础：所有关键页面使用 Supabase 客户端、Session 同步完成  
  * ✅ 新增 Realtime：`HabitList` 订阅 `habits`/`habit_completions`，跨 Tab 自动刷新  
  * ✅ AI提醒实时同步：`ai_reminders` 表已启用 Realtime  
  * ⏳ 习惯以外的表（`user_metrics`, `ai_memory`, `content_feed_vectors`）仍靠轮询  
  * ⏳ iOS ↔ Web 的实时互通未打通，需要 Expo 端订阅同频道  
  * ⏳ 需要加上离线冲突/重放策略，防止双端并发写入


*(状态标签: `[✅ 已实现]`, `[🚧 开发中]`, `[💡 计划中]`, `[❌ 已废弃]`)*

补充账号和接口：
⚠️ **重要：所有敏感信息必须通过环境变量配置，不要硬编码在代码中**

环境变量配置（需要在 `.env.local` 文件中设置）：
- NEXT_PUBLIC_SUPABASE_URL - 你的 Supabase 项目 URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - 你的 Supabase Anon Key
- DEEPSEEK_API_KEY - 你的 DeepSeek API Key
- GITHUB_CLIENT_ID - GitHub OAuth Client ID
- GITHUB_CLIENT_SECRET - GitHub OAuth Client Secret

补充本地部署地址（web端）
http://localhost:3000

github仓库
https://github.com/Bronc-X/Nomoreanxiousweb.git

vercel web端
project-nomoreanxious-git-main-loxxs-projects-cc4324a7.vercel.app

⚠️ **安全提示：**
- 所有 API Keys 和 Secrets 必须通过环境变量配置
- 不要将 `.env.local` 文件提交到 Git
- 部署时需要在部署平台（Vercel/Cloudflare 等）配置环境变量


1. 🚀 架构总览 (Architecture Overview)
这是一个“解耦”的、后端优先的架构。

用户 (User) ->

[ 愚钝终端 (Dumb Terminals) ]

iOS App (React Native + Expo)

Web App (React Native for Web + Expo)

... (通过 API 和实时连接) ...

[ 逻辑/计算层 (Logic Layer) ]

Vercel Serverless Functions

(职责: AI 编排, RAG, 复杂 API)

-> (调用) -> OpenAI API

... (读/写/调用) ...

[ 状态大脑 (State Brain) ]

Supabase (PostgreSQL)

(职责: 认证, 数据库, AI 记忆, 贝叶斯函数, 自动化任务)

2. 🛠️ 核心组件拆解 (Component Breakdown)
A. 前端 (Dumb Terminal): React Native + Expo
技术: React Native (使用 Expo 框架)。

UI 库: Tamagui (确保你的 UI 在 iOS 和 Web 端表现一致且高性能)。

路由: Expo Router (使用基于文件的路由，Cursor AI 对此非常熟悉)。

职责:

认证: 使用 supabase-js SDK 处理用户登录、注册 (Google/X/微信等)。

输入: 提供表单让用户提交“习惯打卡”、“情绪日志”等原始数据。

展示: 实时订阅 (Supabase Realtime) 或查询“状态大脑”计算出的“真相”（例如：“贝叶斯曲线”图表）。

交互: 将用户的聊天消息发送到“逻辑层”(Vercel)。

关键规则: 前端禁止计算任何业务逻辑。 (例如：前端不应该知道“贝叶斯函数”的公式)。

B. 逻辑/计算层 (AI Agent): Vercel Functions
技术: Vercel Serverless Functions (Node.js)。

SDK: Vercel AI SDK 或 LangChain.js (用于 AI 编排)。

职责: 这是 AI 助手“思考”的地方。

AI 对话 API (/api/chat):

接收 App 传来的用户消息。

调用 Supabase pgvector 检索用户的“历史记忆”。

构建“冷峻”的 Prompt (包含历史记忆)。

调用 OpenAI API。

将 Q&A 存回 pgvector (完成记忆闭环)。

返回 AI 回应。

个性化信息流 API (/api/feed):

接收 App 请求。

从 Supabase pgvector 获取用户画像。

在“内容池”向量表中执行 RAG 搜索 (e.g., "相关性 > 4.5/5")。

返回高度过滤的信息。

后台任务触发器 (/api/ingest-content):

由 pg_cron 定时触发。

爬取 X/Reddit/期刊，将其嵌入并存入“内容池”向量表。

C. 状态大脑 (State Brain): Supabase
技术: Supabase (PostgreSQL)。

职责: 存储一切“真相”，并执行“第一性原理”的计算。

认证 (Auth): 管理所有用户（邮箱、Google、X、微信）。

AI 记忆 (pgvector):

表: ai_memory (user_id, embedding, content_text, created_at)。

职责: 存储每一次与用户的有意义互动，实现“永不SAY HI”。

贝叶斯逻辑 (PostgreSQL Functions):

这是你的核心创新点。

你将使用 pl/pgsql (SQL 的一种编程语言) 在数据库内部直接编写你的“贝叶斯函数”和“信心增强函数”。

触发器: 当一个新“习惯打卡”被存入 habit_completions 表时，一个数据库触发器 (Trigger) 会自动调用这些函数。

输出: 函数的计算结果（例如：belief_score: 0.85）被写入一个“真相表”(e.g., user_metrics)。

好处: 这 100% 符合“冷峻”和“第一性原理”。计算在离数据最近的地方发生，结果绝对可靠，前端只是在读取结果。

自动化 (pg_cron):

一个内置的定时任务调度器。

职责: “预测用户行为”和“前瞻性建议”。

示例: 设置一个 Cron 任务 ('0 22 * * *') (每晚 10 点) 运行一个函数，该函数分析用户当天的 habit_completions，如果发现“最小阻力习惯”未完成，它可以主动调用 Vercel Function 向用户推送一个“冷峻”的提醒。

3. 核心数据模型 (Core Data Schema)
以下是支持此架构所需的核心数据表 (在 Supabase 中)：

profiles (用户表):

id (关联 auth.users)

full_name, avatar_url, language (e.g., 'en', 'zh')

user_persona_embedding (Vector): 由 AI 生成的、总结用户核心画像的向量（用于 RAG）。

habits (习惯定义表):

id, user_id, title, description (e.g., "10分钟冥想")

min_resistance_level (最小阻力等级 1-5)

habit_completions (习惯打卡表):

id, habit_id, user_id, completed_at

user_notes (可选)

user_metrics (真相/指标表):

user_id, date

belief_curve_score (float): 由贝叶斯函数计算并写入

confidence_score (float): 由信心函数计算并写入

physical_performance_score (float)

(前端 App 只会读取这张表来画图)

ai_memory (AI 记忆表 - 向量表):

id, user_id

content_text (Q 或 A 的文本)

embedding (Vector): content_text 的向量

created_at

content_feed_vectors (RAG 内容池 - 向量表):

id, source_url (e.g., Reddit/X 链接)

content_text (帖子/论文摘要)

embedding (Vector): content_text 的向量

created_at

relevance_score (0-5)

published_at, crawled_at, updated_at

---

---

## ⚠️ 核心功能：AI方案闭环系统

**这是项目的灵魂，从AI生成方案到用户执行再到数据反馈的完整闭环。**

详见：**[AI_PLAN_CLOSED_LOOP_SYSTEM.md](./AI_PLAN_CLOSED_LOOP_SYSTEM.md)**

### 核心流程
1. AI助理生成方案（2个方案：基础+进阶）
2. 用户交互：[修改] [确认] 按钮
3. 确认后同步到主页计划表（iOS日程表风格）
4. 每日记录执行情况
5. AI采集数据优化下一个方案

### 为什么重要
- ✅ AI生成个性化方案
- ✅ 记录真实执行数据
- ✅ AI学习用户偏好
- ✅ 闭环优化，越用越准确

**必须优先实现此功能。**

---

## 当前重点 TODO
1. **🔴 最高优先级：AI方案闭环系统** - 见 AI_PLAN_CLOSED_LOOP_SYSTEM.md
2. **✅ 已完成：Web端迁移到新表结构** - habits/habit_completions表已激活，贝叶斯触发器正常工作
3. **✅ 已完成：X.com数据源** - 添加手动精选列表 + Twitter API兜底方案  
4. **✅ 已完成：AI预测性提醒系统** - ai_reminders表和AIReminderList组件已集成
5. 在 Supabase Prod 执行所有SQL脚本（bayesian_functions, ai_memory_vector, content_feed_vectors, ai_reminders）
6. 打通 `/api/ai/chat` 的 AI 记忆写入，保证聊天不会"失忆"
7. 配置 pg_cron 定时任务，启用AI预测性提醒
8. iOS ↔ Web 数据同步策略确认，避免重复执行 Cron
9. Onboarding 过程添加信念问卷 & 先验值校准
