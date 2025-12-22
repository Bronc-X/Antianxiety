# Cloudflare 构建时环境变量配置（模板）

⚠️ 本文件不应包含任何真实密钥/项目专属信息。请在 Cloudflare 后台填写你自己的值。

## 构建失败的常见原因

构建失败可能是因为在构建时缺少 Supabase 环境变量。典型错误信息：

```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

## 在 Cloudflare 中配置环境变量

### 步骤 1: 进入项目设置

1. 登录 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Settings**

### 步骤 2: 找到 "Variables and Secrets"

在 Settings 页面中，找到 **Variables and Secrets** 部分。

### 步骤 3: 添加环境变量

#### 变量 1: NEXT_PUBLIC_SUPABASE_URL

- **类型**: `txt` (text)
- **变量名**: `NEXT_PUBLIC_SUPABASE_URL`
- **值**: `https://<YOUR_PROJECT_REF>.supabase.co`
- **环境**: Production / Preview / Development（按需选择）

#### 变量 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

- **类型**: `secret`
- **变量名**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **值**: `<YOUR_SUPABASE_ANON_KEY>`
- **环境**: Production / Preview / Development（按需选择）

#### 变量 3: OPENAI_API_KEY（用于 AI 功能）

- **类型**: `secret`
- **变量名**: `OPENAI_API_KEY`
- **值**: `<YOUR_OPENAI_COMPATIBLE_API_KEY>`
- **环境**: Production / Preview / Development（按需选择）

#### 变量 4: OPENAI_API_BASE（可选）

- **类型**: `txt` (text)
- **变量名**: `OPENAI_API_BASE`
- **值**: `https://aicanapi.com/v1`
- **环境**: Production / Preview / Development（按需选择）

### 步骤 4: 重新部署

配置环境变量后：

1. 在 **Deployments** 页面
2. 点击最新的部署
3. 点击 **Retry deployment** 或 **Redeploy**

