# Cloudflare Pages 环境变量配置指南

## 📍 详细步骤：找到环境变量配置位置

### 步骤 1: 登录并进入项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账户
3. 在左侧边栏，找到并点击 **Workers & Pages**（或 **Pages**）
4. 在项目列表中，找到你的项目（例如：`project-metabasis` 或 `project-Nomoreanxious`）
5. **点击项目名称**进入项目详情页

### 步骤 2: 进入设置页面

在项目详情页中，你会看到顶部有几个标签页，例如：
- **Overview**（概览）
- **Deployments**（部署）
- **Settings**（设置）← **点击这个！**
- **Functions**（函数）
- **Analytics**（分析）

**点击 "Settings" 标签页**

### 步骤 3: 找到环境变量部分

在 Settings 页面中，向下滚动，你会看到多个部分：

- **Builds & deployments**（构建和部署）
- **Environment variables** ← **在这里！**
- **Custom domains**（自定义域名）
- **Functions**（函数）
- 等等...

**找到 "Environment variables" 部分**

### 步骤 4: 添加环境变量

在 "Environment variables" 部分：

1. 点击 **Add variable** 或 **Add environment variable** 按钮
2. 会弹出一个表单或对话框
3. 为每个环境变量填写：
   - **Variable name**（变量名）
   - **Value**（值）
   - **Environment**（环境）：选择 Production、Preview、Development（建议全选）

4. 添加以下三个环境变量：

   **变量 1**：
   - Variable name: `DEEPSEEK_API_KEY`
   - Value: `sk-df1dcd335c3f43ef94621d654e645088`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **变量 2**：
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://hxthvavzdtybkryojudt.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **变量 3**：
   - Variable name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

4. 点击 **Save** 保存每个变量

## 方法二：在部署配置中设置

### 步骤 1: 进入部署设置

1. 在项目详情页，点击 **Settings**
2. 找到 **Builds & deployments** 部分
3. 点击 **Configure build**

### 步骤 2: 在构建配置中添加

在构建配置页面中，找到 **Environment variables** 部分，添加变量。

## 方法三：通过 Wrangler CLI（高级）

如果你使用 Wrangler CLI，可以在 `wrangler.toml` 中配置，但 Cloudflare Pages 通常使用 Dashboard 配置更简单。

## 找不到环境变量选项？

### 可能的原因：

1. **项目还未创建**：
   - 确保项目已经创建并完成首次部署尝试

2. **权限问题**：
   - 确保你有项目的管理员权限

3. **界面位置不同**：
   - Cloudflare 界面可能因账户类型而略有不同
   - 尝试在项目详情页的各个标签页中查找

### 替代查找方法：

1. **使用搜索功能**：
   - 在 Cloudflare Dashboard 顶部搜索栏搜索 "Environment variables"

2. **查看项目设置菜单**：
   - 在项目详情页，查看所有可用的设置选项
   - 环境变量通常在以下位置之一：
     - Settings → Environment variables
     - Settings → Variables
     - Builds & deployments → Environment variables
     - Functions → Environment variables

## 验证环境变量是否配置成功

### 方法 1: 查看部署日志

1. 进入项目的 **Deployments**（部署）页面
2. 查看最新的部署日志
3. 如果环境变量配置正确，构建应该能够访问这些变量

### 方法 2: 在代码中验证

可以在构建日志或运行时日志中检查环境变量是否被正确加载。

## 重要提示

- ⚠️ 环境变量配置后，需要重新部署才能生效
- ⚠️ 确保为 Production、Preview 和 Development 环境都配置了变量
- ⚠️ 环境变量值不会在界面上显示完整内容（出于安全考虑），只会显示部分字符

## 如果仍然找不到

请提供以下信息，我可以帮你进一步定位：

1. 你在 Cloudflare Dashboard 的哪个页面？
2. 项目详情页显示了哪些标签/菜单项？
3. 是否能看到 "Settings" 选项？

或者，你可以：
- 截图当前界面
- 描述你看到的菜单选项
- 告诉我你在哪个步骤卡住了

