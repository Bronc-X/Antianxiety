# Antianxiety - 技术栈与工作流

## 1. 技术栈明细

### 前端

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 16.0.1 |
| 语言 | TypeScript | 5.9.3 |
| UI 组件库 | Shadcn UI + Radix UI | - |
| 样式 | Tailwind CSS | 4.x |
| 动画 | Framer Motion | 12.x |
| 复杂动画 | Lottie (lottie-react) | 2.4.1 |
| 图表 | Recharts | 3.5.0 |
| 状态管理 | React Context + Hooks | - |
| 主题 | next-themes | 0.4.6 |
| 表单验证 | react-hook-form + Zod | 待安装 |

### 跨平台/移动端

| 类别 | 技术 | 版本 |
|------|------|------|
| 跨平台运行时 | Capacitor | 7.4.4 |
| 触觉反馈 | @capacitor/haptics | 7.0.2 |
| 本地存储 | @capacitor/preferences | 7.0.2 |
| 网络检测 | @capacitor/network | 7.0.2 |
| 启动画面 | @capacitor/splash-screen | 7.0.3 |
| 浏览器 | @capacitor/browser | 7.0.2 |
| 目标平台 | Android | - |

> iOS 原生工程使用 SwiftUI，位于 `antianxietynew/`，不通过 Capacitor。

### 后端/BaaS

| 类别 | 技术 | 用途 |
|------|------|------|
| 数据库 | Supabase (PostgreSQL) | 数据存储 |
| 向量搜索 | pgvector | Embeddings/RAG |
| 认证 | Supabase Auth | 用户认证 |
| AI | Claude API (Anthropic) | AI 对话/分析 |
| 学术验证 | Semantic Scholar API | 科学依据验证 ✅ 已集成 |
| 部署 (Web) | Vercel | Web 托管 |

### 后台任务层 (n8n)

| 类别 | 技术 | 用途 |
|------|------|------|
| 工作流引擎 | n8n (Self-hosted) | 定时任务编排 |
| 部署方式 | Docker / Railway | 后台服务托管 |
| 触发方式 | Cron + Webhook | 定时/事件触发 |

#### n8n 核心任务

| 任务名称 | 频率 | 功能描述 |
|----------|------|----------|
| 科学搬运工 | 每周一次 | Semantic Scholar → LLM 总结 → Supabase knowledge_base |
| 每日洞察生成器 | 每天凌晨 4 点 | 扫描活跃用户 → 预生成早安洞察 → pre_insights 表 |
| 论文向量化 | 每周一次 | 新论文 → OpenAI Embedding → pgvector 存储 |

### 开发工具

| 类别 | 技术 | 版本 |
|------|------|------|
| 测试框架 | Vitest | 4.0.14 |
| 属性测试 | fast-check | 4.3.0 |
| 代码检查 | ESLint | 9.x |
| 包管理 | npm | - |
| 构建工具 | Turbopack | Next.js 16 默认 |

---

## 2. 项目工作流

### 开发流程

```
源代码 (TypeScript/React)
       │
       ▼
┌─────────────┐
│ npm run dev │  ← 本地开发 (Next.js Dev Server)
└─────────────┘
       │
       ▼
┌──────────────┐
│ npm run test │  ← 运行测试 (Vitest + fast-check)
└──────────────┘
```

### 构建流程

```
┌─────────────────────────────────────────────────────────┐
│                   npm run build:cap                      │
│                         │                                │
│    ┌────────────────────┼────────────────────┐          │
│    ▼                    ▼                    ▼          │
│ next build         生成 /out/          npx cap sync     │
│ (静态导出)         (HTML/JS/CSS)       (同步到原生)      │
└─────────────────────────────────────────────────────────┘
```

### 部署流程

```
/out/ 静态文件
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────┐        ┌───────────┐      ┌───────────┐
│ Vercel  │        │ Android   │      │ Cloudflare│
│  (Web)  │        │   APK     │      │  Pages    │
└─────────┘        └───────────┘      └───────────┘
                         │
                         ▼
                  npm run android
                  (打开 Android Studio)
```

### 在线运行模式 - 更新工作流

