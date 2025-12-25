# 🌿 AntiAnxiety™

> **A Cognitive Prosthetic based on Truth Architecture & Bio-Voltage.**  
> “真相是摒弃臆想之后的安慰。” — Truth is the comfort after discarding imagination.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Mobile](https://img.shields.io/badge/Capacitor-Android-green)](https://capacitorjs.com/)
[![AI](https://img.shields.io/badge/Model-Claude_4.5-purple)](https://www.anthropic.com/)
[![IDE](https://img.shields.io/badge/Built_with-Kiro-orange)](https://kiro.dev/)
[![Backend](https://img.shields.io/badge/Supabase-Powered-brightgreen)](https://supabase.com/)

---

## 🎯 项目愿景 (Identity)

**真正的自律不是每天做一样的事情,而是根据你自己的生理指标来重塑健康”。**

Antianxiety 是一个专为 30+ 代谢退行人群设计的智能体，拒绝传统的“数据监控”（Tracking Fatigue），采用 **“真相架构” (Truth Architecture)**。核心哲学是利用 **数学（贝叶斯概率）** 与 **生理学（生物电压）**，把模糊的焦虑重构为精确、可控的生理适应过程。

### 目标用户
- 💼 科技从业者、创业者、高压人群
- 🌍 海外中产、硅谷科技圈等多语种用户
- 📈 对数据准确度、证据溯源要求高
- 🎯 追求高效、科学、可执行的健康管理方式

---

## 🧬 核心理念：个人健康智能体 / 生物孪生体

> **这是整个项目最重要的功能，没有之一！**

AntiAnxiety 的核心是构建用户的「数字健康孪生体」(Digital Health Twin)。

### 数据闭环架构

```
┌─────────────────────────────────────────────────────────────┐
│                    用户主动输入                              │
│   注册问卷 ─────┬───── 每日问卷 ─────┬───── 阶段性计划         │
└────────┬────────┴─────────┬─────────┴────────┬──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   统一用户画像                               │
│              unified_user_profiles                         │
│    demographics + goals + lifestyle + mood_trend + vector   │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────────┐      ┌─────────────────────────┐
│   个性化内容推荐     │      │   个性化健康计划         │
│   论文/期刊/帖子     │      │   基于画像动态调整       │
└─────────────────────┘      └─────────────────────────┘
```

### 这不是普通的健康App

| 传统 App | AntiAnxiety |
|:---------|:------------|
| 简单数据记录 | 多源数据聚合 + 向量化画像 |
| 通用建议模板 | 基于你的真实数据的 AI 推断 |
| 被动信息展示 | Max 主动问询 + 异常检测 |
| 独立功能模块 | 全链路数据闭环智能决策 |

### 关键页面

- `/dashboard` - 我的健康画像仪表盘
- `/daily-calibration` - 每日校准入口
- `/goals` - 阶段性健康计划

## 🧠 核心功能 I: 贝叶斯信念循环 (The Bayesian Belief Loop)

**这是项目的灵魂引擎。我们将认知行为疗法 (CBT) 的逻辑转化为可视化的数学过程。**

焦虑的本质是过高的 **先验概率**（Prior Probability，例如：认为自己会猝死）。我们通过引入 **高权重证据**（Evidence），强制大脑更新 **后验概率**（Posterior Probability）。

### 1. 交互模式 (Dual-Mode Interaction)

#### 🔴 主动式：沉浸重构仪式 (Active Ritual)
* **场景：** 每日校准后，或用户主动触发“高焦虑”状态。  
* **交互：** 全屏沉浸式体验。用户在一个可视化的 **“认知天平”** 上拖动滑块设定恐惧值。  
* **过程：**
    1. **Input:** 用户设定 Prior (e.g., 90% 恐惧)。
    2. **Weighing:** AI 投放“证据砝码”（生理数据 + 科学论文）。
    3. **Animation:** 贝叶斯公式 $P(H|E)$ 运转，伴随机械咬合声效，数字滚动下降。
    4. **Output:** 最终定格于 Posterior (e.g., 12% 风险)，用户点击“接受新信念”。

#### 🟢 被动式：静默微修正 (Passive Nudge)
* **场景：** 用户完成一个微习惯（如“深呼吸 3 分钟”）。  
* **交互：** 不打断当前流。  
* **过程：** 一个微小的绿色粒子飞入主页的“信念指数”中，Toast 提示：“皮质醇风险概率修正：-5%。”

### 2. 数据归一化 (Data Normalization)
所有信念更新基于统一的数据结构，确保证据可溯源、可计算。

```typescript
interface BayesianBelief {
  context: "Metabolic_Crash" | "Cardiac_Fear" | "Social_Rejection";
  prior_score: number;      // 用户输入的初始恐惧 (0-100)
  posterior_score: number;  // 计算后的修正值
  evidence_stack: Array<{
    type: "bio" | "science" | "action";
    weight: number;         // 证据权重 (0.1 - 0.9)
    source: string;         // e.g., "HRV=55ms" or "Paper ID"
  }>;
}
```

---

## 🛰️ 去噪的高清信息流 (Weighted Truth over Comfort)

去噪的高清信息流，拒绝安慰剂，只提供“加权真相”。

1. **双源并行搜索 (Dual-Source Search)**  
   - 广度：Semantic Scholar API（覆盖全学科引用）。  
   - 深度：PubMed / E-utilities（覆盖临床医学核心）。  
   - 机制：`Promise.all` 并行调用，毫秒级响应。
2. **加权修正算法 (Weighted Correction)**  
   - 我们不迷信引用数，我们计算“真相权重”：  
   - `Score = (权威度_Log * 0.4) + (时效性_Decay * 0.3) + (来源质量 * 0.3)`
3. **共识度仪表盘 (Consensus Meter)**  
   - UI：每一个 AI 洞察旁边都有一个微型仪表盘。  
   - 显示：🟢 高度共识 / 🟡 新兴证据 / ⚪️ 争议中。  
   - 交互：点击即可跳转至原始论文链接。

---

## 🧩 产品功能总览

1. **智能状态感知系统**  
   - 能量电池可视化：高效 / 平衡 / 恢复模式。  
   - 智能休息许可：检测高负荷时允许暂停打卡。  
   - 个性化洞察：睡眠、HRV、压力等多维数据综合分析。  
   - 数据来源：每日健康日志（睡眠时长、运动量、压力水平、HRV 等）。
2. **唯一核心任务 (The One Thing)**  
   - 动态任务推荐：AI 根据身体状态和健康目标智能推送。  
   - 最小阻力设计：任务匹配当前能量水平。  
   - 即时交互反馈：完成即可获得鼓励；完成后可解锁进阶习惯。  
   - 设计理念：避免任务列表焦虑，专注当下最重要的一件事。
3. **长期趋势分析**  
   - 3 天数据门槛后自动生成趋势分析。  
   - 多维度洞察：睡眠质量、运动量、压力水平、心情变化。  
   - 趋势可视化 + 智能建议，突出长期改善方向。
4. **动态健康贴士**  
   - 智能匹配算法：基于睡眠质量、运动量、压力状态推送。  
   - 15+ 专业贴士库，覆盖睡眠、运动、营养、压力、长寿。  
   - 自动轮播与去 AI 化表述，降低理解门槛。
5. **AI 健康助手**  
   - 双模型架构：Claude + DeepSeek，确保响应质量。  
   - 记忆系统：记住用户偏好和历史对话，自动加载 50 条上下文。  
   - 方案生成：AI 自动生成个性化健康方案，确认后同步到计划表。  
   - 闭环：AI 生成 → 用户确认 → 执行记录 → AI 优化。
6. **健康计划管理**  
   - iOS 日程表风格：计划展开/折叠、完整方案详情。  
   - 执行记录：每日完成情况追踪，可删除与调整。  
   - 数据流：用户执行数据 → AI 学习 → 优化下一个方案。
7. **个性化内容推荐**  
   - 多源抓取：Reddit、PubMed、X.com 精选内容。  
   - 向量检索：基于用户画像智能匹配，相关性评分门槛 4.5+。  
   - 独立推荐路由：`/feed` 与 `/inspiration`。  
   - 目标：高置信度信息推送，避免信息噪音。
8. **用户系统**  
   - 邮箱/密码认证 + 第三方登录（Google、X、GitHub）。  
   - 头像上传（2MB 限制）、社交平台绑定、多语言切换。  
   - 会员系统：Pro 升级功能。

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm
- Supabase 账号
- Claude API Key（可选：DeepSeek API Key）

### 本地开发
```bash
# 1. 克隆仓库
git clone https://github.com/Bronc-X/Nomoreanxiousweb.git
cd Nomoreanxiousweb

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 API Keys

# 4. 启动开发服务器
npm run dev

# 5. 访问应用
# http://localhost:3000
```

### 环境变量配置

在 `.env.local` 配置以下变量：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥

# AI 服务
ANTHROPIC_API_KEY=你的Claude API Key
DEEPSEEK_API_KEY=你的DeepSeek API Key（可选）

# OAuth（可选）
GITHUB_CLIENT_ID=你的GitHub OAuth Client ID
GITHUB_CLIENT_SECRET=你的GitHub OAuth Client Secret
```

⚠️ **安全提示**：不要将 `.env.local` 提交到 Git，所有 API Keys 必须通过环境变量配置。

### 数据库设置
1. 在 Supabase 控制台创建新项目。  
2. 执行 SQL 脚本初始化数据库：  
   - `supabase_init_complete.sql` - 基础表结构  
   - `supabase_ai_memory_vector.sql` - AI 记忆系统  
   - `supabase_content_feed_vectors.sql` - 内容推荐系统  
   - 根据需求执行其他 SQL 文件  
3. 启用 Realtime（Supabase 控制台）：`habits`、`habit_completions`、`ai_reminders` 等表。

---

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── landing/            # 主页（智能状态感知）
│   ├── assistant/          # AI 助手
│   ├── plans/              # 健康计划管理
│   ├── feed/               # 个性化内容推荐
│   ├── analysis/           # AI 分析报告
│   ├── settings/           # 用户设置
│   └── api/                # Serverless API 路由
├── components/             # React 组件
├── lib/                    # 业务与工具函数
├── types/                  # TypeScript 类型定义
├── supabase/               # Supabase SQL 脚本
├── scripts/                # 开发/部署脚本
└── public/                 # 静态资源
```

---

## 🧭 系统架构概要

### A. 客户端 App
- 路由：Expo Router + Next.js App Router（文件式）。  
- 认证：Supabase JS SDK 处理邮箱/第三方登录。  
- 输入：习惯打卡、情绪日志等原始数据表单。  
- 展示：实时订阅 Supabase Realtime 或查询“状态大脑”计算结果。  
- 规则：业务计算不在前端执行，前端只读取结果与可视化。

### B. 逻辑/计算层 (AI Agent on Vercel Functions)
- 技术栈：Vercel Serverless Functions (Node.js) + Vercel AI SDK + LangChain.js。  
- `/api/chat`：接收用户消息 → pgvector 检索历史记忆 → 构建 Prompt → 调用 LLM → 写回记忆闭环。  
- `/api/feed`：获取用户画像 → 在内容池向量表执行 RAG → 返回高置信度信息。  
- `/api/ingest-content`：由 `pg_cron` 触发，爬取 X/Reddit/期刊，嵌入并入库。

### C. 状态大脑 (Supabase / PostgreSQL)
- 认证：统一管理邮箱、Google、X、微信等登录。  
- AI 记忆：`ai_memory` (user_id, embedding, content_text, created_at)。  
- 贝叶斯逻辑：`pl/pgsql` 函数在 habit_completions 触发，计算 `belief_score`、`confidence_score` 写入 `user_metrics`。  
- 定时任务：`pg_cron` 负责预测与前瞻性提醒（如未完成最小阻力习惯时主动推送）。

### 核心数据模型 (Supabase)
- `profiles`：用户信息、语言、用户画像向量。  
- `habits`：习惯定义、最小阻力等级。  
- `habit_completions`：习惯打卡记录与备注。  
- `user_metrics`：真相/指标表（belief_curve_score、confidence_score、physical_performance_score 等）。  
- `bayesian_beliefs`：先验/后验与 `evidence_stack`，触发器自动调用 `calculate_bayesian_posterior` 并写入 `calculation_details`（RLS 已启用）。  
- `evidence_cache`：Semantic Scholar 论文缓存，带过期时间与检索索引。  
- `ai_memory`：LLM 对话向量记忆。  
- `content_feed_vectors`：内容池向量表，含 source_url、content_text、embedding、relevance_score。

---

## 🔄 AI 方案闭环系统

**这是项目的灵魂，从 AI 生成方案到用户执行再到数据反馈的完整闭环。** 详见 `AI_PLAN_CLOSED_LOOP_SYSTEM.md`。

### 核心流程
1. AI 助理生成方案（基础 + 进阶）。  
2. 用户交互：[修改] / [确认]。  
3. 确认后同步到主页计划表（iOS 日程表风格）。  
4. 每日记录执行情况。  
5. AI 收集数据优化下一轮方案。

### 为什么重要
- AI 生成个性化方案 → 记录真实执行数据 → AI 学习用户偏好 → 闭环优化，越用越准确。

---

## 🧪 贝叶斯信念循环进展（2025-12-02）
- 数据层：`bayesian_beliefs` 与 `evidence_cache` 迁移上线，RLS 开启，触发器 `trigger_bayesian_belief_insert/update` 自动调用 `calculate_bayesian_posterior`。  
- 计算函数：`calculate_bayesian_posterior` 支持权重归一化、共识加权、异常钳制；`validate_evidence_stack` 保障 JSONB 结构。  
- 属性测试：posterior 边界、权重归一化、证据栈序列化/反序列化、触发器幂等性等用 fast-check 覆盖。  
- 下一步：实现 evidence 权重分层校验与序列化、Semantic Scholar 拉取与缓存、/api/bayesian 端点与 UI（FearInputSlider、EvidenceRain、AnxietyCurve）。

## 🎉 最新完成 (2025-12-25)
1.  **个性化推荐系统重构**: 推荐理由完全基于用户实际数据生成（问卷评分、每日记录、问询回答），移除所有模板化语句和虚假关注声明。
2.  **News Feed UI 升级**: 添加平台官方 Logo (PubMed, Semantic Scholar, YouTube, X, Reddit)，高度增加 40%。
3.  **宪法更新**: 新增"个性化推荐原则"章节，定义数据真实性、诚实回退、抓取逻辑原则。

## 🎉 最新完成 (2025-12-22)
1.  **评估系统迁移完成**: 统一了 Daily/Weekly/Monthly 校准引擎，修复了睡眠评分和数据写入冲突问题。
2.  **UI 体验升级**: 每日校准结果页面采用了更温暖的文案；AI 助手新增了 "思考中" (Thinking) 状态展示。
4.  **UI 2.0 (Calm Luxury) 💎**: 全面升级了应用的 "Feel" (活体纹理), "Motion" (叙事滚动/液态导航) 和 "Native" (桌面微件)。
5.  **原生组件**: Android Widget 直接集成；iOS Widget 代码就绪。

## 🎉 最新完成（2025-12-02）
1. 贝叶斯信念循环 Phase 1 完成：核心表/函数/触发器 + RLS 部署，属性测试通过。  
2. 登录重定向循环修复：禁用 middleware 冲突，统一跳转 landing。  
3. 导航栏完善：恢复 5 个主要链接（核心洞察、模型方法、权威来源、分析报告、AI 计划表）。  
4. 用户菜单恢复：UserProfileMenu（个人设置、升级订阅、退出登录）。  
5. 项目大清理：删除 89 个文件（-34%），代码库 60 个减项、71 个文档合并。  
6. 页面功能优化：新增 `/feed` 个性化推荐页面，明确页面功能分区。  
7. AI 方案闭环系统：完整实现从生成到执行的闭环。

## 📌 当前重点 TODO
1. 权重与证据系统：完成 `lib/bayesian-evidence.ts` 权重校验/归一化与序列化，补充属性测试。  
2. 语义学术源：实现 `lib/services/bayesian-scholar.ts` 查询 + `evidence_cache` 缓存，API 失败时降级至 bio/action。  
3. API：落地 `/api/bayesian/ritual|nudge|history`，串联触发器与 evidence_stack 存储。  
4. UI 组件：完成 FearInputSlider、EvidenceRain、BayesianMoment、AnxietyCurve + PassiveNudge 动效与触觉。  
5. 整合：BayesianDashboard/landing 流程接入 daily calibration 与 habit completion，pg_cron 预测提醒。
