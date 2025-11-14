# 🔧 修复构建时环境变量问题

## 问题

构建日志显示：
```
Build environment variables: (none found)
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables...
```

**原因**：环境变量配置在了运行时变量位置，而不是构建时变量位置。

## ⚠️ 关键区别

在 Cloudflare Pages 中，有两个地方可以配置环境变量：

1. **Variables and Secrets**（运行时变量）：只在应用运行时可用
2. **Build & Deploy → Environment Variables**（构建时变量）：在构建过程中可用

**Next.js 构建时需要构建时变量！**

## 🔧 解决步骤

### 方法 1: 在 Build & Deploy 设置中配置（推荐）

1. **进入项目 Settings**
   - 在 Cloudflare Dashboard 中，进入你的 Pages 项目
   - 点击 **Settings** 标签

2. **找到 Build & Deploy 部分**
   - 向下滚动，找到 **Build & Deploy** 部分
   - 点击 **Configure build** 或 **Edit**

3. **配置构建时环境变量**
   - 在构建配置页面中，找到 **Environment Variables** 或 **Build Variables** 部分
   - 添加以下三个变量：

   **变量 1**:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://hxthvavzdtybkryojudt.supabase.co`
   - Environment: Production, Preview, Development（全选）

   **变量 2**:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - Environment: Production, Preview, Development（全选）

   **变量 3**:
   - Name: `DEEPSEEK_API_KEY`
   - Value: `sk-df1dcd335c3f43ef94621d654e645088`
   - Environment: Production, Preview, Development（全选）

4. **保存并重新部署**
   - 点击 **Save**
   - 在 Deployments 页面，点击 **Retry deployment**

### 方法 2: 检查变量配置位置

如果你已经在 "Variables and Secrets" 中配置了变量，需要：

1. **保留运行时变量**（在 Variables and Secrets 中）
2. **同时添加构建时变量**（在 Build & Deploy 中）

**两个都需要配置！**

## ✅ 验证配置

配置后，重新部署时，构建日志应该显示：
```
Build environment variables: (3 found)
```

而不是：
```
Build environment variables: (none found)
```

## 📍 如果找不到 Build Variables

1. 在 Settings 页面，查找 **Build & Deploy** 部分
2. 点击 **Configure build** 或 **Edit build configuration**
3. 在构建配置页面中查找 **Environment Variables** 或 **Build Variables**

## ⚠️ 重要提示

- **构建时变量**：在构建过程中可用，Next.js 需要这些来预渲染页面
- **运行时变量**：在应用运行时可用，API 路由需要这些

**两个都需要配置，但构建时变量更重要！**

