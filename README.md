# 🌿 AntiAnxiety™

> **基于真相架构与生物电压的认知义肢。**  
> “真相是摒弃臆想之后的安慰。”

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Mobile](https://img.shields.io/badge/Capacitor-Android-green)](https://capacitorjs.com/)
[![AI](https://img.shields.io/badge/Model-Claude_4.5-purple)](https://www.anthropic.com/)
[![Backend](https://img.shields.io/badge/Supabase-Powered-brightgreen)](https://supabase.com/)

---

## ✅ 项目声明
- 本项目为**个人独立开发**（产品、设计、前后端、算法、数据模型、部署）。
- 项目定位：面向 30+ 代谢退行人群的健康智能体，拒绝“数据监控疲劳”，以可证据化的生理事实重建安心。

---

## 🎯 项目简介
AntiAnxiety 不是传统健康 App，它是一套“真相架构”(Truth Architecture)：通过 **贝叶斯信念更新 + 临床评估 + 数字孪生画像 + AI 证据堆栈**，把模糊焦虑变成可解释、可执行、可迭代的健康决策系统。

**目标用户**
- 高压人群（科技从业者 / 创业者 / 海外中产）
- 追求数据准确度与证据溯源的人群
- 需要长期健康计划闭环管理的人群

---

## 📘 项目技术白皮书（简版）
> 完整技术细节请见：`docs/project/README.md`、`docs/project/TECH_STACK_AND_WORKFLOW.md`、`docs/project/PROJECT_CONSTITUTION.md`。

### 1) 技术目标
- 用可计算证据更新用户的焦虑先验（Prior）到后验（Posterior）。
- 构建数字健康孪生体，实现“从感知到行动再到反证”的闭环。
- 输出高可信度的信息流，避免安慰剂式内容。

### 2) 系统总架构
```
User Input → Unified Profile → Evidence Stack → Bayesian Update → Plan Engine → Execution Feedback → Memory & Profile
```
- **客户端**：Next.js App Router + Capacitor（Web/Android/iOS）。
- **AI 逻辑层**：Vercel Functions + Vercel AI SDK + LangChain.js。
- **数据层**：Supabase (PostgreSQL + pgvector + Realtime + RLS)。
- **应用架构**：MVVM（Server Actions → Domain Hooks → Presentational UI），跨端同构复用。

### 3) 临床评估与自适应问诊
- Onboarding 使用 GAD-7 / PHQ-9 / ISI 多步量表。
- 评估结果生成阶段性目标与个性化问题树，形成后续的 daily/weekly/monthly 校准路径。
- 结果写入 `onboarding_answers`、`phase_goals` 等核心表，驱动后续画像与计划引擎。

### 4) 贝叶斯信念循环（核心算法）
- 用户给出主观恐惧值（Prior），系统引入可溯源证据（生理/临床/行动）。
- 通过权重归一化与共识修正生成 Posterior。
- Posterior 写入 `bayesian_beliefs`，形成可回溯的证据链。

核心结构示意：
```ts
interface BayesianBelief {
  context: 'Metabolic_Crash' | 'Cardiac_Fear' | 'Social_Rejection';
  prior_score: number;
  posterior_score: number;
  evidence_stack: Array<{
    type: 'bio' | 'science' | 'action';
    weight: number;
    source: string;
  }>;
}
```

### 5) 数据闭环与计划引擎
- **闭环**：AI 生成 → 用户确认 → 行动记录 → 反馈再训练。
- **Max 计划对话**：基于数据新鲜度检测生成问题与计划项，可替换、可确认保存。
- **计划引擎**：基于当前状态与阻力最小原则推送唯一关键任务。

### 6) 数字健康孪生体
- 统一用户画像聚合器整合问卷、每日校准、Max 对话与硬件数据。
- 画像变化触发 `profile-sync`，驱动仪表盘、推荐与计划更新。

### 7) 可信信息流
- 双源学术检索（Semantic Scholar / PubMed）。
- 真相权重：权威度 + 时效性 + 来源质量综合评分。
- 共识仪表盘：区分高共识、新兴证据、争议内容。

### 8) 设备数据与可追溯性
- 穿戴设备接入：Fitbit、Oura、HealthKit（iOS）。
- 数据归一化后进入证据栈与画像系统，支持可追溯来源。

### 9) 安全与隐私
- **RLS 行级安全**：所有敏感表默认启用 RLS。
- **私钥隔离**：`.env.local` 管理密钥，拒绝入库。
- **记忆可控**：AI 记忆向量可追溯、可删除、可分区。

### 10) 可验证性与测试
- 关键算法采用 Vitest + fast-check 属性测试覆盖。
- 重点验证：Posterior 边界、权重归一化、证据栈幂等性。

---

## 🧩 核心功能
1. **临床 Onboarding**：GAD-7 / PHQ-9 / ISI 量表 + 目标生成。
2. **数字健康孪生体**：统一画像聚合 + 7 日趋势仪表盘。
3. **贝叶斯信念循环**：可视化的信念修正与证据堆栈。
4. **Max 计划对话**：数据驱动的计划生成与替换。
5. **穿戴设备整合**：Oura / Fitbit / HealthKit 数据同步。
6. **内容推荐系统**：学术与社区并行，拒绝模板化安慰。
7. **AI 健康助手**：上下文记忆 + 个性化方案生成。
8. **多端覆盖**：Web + Android + iOS（Capacitor）。

---

## 🛠️ 技术栈
- **前端**：Next.js 16、React 18、TypeScript、Tailwind
- **后端**：Vercel Functions、Supabase（PostgreSQL / RLS / Realtime）
- **AI**：Claude Sonnet 4.5 + DeepSeek v3.2 + Gemini 3 (fallback) + OpenAI Embedding
- **向量检索**：pgvector
- **移动端**：Capacitor

---

## 📁 项目结构
```
app/           Next.js App Router & API
components/    共享 UI 组件
hooks/         业务 Hooks
lib/           业务逻辑与算法
types/         TypeScript 类型
supabase/      SQL 与数据库脚本
scripts/       构建与部署脚本
public/        静态资源
__tests__/     单元/属性测试
android/       Android 原生工程（Capacitor）
antianxietynew/ iOS 原生工程（SwiftUI）
```

---

## 🚀 快速开始
### 环境要求
- Node.js 18+
- npm
- Supabase 账号

### 本地开发
```bash
npm install
cp .env.example .env.local
npm run dev
```

### 常用命令
```bash
npm run dev
npm run build
npm run lint
npm test
```

---

## 📄 相关文档
- `docs/project/README.md`
- `docs/project/TECH_STACK_AND_WORKFLOW.md`
- `docs/project/PROJECT_CONSTITUTION.md`
- `docs/project/DEPLOYMENT.md`
- `docs/project/ENV_SETUP.md`
- `docs/workspace/README.md`（两层工作模式：Core + Threads）

---

## 📌 当前重点
见 `docs/project/DEVELOPMENT_DIARY.md`（最新进展与当前关注点）。

---

## 🪪 License
MIT