本项目采用**在线运行模式**，Android 应用通过 WebView 加载远程部署的 Web 应用。

```
┌─────────────────────────────────────────────────────────────────┐
│                        开发阶段                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. 修改 Web 代码                                                │
│         │                                                        │
│         ▼                                                        │
│  2. npm run dev (本地测试 localhost:3000)                        │
│         │                                                        │
│         ▼                                                        │
│  3. 测试通过? ──否──► 返回步骤 1                                  │
│         │是                                                      │
│         ▼                                                        │
│  4. git push (提交到 GitHub)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        部署阶段                                  │
├─────────────────────────────────────────────────────────────────┤
│  5. Vercel 自动检测推送                                          │
│         │                                                        │
│         ▼                                                        │
│  6. 自动构建并部署到 project-metabasis.vercel.app                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        客户端生效                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐              ┌─────────────────┐               │
│  │ Web 浏览器  │              │ Android App     │               │
│  │             │              │ (WebView)       │               │
│  └──────┬──────┘              └────────┬────────┘               │
│         │                              │                         │
│         └──────────┬───────────────────┘                         │
│                    ▼                                             │
│         用户刷新即可看到最新版本                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### 更新流程说明

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 修改代码 | 在 `antianxiety/` 目录修改任何文件 |
| 2 | 本地测试 | `npm run dev` 在 localhost:3000 预览 |
| 3 | 提交代码 | `git push` 到 GitHub |
| 4 | 自动部署 | Vercel 检测到推送，自动构建部署 |
| 5 | 生效 | Web 和 Android 用户刷新即可看到更新 |

#### Android 应用更新机制

- **无需重新发布 APK**: 因为 Android 应用加载的是远程 URL (project-metabasis.vercel.app)
- **即时生效**: Vercel 部署完成后，Android 用户刷新应用即可看到更新
- **离线降级**: 如果网络不可用，显示离线提示页面

#### 何时需要重新构建 Android APK

仅在以下情况需要重新构建并发布 APK：

| 情况 | 说明 |
|------|------|
| 修改 `capacitor.config.ts` | Capacitor 配置变更 |
| 添加/更新 Capacitor 插件 | 需要原生代码支持 |
| 修改 `android/` 目录 | Android 原生代码变更 |
| 更改应用图标/启动画面 | 原生资源变更 |

### 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                      n8n 后台层 (备货)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ 科学搬运工      │    │ 每日洞察生成器  │                     │
│  │ (每周)          │    │ (每天 4:00)     │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  Semantic Scholar API    daily_logs 扫描                         │
│           │                      │                               │
│           ▼                      ▼                               │
│     LLM 总结翻译           LLM 预生成洞察                        │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         Supabase (预热数据)              │                    │
│  │  knowledge_base │ pre_insights │ vectors │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ 预热数据
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API 层 (实时服务)                      │
├─────────────────────────────────────────────────────────────────┤
│  客户端 (Next.js/Capacitor)                                      │
│         │                                                        │
│         ├── /api/chat ──► 读取预热洞察 + 实时 RAG + Scientific   │
│         │                 Search (Semantic Scholar 实时补充)     │
│         │                                                        │
│         ├── /api/insight ──► 直接返回预热内容，秒级响应          │
│         │                                                        │
│         ├── Supabase Client ──► PostgreSQL (数据存储)            │
│         │                       └── pgvector (向量搜索/RAG)      │
│         │                                                        │
│         └── Capacitor Plugins                                    │
│             ├── Haptics (触觉反馈)                               │
│             ├── Preferences (本地存储)                           │
│             └── Network (网络状态)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2.5 技术实现映射

### 用户交互层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 每日校准弹窗 | Radix Dialog + Framer Motion AnimatePresence | `components/DailyCheckin.tsx` |
| 触觉反馈按钮 | Capacitor Haptics + 磁性效果 + 涟漪动画 + 3D倾斜 | `components/motion/MotionButton.tsx` |
| 生物电压卡片 | 多层脉动动画 + 能量粒子系统 + 旋转光环 + 动态颜色 | `components/BioVoltageCard.tsx` |
| 科学共识仪表 | SVG弧形渐变 + 弹簧物理动画 + 发光滤镜 + 数字滚动 | `components/ConsensusMeter.tsx` |
| 智慧轮播 | Framer Motion AnimatePresence + 淡入淡出 | `components/WisdomCarousel.tsx` |
| 主仪表盘 | React useState + useEffect + 条件渲染 | `components/LandingContent.tsx` |

### 动画效果详解

| 组件 | 动画效果 | 技术细节 |
|------|----------|----------|
| MotionButton | 磁性吸附 + 3D倾斜 + 涟漪扩散 + 光泽扫过 | `useMotionValue` + `useSpring` + `useTransform` |
| BioVoltageCard | 能量波纹 + 旋转光环 + 粒子发射 + 呼吸脉动 | 多层 `motion.div` + CSS `conic-gradient` |
| ConsensusMeter | 弹簧指针 + 发光弧线 + 数字滚动 + 脉动中心点 | SVG `filter` + `requestAnimationFrame` |

### 数据采集层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 校准数据处理 | TypeScript 纯函数 | `lib/calibration-service.ts` |
| 异常检测算法 | 统计阈值 (±15% 偏差) | `lib/calibration-service.ts` |
| 主动询问逻辑 | 条件分支 + 选项映射 | `lib/active-inquiry.ts` |
| 生物电压计算 | 加权公式 (睡眠×0.4 + HRV×0.3 + 压力×0.3) | `lib/bio-voltage.ts` |

### Max 计划生成服务层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 数据聚合 | Supabase 多表查询 + 新鲜度检查 | `lib/max/plan-data-aggregator.ts` |
| 问题生成 | 优先级排序 + 3问题上限 | `lib/max/question-generator.ts` |
| AI 计划生成 | DeepSeek/Gemini API + HRV 集成 | `lib/max/plan-generator.ts` |
| 计划项替换 | 同类别模板库 + 一致性验证 | `lib/max/plan-replacer.ts` |
| 对话 API | init/respond/generate/skip 动作 | `app/api/max/plan-chat/route.ts` |
| 替换 API | 单项替换 + 一致性检查 | `app/api/max/plan-replace/route.ts` |

### AI 服务层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 洞察生成 | Claude Sonnet 4.5 + Vercel AI SDK (流式) | `app/api/insight/generate/route.ts` |
| AI 对话 | Claude Sonnet 4.5 + RAG 上下文注入 | `app/api/chat/route.ts` |
| 向量生成 | OpenAI text-embedding-3-small (1536维) | `lib/rag.ts` |
| 向量搜索 | pgvector + cosine similarity + RPC | `lib/rag.ts` |
| 关键词提取 | Claude Sonnet 4.5 (医学术语转换) | `lib/services/scientific-search.ts` |

### AI 模型配置

| 用途 | 模型 | 提供商 |
|------|------|--------|
| 对话/洞察 | claude-sonnet-4-5-20250929 | Anthropic |
| 深度思考 | claude-sonnet-4-5-20250929-thinking | Anthropic |
| 向量嵌入 | text-embedding-3-small | OpenAI |
| 备用对话 | gpt-5.1-chat | OpenAI |

### 科学验证层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 论文搜索 | Semantic Scholar API + PubMed API | `lib/services/scientific-search.ts` |
| 共识度计算 | 引用数 + Meta分析权重 | `lib/consensus-meter.ts` |
| 知识库存储 | Supabase + pgvector embedding | `supabase_vector_knowledge_base.sql` |

### 数据持久层

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 用户认证 | Supabase Auth (OAuth + Email) | `lib/supabase.ts` |
| 日志存储 | PostgreSQL + RLS | `supabase_schema.sql` |
| 向量索引 | pgvector ivfflat | `supabase_ai_memory_vector.sql` |
| 本地缓存 | localStorage + Capacitor Preferences | 各组件内联 |

### 后台任务层

| 功能模块 | 技术实现 | 触发方式 |
|----------|----------|----------|
| 论文采集 | n8n HTTP Node → Semantic Scholar | Cron (每周日 2AM) |
| 论文向量化 | n8n → OpenAI Embedding API | Cron (每周) |
| 洞察预生成 | n8n → Claude API → Supabase | Cron (每天 4AM) |
| 用户画像更新 | n8n → Supabase Function | Webhook (登录触发) |

### 部署与分发

| 环节 | 技术实现 | 配置文件 |
|------|----------|----------|
| Web 部署 | Vercel (自动 CI/CD) | `vercel.json` |
| Android 打包 | Capacitor + Gradle | `capacitor.config.ts` |
| 静态导出 | Next.js output: 'export' | `next.config.ts` |
| 环境变量 | Vercel Environment Variables | `.env.local` |

---

### n8n 工作流详解

#### 任务 1: 科学搬运工 (Weekly Paper Harvester)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Cron 触发    │ ──► │ Semantic     │ ──► │ LLM 总结     │
│ (每周日 2AM) │     │ Scholar API  │     │ (Claude)     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Supabase     │ ◄── │ OpenAI       │ ◄── │ 格式化存储   │
│ knowledge_   │     │ Embedding    │     │ 结构         │
│ base + vector│     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

**搜索关键词**: metabolic health, HRV, sleep optimization, stress physiology, circadian rhythm

#### 任务 2: 每日洞察生成器 (Daily Insight Generator)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Cron 触发    │ ──► │ 查询活跃用户 │ ──► │ 获取昨日     │
│ (每天 4AM)   │     │ (7天内登录)  │     │ daily_logs   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Supabase     │ ◄── │ 存储预生成   │ ◄── │ LLM 生成     │
│ pre_insights │     │ 洞察         │     │ 早安洞察     │
└──────────────┘     └──────────────┘     └──────────────┘
```

