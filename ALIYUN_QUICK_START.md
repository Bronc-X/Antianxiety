# 阿里云快速部署指南

## 🚀 快速开始

### 前置条件

1. ✅ 已注册阿里云账号并完成实名认证
2. ✅ 已开通 Serverless 应用引擎（SAE）服务
3. ✅ 已安装 Docker（用于构建镜像）

### 方案选择

#### 方案 A: SAE + Docker（推荐）

适合：需要完整 Next.js 功能，包括 API 路由和服务器组件

#### 方案 B: 函数计算（FC）

适合：主要是 API 路由，或想按调用量付费

---

## 📦 方案 A: 使用 SAE 部署

### 步骤 1: 构建 Docker 镜像

```bash
# 在项目根目录执行
docker build -t nomoreanxious:latest .
```

### 步骤 2: 推送到阿里云容器镜像服务（ACR）

#### 2.1 开通容器镜像服务

1. 登录阿里云控制台
2. 搜索 "容器镜像服务" 或 "ACR"
3. 开通服务并创建命名空间（如：`nomoreanxious`）

#### 2.2 登录 ACR

```bash
# 获取登录命令（在 ACR 控制台 -> 访问凭证）
docker login --username=your-username registry.cn-hangzhou.aliyuncs.com
```

#### 2.3 标记并推送镜像

```bash
# 标记镜像（替换为你的 ACR 地址）
docker tag nomoreanxious:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/nomoreanxious:latest

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/nomoreanxious:latest
```

### 步骤 3: 在 SAE 中创建应用

1. 登录阿里云控制台
2. 进入 **Serverless 应用引擎（SAE）**
3. 点击 **创建应用**
4. 选择 **镜像部署**

#### 配置信息：

- **应用名称**: `nomoreanxious`
- **命名空间**: 选择或创建命名空间
- **应用类型**: Web 应用
- **镜像地址**: `registry.cn-hangzhou.aliyuncs.com/your-namespace/nomoreanxious:latest`
- **镜像拉取策略**: 总是拉取最新镜像
- **实例规格**: 
  - CPU: 0.5 核（最小规格）
  - 内存: 1 GB（最小规格）
- **实例数量**: 1
- **端口**: 3000
- **协议**: HTTP

### 步骤 4: 配置环境变量

在应用配置的 **环境变量** 部分，添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEEPSEEK_API_KEY` | `sk-df1dcd335c3f43ef94621d654e645088` | DeepSeek API 密钥 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | Supabase 匿名密钥 |
| `NODE_ENV` | `production` | 生产环境 |

### 步骤 5: 配置访问

1. 在 **访问设置** 中，选择 **公网访问**
2. 配置 **SLB 实例**（如果还没有，SAE 会自动创建）
3. 获取访问地址

### 步骤 6: 部署

1. 点击 **创建** 或 **部署**
2. 等待部署完成（通常需要 2-5 分钟）
3. 访问应用地址测试

---

## ⚡ 方案 B: 使用函数计算（FC）

### 步骤 1: 开通函数计算

1. 登录阿里云控制台
2. 搜索 "函数计算" 或 "Function Compute"
3. 开通服务

### 步骤 2: 创建函数

1. 进入函数计算控制台
2. 创建服务（如：`nomoreanxious`）
3. 在服务中创建函数

#### 配置信息：

- **函数名称**: `web`
- **运行环境**: Node.js 20
- **函数类型**: Web 函数
- **请求处理程序**: `index.handler`
- **代码上传方式**: 选择 **通过 ZIP 包上传** 或 **通过文件夹上传**

### 步骤 3: 准备部署包

由于函数计算需要特定的入口文件，我们需要创建一个适配器：

创建 `index.js`（函数计算入口文件）：

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let server;

async function init() {
  await app.prepare();
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });
}

exports.handler = async (event, context) => {
  if (!server) {
    await init();
  }
  
  return new Promise((resolve) => {
    const { httpMethod, path, headers, body, queryString } = event;
    
    const req = {
      method: httpMethod,
      url: path + (queryString ? '?' + queryString : ''),
      headers: headers || {},
      body: body,
    };
    
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      writeHead: function(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = { ...this.headers, ...headers };
      },
      write: function(chunk) {
        this.body += chunk;
      },
      end: function(chunk) {
        if (chunk) this.body += chunk;
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
    };
    
    server.emit('request', req, res);
  });
};
```

**注意**：函数计算对 Next.js 的支持有限，建议使用 SAE 方案。

---

## 💰 成本估算

### SAE 成本

- **免费额度**：新用户通常有免费试用额度
- **按量付费**：
  - CPU: 约 ¥0.00011111/核/秒
  - 内存: 约 ¥0.00001111/GB/秒
  - 0.5 核 + 1GB 内存 ≈ ¥0.00005556/秒 ≈ ¥4.8/天（24小时运行）

### 函数计算成本

- **免费额度**：
  - 每月 100 万次函数调用
  - 每月 400,000 GB-秒计算资源
- **超出后**：按调用次数和计算资源计费

---

## 🔧 本地测试 Docker 镜像

在推送到阿里云之前，可以先在本地测试：

```bash
# 构建镜像
docker build -t nomoreanxious:latest .

# 运行容器（设置环境变量）
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-df1dcd335c3f43ef94621d654e645088 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://hxthvavzdtybkryojudt.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c \
  -e NODE_ENV=production \
  nomoreanxious:latest

# 访问 http://localhost:3000 测试
```

---

## ⚠️ 注意事项

1. **实名认证**：必须完成实名认证才能使用阿里云服务
2. **免费额度**：注意免费额度的使用限制，避免产生意外费用
3. **镜像大小**：Docker 镜像应该尽量小，使用多阶段构建
4. **环境变量**：确保所有环境变量都已正确配置
5. **端口配置**：确保应用监听 `0.0.0.0:3000`（已在 Dockerfile 中配置）

---

## 🐛 常见问题

### Q: 构建镜像时出错？

A: 检查：
- Node.js 版本是否匹配（需要 Node.js 20）
- 网络连接是否正常（npm install 需要下载依赖）
- Docker 是否有足够空间

### Q: 部署后无法访问？

A: 检查：
- 环境变量是否正确配置
- 端口是否正确（应该是 3000）
- 应用是否正常启动（查看日志）

### Q: 如何查看应用日志？

A: 在 SAE 控制台 -> 应用 -> 日志，可以查看实时日志

---

## 📝 下一步

1. 按照步骤部署到 SAE
2. 测试应用功能
3. 配置自定义域名（可选）
4. 设置监控和告警（可选）

如果遇到问题，请查看日志或联系我。

