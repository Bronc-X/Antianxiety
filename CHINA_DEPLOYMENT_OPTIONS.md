# 中国大陆可访问的免费部署方案

## 🌟 推荐方案（按优先级）

### 1. Vercel（最推荐，需测试访问）

**访问地址**：https://vercel.com

**优点**：
- ✅ Next.js 官方推荐，完美支持
- ✅ 免费计划充足（100GB 带宽/月，无 Worker 大小限制）
- ✅ 自动部署，配置简单
- ✅ 全球 CDN，速度快
- ✅ 环境变量配置简单
- ✅ 无 Worker 大小限制（使用 Serverless Functions）

**缺点**：
- ⚠️ 在中国大陆访问可能不稳定（需要测试）
- ⚠️ 免费计划有使用限制（通常足够用）

**配置步骤**：
1. 访问 https://vercel.com，使用 GitHub 登录
2. 点击 "Add New Project"
3. 选择仓库：`Bronc-X/project-Nomoreanxious`
4. Framework 会自动检测为 Next.js
5. 在 Environment Variables 中添加三个环境变量
6. 点击 "Deploy"

**测试访问**：
部署后访问 `https://your-project.vercel.app`，测试在中国大陆的访问速度。

---

### 2. Railway（备选方案）

**访问地址**：https://railway.app

**优点**：
- ✅ 免费计划（$5 信用额度/月，通常足够用）
- ✅ 支持 Next.js
- ✅ 全球部署，访问速度可接受
- ✅ 环境变量配置简单
- ✅ 无 Worker 大小限制

**缺点**：
- ⚠️ 需要信用卡（但不会扣费，除非超出免费额度）
- ⚠️ 免费额度有限

**配置步骤**：
1. 访问 https://railway.app，使用 GitHub 登录
2. 创建新项目，选择 "Deploy from GitHub repo"
3. 选择仓库：`Bronc-X/project-Nomoreanxious`
4. 配置环境变量
5. 自动部署

---

### 3. Render（备选方案）

**访问地址**：https://render.com

**优点**：
- ✅ 免费计划
- ✅ 支持 Next.js
- ✅ 自动部署

**缺点**：
- ⚠️ 免费计划有休眠限制（15分钟无活动后休眠，首次访问需要唤醒）
- ⚠️ 在中国大陆访问可能不稳定

---

### 4. 国内云服务商（国内访问最快）

#### 4.1 阿里云 Serverless 应用引擎（SAE）

**访问地址**：https://www.aliyun.com/product/sae

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费试用额度
- ✅ 支持 Next.js

**缺点**：
- ⚠️ 需要实名认证
- ⚠️ 免费额度有限
- ⚠️ 配置相对复杂

**配置步骤**：
1. 注册阿里云账号并实名认证
2. 开通 Serverless 应用引擎（SAE）
3. 创建应用，选择 Node.js 运行时
4. 配置环境变量
5. 部署

#### 4.2 腾讯云 CloudBase（云开发）

**访问地址**：https://cloud.tencent.com/product/tcb

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费额度
- ✅ 支持 Next.js

**缺点**：
- ⚠️ 需要实名认证
- ⚠️ 配置相对复杂

#### 4.3 华为云 FunctionGraph

**访问地址**：https://www.huaweicloud.com/product/functiongraph.html

**优点**：
- ✅ 国内访问速度快
- ✅ 有免费额度

**缺点**：
- ⚠️ 需要实名认证
- ⚠️ 配置复杂

---

## 📊 方案对比表

| 方案 | 免费额度 | 国内访问 | 配置难度 | Next.js 支持 | Worker 限制 |
|------|---------|---------|---------|-------------|------------|
| **Vercel** | 充足 | ⚠️ 需测试 | ⭐ 简单 | ✅ 完美 | ❌ 无限制 |
| **Railway** | $5/月 | ✅ 可访问 | ⭐ 简单 | ✅ 支持 | ❌ 无限制 |
| **Render** | 有限 | ⚠️ 需测试 | ⭐⭐ 中等 | ✅ 支持 | ❌ 无限制 |
| **阿里云 SAE** | 试用额度 | ✅ 快速 | ⭐⭐⭐ 复杂 | ✅ 支持 | ❌ 无限制 |
| **腾讯云 CloudBase** | 免费额度 | ✅ 快速 | ⭐⭐⭐ 复杂 | ✅ 支持 | ❌ 无限制 |

---

## 🚀 快速迁移到 Vercel（推荐）

### 步骤 1: 访问 Vercel

1. 打开 https://vercel.com
2. 点击 "Sign Up"，使用 GitHub 登录

### 步骤 2: 导入项目

1. 点击 "Add New Project"
2. 选择仓库：`Bronc-X/project-Nomoreanxious`
3. Vercel 会自动检测为 Next.js 项目

### 步骤 3: 配置环境变量

在项目设置中，添加：
- `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`
- `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`

### 步骤 4: 部署

点击 "Deploy"，等待构建完成。

### 步骤 5: 测试访问

部署完成后，访问 `https://your-project.vercel.app`，测试在中国大陆的访问速度。

---

## ⚠️ 重要提示

1. **测试访问速度**：部署后，在中国大陆测试访问速度
2. **环境变量**：确保所有环境变量都已配置
3. **备份配置**：保留 Cloudflare 配置作为备份
4. **域名绑定**：如果需要，可以绑定自定义域名

---

## 🔍 如何选择

- **如果 Vercel 可访问**：首选 Vercel（最简单、最稳定）
- **如果 Vercel 不可访问**：选择 Railway 或 Render
- **如果需要国内最快访问**：选择阿里云或腾讯云（需要实名认证）

---

## 📝 下一步

1. 先测试 Vercel 的访问速度
2. 如果可以访问，立即迁移到 Vercel
3. 如果不能访问，考虑 Railway 或国内云服务商

