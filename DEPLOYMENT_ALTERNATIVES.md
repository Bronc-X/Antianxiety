# 免费部署方案对比（中国大陆可访问）

## 方案对比

### 1. Vercel（推荐，但需验证访问）

**优点**：
- ✅ Next.js 官方推荐，完美支持
- ✅ 免费计划充足（100GB 带宽/月）
- ✅ 自动部署，环境变量配置简单
- ✅ 全球 CDN，速度快
- ✅ 无 Worker 大小限制（使用 Serverless Functions）

**缺点**：
- ⚠️ 在中国大陆访问可能不稳定（需要测试）
- ⚠️ 免费计划有使用限制

**配置步骤**：
1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 登录
3. 导入项目：`Bronc-X/project-Nomoreanxious`
4. 配置环境变量
5. 自动部署

**环境变量配置**：
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### 2. Netlify

**优点**：
- ✅ 免费计划充足
- ✅ 支持 Next.js
- ✅ 自动部署
- ✅ 环境变量配置简单

**缺点**：
- ⚠️ 在中国大陆访问可能不稳定
- ⚠️ 免费计划有构建时间限制

**配置步骤**：
1. 访问 [Netlify](https://www.netlify.com/)
2. 使用 GitHub 登录
3. 导入项目
4. 构建命令：`npm run build`
5. 发布目录：`.next`

---

### 3. Railway

**优点**：
- ✅ 免费计划（$5 信用额度/月）
- ✅ 支持 Next.js
- ✅ 全球部署
- ✅ 环境变量配置简单

**缺点**：
- ⚠️ 免费额度有限
- ⚠️ 需要信用卡（但不会扣费，除非超出免费额度）

**配置步骤**：
1. 访问 [Railway](https://railway.app/)
2. 使用 GitHub 登录
3. 创建新项目，连接 GitHub 仓库
4. 配置环境变量
5. 自动部署

---

### 4. Render

**优点**：
- ✅ 免费计划
- ✅ 支持 Next.js
- ✅ 自动部署

**缺点**：
- ⚠️ 免费计划有休眠限制（15分钟无活动后休眠）
- ⚠️ 在中国大陆访问可能不稳定

---

### 5. 国内云服务商

#### 5.1 阿里云（推荐国内用户）

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费试用额度
- ✅ 支持 Next.js

**缺点**：
- ⚠️ 需要实名认证
- ⚠️ 免费额度有限

**服务**：
- 阿里云函数计算 FC
- 阿里云容器服务
- 阿里云 Serverless 应用引擎

#### 5.2 腾讯云

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费试用额度

**缺点**：
- ⚠️ 需要实名认证
- ⚠️ 配置相对复杂

**服务**：
- 腾讯云 Serverless Framework
- 腾讯云 CloudBase

#### 5.3 华为云

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费试用额度

**缺点**：
- ⚠️ 需要实名认证

---

### 6. GitHub Pages（仅静态）

**优点**：
- ✅ 完全免费
- ✅ 无限制
- ✅ 国内可访问（速度可能较慢）

**缺点**：
- ❌ 只支持静态网站
- ❌ 不支持 Next.js 动态功能（API 路由、服务器组件）

**不适用**：你的项目需要 API 路由和服务器端功能

---

## 推荐方案

### 对于中国大陆用户：

1. **首选：Vercel**（如果可访问）
   - Next.js 官方推荐
   - 配置最简单
   - 无大小限制

2. **备选：Railway**
   - 免费额度充足
   - 全球部署
   - 配置简单

3. **国内：阿里云 Serverless**
   - 国内访问最快
   - 需要实名认证
   - 有免费额度

### 快速测试 Vercel 访问：

访问 https://vercel.com 和 https://*.vercel.app，测试是否能正常访问。

---

## 迁移步骤（以 Vercel 为例）

### 1. 创建 Vercel 项目

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 登录
3. 点击 "Add New Project"
4. 选择仓库：`Bronc-X/project-Nomoreanxious`

### 2. 配置构建设置

- **Framework Preset**: Next.js（自动检测）
- **Build Command**: `npm run build`（自动）
- **Output Directory**: `.next`（自动）
- **Install Command**: `npm install`（自动）

### 3. 配置环境变量

在项目 Settings → Environment Variables 中添加：
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. 部署

点击 "Deploy"，等待构建完成。

---

## 注意事项

1. **测试访问**：部署后，在中国大陆测试访问速度
2. **环境变量**：确保所有环境变量都已配置
3. **域名**：可以考虑绑定自定义域名（如果需要）
4. **备份**：保留 Cloudflare 配置作为备份