**洞察模板**: "Comforting Truth" 风格，基于用户昨日数据生成个性化早安消息

---

## 3. 关键命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 本地开发服务器 |
| `npm run build` | Next.js 构建 |
| `npm run build:cap` | 构建 + Capacitor 同步 |
| `npm run android` | 打开 Android Studio |
| `npm run test` | 运行测试 |
| `npm run cap:sync` | 同步 Web 资源到原生项目 |

---

## 4. 目录结构

```
antianxiety/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── ui/                # Shadcn UI 组件
│   ├── motion/            # Framer Motion 动画组件
│   ├── lottie/            # Lottie 动画组件
│   └── layout/            # 布局组件
├── hooks/                  # 自定义 Hooks
├── lib/                    # 工具函数和配置
├── types/                  # TypeScript 类型定义
├── public/                 # 静态资源
│   └── lottie/            # Lottie JSON 动画文件
├── android/                # Capacitor Android 项目
├── out/                    # Next.js 静态导出输出
├── __tests__/              # 测试文件
│   └── properties/        # 属性测试
├── capacitor.config.ts     # Capacitor 配置
├── next.config.ts          # Next.js 配置
└── package.json            # 项目依赖
```

---

## 5. 环境变量

### Next.js 应用

| 变量 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `ANTHROPIC_API_KEY` | Claude API 密钥 |
| `OPENAI_API_KEY` | OpenAI API 密钥 (Embedding + 关键词提取) |
| `OPENAI_API_BASE` | OpenAI API 基础 URL (可选，用于代理) |
| `SEMANTIC_SCHOLAR_API_KEY` | Semantic Scholar API 密钥 (可选，提高限额) |

