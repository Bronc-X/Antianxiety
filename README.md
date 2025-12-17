# Antianxiety

> A Next.js + Supabase app for evidence-based anxiety reduction and health behavior change.

## 功能概览

- **AI 助手（Max）**：基于用户画像/近期记录/问卷/对话记忆的 grounded 对话（避免“编造事实”）。
- **Bayesian Belief Loop**：贝叶斯信念更新（主动仪式 / 被动微调）+ 相关 API 与测试。
- **动态计划适应系统**：智能问询 + 执行追踪 + 平替推荐 + 理解度评分，让健康计划随用户节奏动态演化。
- **个性化内容流**：内容入库与向量检索，支持定时抓取与推送队列。
- **移动端壳（Capacitor）**：Android WebView 在线运行模式（加载远程 Web）。

## 技术栈

- Next.js 16（App Router）+ TypeScript
- Supabase（Auth + Postgres + RLS + pgvector）
- Vercel AI SDK（OpenAI-compatible Gateway）
- Vitest + fast-check（含属性测试）
- Capacitor（Android）

## 快速开始（本地开发）

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

复制示例文件并填入真实值：

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

### 3) 启动开发服务

```bash
npm run dev
```

访问 `http://localhost:3000`

## 环境变量（重点）

以 `.env.example` 为准，常用变量如下：

### 必需（本地/生产）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### AI（启用聊天/向量记忆/推荐时需要）

- `OPENAI_API_KEY`：OpenAI-compatible API Key（项目默认使用 `OPENAI_API_BASE` 指向的中转站）
- `OPENAI_API_BASE`：可选，默认 `https://aicanapi.com/v1`
- `OPENAI_EMBEDDING_MODEL` / `EMBEDDING_MODEL`：可选，默认 `text-embedding-3-small`

### 服务端/定时任务（仅部署时需要）

- `SUPABASE_SERVICE_ROLE_KEY`：仅服务端使用，切勿暴露到客户端
- `CRON_SECRET`：保护 `/api/cron/*` 手动触发
- `CONTENT_INGEST_API_KEY`：保护 `/api/ingest-content`
- `SEMANTIC_SCHOLAR_API_KEY`：可选，提高学术检索额度
- `RESEND_API_KEY`：可选，用于评估报告邮件发送

## 数据库（Supabase）

SQL 脚本在 `supabase/migrations/`。最省事的路径：

1. 创建 Supabase 项目
2. 在 Supabase Dashboard → SQL Editor 执行你需要的迁移（按功能选择）

参考：
- `docs/SUPABASE_MIGRATION_GUIDE.md`
- `docs/QUICK_START_DEPLOYMENT.md`

## 常用命令

```bash
npm run dev              # 启动开发服务器（强制使用 webpack）
npm run build            # 生产构建
npm run start            # 启动生产服务器
npm run lint             # ESLint
npm run test             # Vitest（一次性）
npm run test:watch       # Vitest（watch）
npm run test:coverage    # 覆盖率
npm run check-env        # 检查关键环境变量（读取 .env.local）
```

## 部署

### Vercel（推荐）

- `vercel.json` 配置了 Cron：
  - `/api/cron/curate-content`：每天 `03:00 UTC`
  - `/api/ingest-content`：每 `6` 小时（接口需要 `CONTENT_INGEST_API_KEY`）
- 生产环境建议配置：`SUPABASE_SERVICE_ROLE_KEY`、`CRON_SECRET`、`CONTENT_INGEST_API_KEY`

更多见：`DEPLOYMENT.md`

### Cloudflare Pages

```bash
npm run pages:build
```

相关配置：`wrangler.toml`

## 移动端（Capacitor）

在线运行模式配置在 `capacitor.config.ts`：

- 开发：`http://localhost:3000`（需要 `adb reverse`）
- 生产：`NEXT_PUBLIC_VERCEL_URL` 或默认域名

常用命令：

```bash
npm run build:cap
npm run android
```

## 故障排查（Windows 常见）

### 1) `npm`/`node` 不是内部或外部命令

- 重开终端/VS Code，让 PATH 生效
- 或在当前 PowerShell 临时刷新 PATH：

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

### 2) 提示 `npm.ps1` 被禁止运行（ExecutionPolicy）

- 直接用 `npm.cmd`：`npm.cmd run dev`
- 或仅对当前用户放开脚本策略：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 相关文档

- `PROJECT_CONSTITUTION.md`：产品与交互原则
- `TECH_STACK_AND_WORKFLOW.md`：技术栈与工作流
- `docs/LOGIC_CHAIN_AND_WORKFLOW.md`：数据闭环与“去幻觉”约束
- `DEPLOYMENT.md`：部署与环境变量

## License

MIT（见 `LICENSE`）
