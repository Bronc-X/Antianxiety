# Cloudflare Workers 环境变量配置步骤

## 当前状态

你在 Settings 页面，看到了 "Variables and Secrets" 部分，显示 "None"。

## 添加环境变量的步骤

### 步骤 1: 点击 "Variables and Secrets" 部分

在 Settings 页面中，找到 **Variables and Secrets** 部分（显示 "None"），点击它或点击旁边的 **Configure** 按钮。

### 步骤 2: 添加环境变量

点击后，你会看到添加变量的界面。点击 **Add variable** 或 **Add secret** 按钮。

**注意**：
- **Variable**：用于非敏感信息（会显示在界面上）
- **Secret**：用于敏感信息（如 API Key，不会显示完整值）

### 步骤 3: 添加三个环境变量

#### 变量 1: DeepSeek API Key（建议使用 Secret）

1. 点击 **Add secret**（因为是敏感信息）
2. 填写：
   - **Variable name**: `DEEPSEEK_API_KEY`
   - **Value**: `sk-df1dcd335c3f43ef94621d654e645088`
   - **Environment**: 选择 Production、Preview、Development（全选）
3. 点击 **Save**

#### 变量 2: Supabase URL

1. 点击 **Add variable**
2. 填写：
   - **Variable name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://hxthvavzdtybkryojudt.supabase.co`
   - **Environment**: 选择 Production、Preview、Development（全选）
3. 点击 **Save**

#### 变量 3: Supabase Anon Key（建议使用 Secret）

1. 点击 **Add secret**（因为是敏感信息）
2. 填写：
   - **Variable name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - **Environment**: 选择 Production、Preview、Development（全选）
3. 点击 **Save**

## 重要提示

### Workers vs Pages

我注意到你创建的是 **Workers** 项目，而不是 **Pages** 项目。

- **Workers**：用于运行服务器端代码和 API
- **Pages**：用于部署完整的 Next.js 应用

如果你的目标是部署 Next.js 应用，应该使用 **Cloudflare Pages** 而不是 Workers。

### 如果应该使用 Pages

1. 在 Cloudflare Dashboard 中，进入 **Workers & Pages**
2. 点击 **Create** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建设置（使用 `npm run pages:build`）

### 如果继续使用 Workers

Workers 也可以运行 Next.js，但配置更复杂。你需要确保：
- 构建命令正确：`npm run pages:build`
- 环境变量已配置
- 输出目录正确：`.vercel/output/static`

## 验证配置

配置环境变量后：

1. **重新部署**：
   - 在 Deployments 页面，点击 "Retry deployment" 或触发新的部署

2. **检查构建日志**：
   - 查看构建日志，确认环境变量被正确加载
   - 如果看到 "DEEPSEEK_API_KEY 未设置" 错误，说明配置有问题

3. **测试功能**：
   - 部署成功后，访问网站
   - 测试 AI 聊天功能

## 快速参考

需要配置的变量：

```
DEEPSEEK_API_KEY = sk-df1dcd335c3f43ef94621d654e645088
NEXT_PUBLIC_SUPABASE_URL = https://hxthvavzdtybkryojudt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c
```