> 注意：客户端可访问的变量必须以 `NEXT_PUBLIC_` 为前缀

### n8n 后台任务

| 变量 | 用途 |
|------|------|
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 (绕过 RLS) |
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `ANTHROPIC_API_KEY` | Claude API 密钥 |
| `SEMANTIC_SCHOLAR_API_KEY` | Semantic Scholar API 密钥 |

---

## 6. 数据库表结构 (n8n 相关)

### knowledge_base (科学论文库)

```sql
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id text UNIQUE NOT NULL,
  title text NOT NULL,
  abstract text,
  summary_zh text,           -- LLM 生成的中文摘要
  keywords text[],
  citation_count integer,
  year integer,
  url text,
  doi text,
  embedding vector(1536),    -- OpenAI text-embedding-3-small
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### pre_insights (预生成洞察)

```sql
CREATE TABLE pre_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_date date NOT NULL,
  content text NOT NULL,
  data_summary jsonb,        -- 基于的数据摘要
  generated_at timestamptz DEFAULT now(),
  viewed_at timestamptz,     -- 用户查看时间
  UNIQUE(user_id, insight_date)
);
```


### 贝叶斯信念循环层 (Bayesian Belief Loop)

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 证据系统 | TypeScript 纯函数 + 权重归一化 | `lib/bayesian-evidence.ts` |
| 学术搜索 | Semantic Scholar API + 缓存 | `lib/services/bayesian-scholar.ts` |
| 主动仪式 API | Next.js Route Handler + 贝叶斯计算 | `app/api/bayesian/ritual/route.ts` |
| 被动微调 API | Next.js Route Handler + 概率修正 | `app/api/bayesian/nudge/route.ts` |
| 历史数据 API | Next.js Route Handler + 趋势分析 | `app/api/bayesian/history/route.ts` |
| 恐惧输入 | Framer Motion useSpring + Haptics | `components/bayesian/FearInputSlider.tsx` |
| 证据雨动画 | Framer Motion staggerChildren + spring | `components/bayesian/EvidenceRain.tsx` |
| 贝叶斯时刻 | AnimatePresence + 数字滚动 | `components/bayesian/BayesianMoment.tsx` |
| 认知天平 | Framer Motion variants + 倾斜动画 | `components/bayesian/CognitiveScale.tsx` |
| 被动微调 | Toast + 粒子飞行 motion path | `components/bayesian/PassiveNudge.tsx` |
| 焦虑曲线 | Recharts + 颜色编码 | `components/bayesian/AnxietyCurve.tsx` |
| 仪表板页面 | SWR 数据获取 + 完整仪式流程 | `app/bayesian/page.tsx` |
| 微调 Hook | Supabase Realtime + API 调用 | `hooks/useBayesianNudge.ts` |

### 贝叶斯计算公式

```
后验概率 = (似然度 × 先验概率) / 证据强度

