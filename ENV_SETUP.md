# 环境变量配置指南

## 必需的环境变量

项目需要以下环境变量才能正常运行：

### 1. Supabase 配置

**如何获取 Supabase URL 和 Anon Key：**

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目（或创建新项目）
3. 进入 **Settings** → **API**
4. 找到以下信息：
   - **Project URL** → 这就是 `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → 这就是 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. DeepSeek API Key

使用环境变量 `DEEPSEEK_API_KEY` 配置（请勿将真实 Key 写入仓库或文档）。

## 配置步骤

### 方法一：手动编辑 `.env.local` 文件

1. 打开项目根目录的 `.env.local` 文件
2. 替换以下占位符：

```env
DEEPSEEK_API_KEY=你的_DEEPSEEK_API_KEY

NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key_在这里
```

### 方法二：使用命令行（PowerShell）

```powershell
# 编辑 .env.local 文件，替换占位符值
notepad .env.local
```

## 验证配置

配置完成后，重启开发服务器：

```bash
npm run dev
```

如果配置正确，应该不会再有环境变量错误。

## 常见问题

### 问题：找不到 Supabase 项目

**解决**：
1. 如果没有 Supabase 账号，先注册：https://app.supabase.com/
2. 创建新项目
3. 等待项目初始化完成（约 2 分钟）
4. 在 Settings → API 中获取 URL 和 Key

### 问题：仍然显示环境变量错误

**解决**：
1. 确认 `.env.local` 文件在项目根目录
2. 确认没有多余的空格或引号
3. 重启开发服务器（环境变量只在启动时加载）

## 安全提示

- ⚠️ `.env.local` 文件已被 `.gitignore` 忽略，不会被提交到 Git
- ⚠️ 不要将 API Key 分享给他人
- ⚠️ 部署到 Vercel 时，需要在 Vercel Dashboard 中设置环境变量

