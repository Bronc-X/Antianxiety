# 环境变量配置指南

项目环境变量以 `.env.example` 为准，本文件提供最常用配置说明。

## 必需的环境变量

### 1) Supabase（本地/生产都需要）

如何获取 Supabase URL 和 Anon Key：

1. 登录 Supabase Dashboard
2. 进入项目 → **Settings** → **API**
3. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## AI 相关环境变量（启用聊天/向量记忆/推荐时需要）

- `OPENAI_API_KEY`：OpenAI-compatible API Key（服务端使用）
- `OPENAI_API_BASE`：可选，OpenAI-compatible Base URL（例如 `https://aicanapi.com/v1`）
- `OPENAI_EMBEDDING_MODEL` / `EMBEDDING_MODEL`：可选，默认 `text-embedding-3-small`

## 部署相关（按需）

- `SUPABASE_SERVICE_ROLE_KEY`：仅服务端使用，用于 Cron/后台写入（不要暴露到客户端）
- `CRON_SECRET`：保护 `/api/cron/*` 手动触发
- `CONTENT_INGEST_API_KEY`：保护 `/api/ingest-content`
- `SEMANTIC_SCHOLAR_API_KEY`：可选，提高学术检索额度
- `RESEND_API_KEY`：可选，用于发送评估报告邮件

## 配置步骤

### 方法一：创建 `.env.local`

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

然后编辑 `.env.local`，填入真实值。

## 验证配置

```bash
npm run check-env
npm run dev
```

## 安全提示

- 不要把真实密钥写进仓库/文档
- `.env.local` 应保留在本地（已被 `.gitignore` 忽略）