其中:
- 似然度 = 归一化加权共识平均值
- 证据强度 = 0.5 + (总权重 × 0.3)
- 权重范围: bio [0.2-0.4], science [0.3-0.6], action [0.05-0.2]
```

### 属性测试覆盖

| 属性 | 验证内容 | 测试文件 |
|------|----------|----------|
| Property 1 | 后验分数边界 [0, 100] | `bayesian-belief.property.test.ts` |
| Property 2 | 证据权重边界 | `bayesian-belief.property.test.ts` |
| Property 3 | 权重归一化 = 1.0 | `bayesian-belief.property.test.ts` |
| Property 4 | 证据栈序列化往返 | `bayesian-belief.property.test.ts` |
| Property 5 | 信念分数持久化往返 | `bayesian-api.property.test.ts` |
| Property 6 | 夸大因子计算 | `bayesian-belief.property.test.ts` |
| Property 7 | 曲线颜色编码一致性 | `bayesian-curve.property.test.ts` |
| Property 8 | 被动微调触发一致性 | `bayesian-api.property.test.ts` |
| Property 9 | 科学证据引用过滤 | `bayesian-scholar.property.test.ts` |
| Property 10 | 数据库触发器幂等性 | `bayesian-belief.property.test.ts` |
| Property 11 | API 失败优雅降级 | `bayesian-scholar.property.test.ts` |

---

### 动态计划适应系统 (Adaptive Plan Follow-up)

| 功能模块 | 技术实现 | 关键文件 |
|----------|----------|----------|
| 问询会话管理 | TypeScript 服务 + Supabase | `lib/services/follow-up-service.ts` |
| 执行追踪 | 执行率计算 + 连续失败检测 | `lib/services/execution-tracking-service.ts` |
| 智能平替推荐 | AI 生成 + 用户偏好过滤 | `lib/services/alternative-generation-service.ts` |
| 计划演化历史 | 版本追踪 + 用户总结生成 | `lib/services/plan-evolution-service.ts` |
| 四维科学解释 | 生理/神经/心理/行为科学 | `lib/services/scientific-explanation-service.ts` |
| 详细计划生成 | 最少5个行动项 + 完整字段 | `lib/services/detailed-plan-generator.ts` |
| 理解度评分 | 4维加权 (各25%) + 95分阈值 | `lib/services/understanding-score-service.ts` |
| 用户偏好档案 | 成功模式 + 避免活动 | `lib/services/preference-profile-service.ts` |
| 问询会话 API | GET/POST/PATCH | `app/api/follow-up/route.ts` |
| 执行追踪 API | GET/POST/PATCH | `app/api/execution-tracking/route.ts` |
| 平替推荐 API | GET/POST/PATCH | `app/api/alternatives/route.ts` |
| 理解度 API | GET | `app/api/understanding-score/route.ts` |
| 定时调度 | Vercel Cron (9:00/20:00) | `app/api/cron/follow-up-scheduler/route.ts` |
| 问询弹窗 | Framer Motion + California Calm | `components/FollowUpSessionModal.tsx` |
| 通知横幅 | 贪睡选项 + 开始会话 | `components/FollowUpNotificationBanner.tsx` |
| 理解度展示 | 进度条 + 分解 + 深度理解徽章 | `components/UnderstandingScoreWidget.tsx` |
| 行动项详情 | 四维科学解释 + 执行历史 | `components/ActionItemDetail.tsx` |
| 平替选择 | 相似度评分 + 科学依据 | `components/AlternativeSelectionModal.tsx` |
| 聊天集成 | follow-up mode + 行动项追踪 | `components/AIAssistantChat.tsx` |

### 动态计划数据库表

```sql
-- 问询会话表
CREATE TABLE follow_up_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL,
  session_type text CHECK (session_type IN ('morning', 'evening')),
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  scheduled_at timestamptz NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  responses jsonb DEFAULT '[]',
  sentiment_score float,
  created_at timestamptz DEFAULT now()
);

