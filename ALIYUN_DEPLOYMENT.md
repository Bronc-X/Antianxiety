# 阿里云部署指南

## 为什么选择阿里云

- ✅ 国内访问速度快
- ✅ 有免费试用额度
- ✅ 支持 Next.js
- ✅ 无 Worker 大小限制
- ✅ 稳定可靠

## 部署方案选择

### 方案 1: 阿里云 Serverless 应用引擎（SAE）- 推荐

**适合**：Next.js 应用，需要动态功能

**优点**：
- 支持 Node.js 运行时
- 自动扩缩容
- 按量付费，有免费额度
- 配置相对简单

### 方案 2: 阿里云函数计算（FC）

**适合**：API 路由和 Serverless Functions

**优点**：
- 完全按量付费
- 有免费额度
- 配置简单

### 方案 3: 阿里云容器服务（ACK）

**适合**：需要更多控制权的场景

**优点**：
- 完全控制
- 支持 Docker

**缺点**：
- 配置复杂
- 成本较高

## 推荐：使用 SAE（Serverless 应用引擎）

### 前置准备

1. **注册阿里云账号**
   - 访问 https://www.aliyun.com
   - 注册并完成实名认证

2. **开通 SAE 服务**
   - 登录阿里云控制台
   - 搜索 "Serverless 应用引擎" 或 "SAE"
   - 开通服务

### 部署步骤

#### 步骤 1: 准备部署包

由于 SAE 需要 Docker 镜像或 JAR 包，我们需要将 Next.js 应用打包。

**选项 A: 使用 Docker（推荐）**

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**选项 B: 使用 Next.js standalone 输出**

修改 `next.config.ts` 添加 `output: 'standalone'`（但注意 Cloudflare Pages 不支持）

#### 步骤 2: 构建 Docker 镜像

```bash
# 构建镜像
docker build -t your-app-name .

# 推送到阿里云容器镜像服务（ACR）
# 需要先在阿里云开通容器镜像服务
```

#### 步骤 3: 在 SAE 中创建应用

1. 登录阿里云控制台
2. 进入 **Serverless 应用引擎（SAE）**
3. 点击 **创建应用**
4. 选择 **镜像部署**
5. 配置：
   - **应用名称**: `anxious` 或 `nomoreanxious`
   - **镜像地址**: 选择你推送的镜像
   - **实例规格**: 选择最小规格（节省成本）
   - **实例数量**: 1（免费试用）
   - **端口**: 3000
   - **环境变量**: 添加三个环境变量

#### 步骤 4: 配置环境变量

在 SAE 应用配置中，添加：

- `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`
- `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`

#### 步骤 5: 部署

1. 点击 **创建** 或 **部署**
2. 等待部署完成
3. 获取访问地址

---

## 更简单的方案：使用阿里云函数计算（FC）

### 步骤 1: 开通函数计算

1. 登录阿里云控制台
2. 搜索 "函数计算" 或 "Function Compute"
3. 开通服务

### 步骤 2: 创建函数

1. 进入函数计算控制台
2. 创建函数
3. 选择 **Web 函数**（支持 HTTP 触发器）
4. 运行时选择 **Node.js 20**
5. 上传代码包或连接 Git

### 步骤 3: 配置环境变量

在函数配置中，添加三个环境变量。

### 步骤 4: 配置 HTTP 触发器

1. 创建 HTTP 触发器
2. 获取访问地址

---

## 成本估算

### SAE 免费额度

- 新用户通常有免费试用额度
- 按量付费，用量少时成本很低
- 具体额度请查看阿里云官网

### 函数计算免费额度

- 每月 100 万次函数调用免费
- 每月 400,000 GB-秒计算资源免费
- 通常足够小型应用使用

---

## 注意事项

1. **实名认证**：必须完成实名认证才能使用
2. **免费额度**：注意免费额度的使用限制
3. **访问速度**：国内访问速度会很快
4. **配置复杂度**：比 Vercel 复杂，但更灵活

---

## 推荐流程

1. **先测试 Vercel**：如果可访问，优先使用 Vercel（最简单）
2. **如果 Vercel 不可访问**：使用阿里云 SAE 或函数计算
3. **需要国内最快访问**：直接使用阿里云

---

## 需要帮助

如果你选择阿里云，我可以帮你：
1. 创建 Dockerfile
2. 配置部署脚本
3. 优化 Next.js 配置以适配阿里云

告诉我你想使用哪个方案（SAE 还是函数计算），我可以提供更详细的配置步骤。

