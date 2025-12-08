# Cloudflare 构建时环境变量配置

## ⚠️ 重要：构建失败的原因

构建失败是因为在构建时缺少 Supabase 环境变量。错误信息：
```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

## 🔧 解决方案：在 Cloudflare 中配置环境变量

### 步骤 1: 进入项目设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入你的项目（`anxious`）
3. 点击 **Settings** 标签

### 步骤 2: 找到 "Variables and Secrets"

在 Settings 页面中，找到 **Variables and Secrets** 部分。

### 步骤 3: 添加环境变量

添加以下三个环境变量：

#### 变量 1: NEXT_PUBLIC_SUPABASE_URL

- **类型**: `txt` (text)
- **变量名**: `NEXT_PUBLIC_SUPABASE_URL`
- **值**: `https://hxthvavzdtybkryojudt.supabase.co`
- **环境**: ✅ Production, ✅ Preview, ✅ Development

#### 变量 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

- **类型**: `secret`
- **变量名**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **值**: `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
- **环境**: ✅ Production, ✅ Preview, ✅ Development

#### 变量 3: DEEPSEEK_API_KEY

- **类型**: `secret`
- **变量名**: `DEEPSEEK_API_KEY`
- **值**: `sk-df1dcd335c3f43ef94621d654e645088`
- **环境**: ✅ Production, ✅ Preview, ✅ Development

### 步骤 4: 重新部署

配置环境变量后：

1. 在 **Deployments** 页面
2. 点击最新的部署
3. 点击 **Retry deployment** 或 **Redeploy**

## 📝 为什么需要这些变量？

- **NEXT_PUBLIC_SUPABASE_URL** 和 **NEXT_PUBLIC_SUPABASE_ANON_KEY**：
  - 用于连接 Supabase 数据库和认证服务
  - 在构建时就需要，因为 Next.js 会预渲染页面

- **DEEPSEEK_API_KEY**：
  - 用于 AI 聊天功能
  - 在运行时需要（API 路由中）

## ✅ 验证配置

配置环境变量后，重新部署应该能够成功。如果仍然失败：

1. 检查环境变量是否正确配置
2. 确认所有三个环境（Production、Preview、Development）都已配置
3. 查看构建日志，确认环境变量是否被正确加载

## 🔍 检查环境变量是否生效

在构建日志中，你应该能看到：
- 构建成功完成
- 没有 "missing environment variables" 错误
- 页面能够正常生成

如果看到环境变量相关的错误，说明配置有问题，需要重新检查。

