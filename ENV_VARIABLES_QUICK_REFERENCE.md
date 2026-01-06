# 环境变量快速参考（模板）

⚠️ 本文件不应包含任何真实密钥/项目专属信息。请在部署平台后台填写你自己的值。

## Cloudflare Pages 需要配置的变量

复制以下模板到 Cloudflare Pages 的环境变量配置中：

### 变量 1: OpenAI-compatible API Key（用于 AI 功能）

```
变量名: OPENAI_API_KEY
值: <YOUR_OPENAI_COMPATIBLE_API_KEY>
环境: Production, Preview, Development (全选)
```

### 变量 2: OpenAI-compatible API Base（可选）

```
变量名: OPENAI_API_BASE
值: https://aicanapi.com/v1
环境: Production, Preview, Development (全选)
```

### 变量 2.1: OpenAlex 扩源开关（可选）

```
变量名: OPENALEX_ENABLED
值: true
环境: Production, Preview, Development (全选)
```

### 变量 2.2: OpenAlex 礼貌池邮箱（可选）

```
变量名: OPENALEX_MAILTO
值: <YOUR_EMAIL>
环境: Production, Preview, Development (全选)
```

### 变量 2.3: OpenAlex 排序降权（可选）

```
变量名: OPENALEX_SCORE_MULTIPLIER
值: 0.9
环境: Production, Preview, Development (全选)
```

### 变量 3: Supabase URL

```
变量名: NEXT_PUBLIC_SUPABASE_URL
值: https://<YOUR_PROJECT_REF>.supabase.co
环境: Production, Preview, Development (全选)
```

### 变量 4: Supabase Anon Key

```
变量名: NEXT_PUBLIC_SUPABASE_ANON_KEY
值: <YOUR_SUPABASE_ANON_KEY>
环境: Production, Preview, Development (全选)
```

### 变量 5: Admin API Key（管理员代查接口）

```
变量名: ADMIN_API_KEY
值: <YOUR_ADMIN_API_KEY>
环境: Production, Preview, Development (全选)
```

## 配置后的验证

1. 重新部署一次
2. 检查构建日志是否仍有环境变量缺失
3. 访问站点并测试 AI 功能（例如 `/assistant`）
