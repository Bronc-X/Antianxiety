# ⚠️ 关键：配置构建时环境变量

## 构建失败原因

构建日志显示：
```
Build environment variables: (none found)
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

**问题**：构建时环境变量没有配置！

## 🔧 立即解决步骤

### 在 Cloudflare Pages 项目中配置 Build variables

1. **进入项目设置**：
   - 在 Cloudflare Dashboard 中，进入你的 Pages 项目
   - 点击 **Settings** 标签

2. **找到 Build variables**：
   - 在 Settings 页面，找到 **Builds & deployments** 部分
   - 点击 **Configure build** 或 **Edit**
   - 找到 **Build variables** 或 **Build environment variables** 部分

3. **添加三个环境变量**：

   **变量 1**:
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://hxthvavzdtybkryojudt.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **变量 2**:
   - Variable name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **变量 3**:
   - Variable name: `DEEPSEEK_API_KEY`
   - Value: `sk-df1dcd335c3f43ef94621d654e645088`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

4. **保存并重新部署**：
   - 点击 **Save**
   - 在 Deployments 页面，点击 **Retry deployment**

## ⚠️ 重要区别

- **Build variables**（构建时变量）：在构建过程中可用，Next.js 需要这些来预渲染页面
- **Runtime variables**（运行时变量）：在应用运行时可用

**两个都需要配置！**

## 验证配置

配置后，重新部署时，构建日志应该显示：
```
Build environment variables: (3 found)
```

而不是：
```
Build environment variables: (none found)
```

## 如果仍然找不到 Build variables

1. 检查是否在正确的项目（Pages 项目，不是 Workers）
2. 在 Settings → Builds & deployments 中查找
3. 或者在项目创建时的配置页面中查找