-- 行动项表
CREATE TABLE plan_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  timing text,
  duration text,
  steps text[] DEFAULT '{}',
  expected_outcome text,
  scientific_rationale jsonb,
  item_order integer DEFAULT 0,
  is_established boolean DEFAULT false,
  replacement_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 执行追踪表
CREATE TABLE execution_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_item_id uuid REFERENCES plan_action_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text CHECK (status IN ('completed', 'partial', 'skipped', 'replaced')),
  needs_replacement boolean DEFAULT false,
  user_notes text,
  replacement_reason text,
  created_at timestamptz DEFAULT now()
);

-- 用户理解度评分表
CREATE TABLE user_understanding_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_score float DEFAULT 0,
  score_breakdown jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);
```

### 动态计划属性测试

| 属性 | 验证内容 | 测试文件 |
|------|----------|----------|
| Property 1 | 问询窗口检测正确性 | `adaptive-plan.property.test.ts` |
| Property 2 | 响应记录完整性 | `adaptive-plan.property.test.ts` |
| Property 3 | 错过会话影响调度 | `adaptive-plan.property.test.ts` |
| Property 4 | 24小时后激活执行追踪 | `adaptive-plan.property.test.ts` |
| Property 5 | 执行率计算公式 | `adaptive-plan.property.test.ts` |
| Property 6 | 连续3次失败标记 | `adaptive-plan.property.test.ts` |
| Property 7 | 平替生成完整性 | `adaptive-plan.property.test.ts` |
| Property 8 | 平替尊重用户偏好 | `adaptive-plan.property.test.ts` |
| Property 9 | 演化历史保留 | `adaptive-plan.property.test.ts` |
| Property 10 | 科学解释四维完整 | `adaptive-plan.property.test.ts` |
| Property 11 | 最少5个行动项 | `adaptive-plan.property.test.ts` |
| Property 12 | 行动项字段完整 | `adaptive-plan.property.test.ts` |
| Property 13 | 7天连续完成标记习惯 | `adaptive-plan.property.test.ts` |
| Property 14 | 3次演化后生成总结 | `adaptive-plan.property.test.ts` |
| Property 15 | 理解度加权计算 | `adaptive-plan.property.test.ts` |
| Property 16 | 95分深度理解阈值 | `adaptive-plan.property.test.ts` |
| Property 17 | 计划数据序列化往返 | `adaptive-plan.property.test.ts` |
