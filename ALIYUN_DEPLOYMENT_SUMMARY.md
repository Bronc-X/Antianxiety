# 阿里云部署总结

## ✅ 已完成的准备工作

### 1. 创建的文件

- ✅ `Dockerfile` - Docker 镜像构建文件
- ✅ `.dockerignore` - Docker 构建忽略文件
- ✅ `ALIYUN_DEPLOYMENT.md` - 详细部署指南
- ✅ `ALIYUN_QUICK_START.md` - 快速开始指南
- ✅ `ALIYUN_SAE_DETAILED_GUIDE.md` - SAE 详细部署指南
- ✅ `SAE_STEP_BY_STEP.md` - 分步操作指南
- ✅ `docker-build.sh` - Linux/Mac 构建脚本
- ✅ `docker-build.ps1` - Windows PowerShell 构建脚本（已配置个人版 ACR）

### 2. 修改的配置

- ✅ `next.config.ts` - 添加了 `output: 'standalone'` 以支持 Docker 部署
- ✅ `docker-build.ps1` - 已配置为个人版 ACR 地址

### 3. 已完成的步骤

- ✅ ACR 服务已开通（个人版）
- ✅ 镜像仓库已创建（命名空间：`nomoreanxious`，仓库名：`nomoreanxious`）
- ✅ ACR 固定密码已设置
- ⏳ Docker 登录（需要执行）
- ⏳ 镜像构建和推送（需要执行）

## 🚀 下一步操作

### 步骤 1: 准备阿里云环境

1. **注册并实名认证**
   - 访问 https://www.aliyun.com
   - 完成实名认证

2. **开通服务**
   - Serverless 应用引擎（SAE）
   - 容器镜像服务（ACR）

### 步骤 2: 构建和推送 Docker 镜像

#### Windows (PowerShell):

```powershell
# 1. 确保 Docker Desktop 正在运行
# 2. 登录 ACR（个人版地址）
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
# 输入：你在 ACR 控制台设置的固定密码

# 3. 运行构建脚本
.\docker-build.ps1
```

**注意**：
- 使用的是 **个人版 ACR**，地址格式：`crpi-xxx.cn-guangzhou.personal.cr.aliyuncs.com`
- 脚本已配置为个人版地址
- 确保 Docker Desktop 已启动并完全运行

#### Linux/Mac:

```bash
# 1. 确保 Docker 正在运行
# 2. 登录 ACR（个人版地址）
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
# 输入：你在 ACR 控制台设置的固定密码

# 3. 运行构建脚本
chmod +x docker-build.sh
./docker-build.sh
```

### 步骤 3: 在 SAE 中部署

1. **开通 SAE 服务**（如果还没有）
   - 登录阿里云控制台
   - 搜索 **Serverless 应用引擎** 或 **SAE**
   - 开通服务

2. **创建应用**
   - 进入 SAE 控制台
   - 点击 **创建应用**
   - 选择 **镜像部署**
   - 使用镜像地址：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest`

3. **配置应用**
   - 应用名称：`nomoreanxious`
   - 实例规格：0.5 核 + 1GB 内存
   - 实例数量：1
   - 端口：3000
   - 协议：HTTP
   - 开启公网访问

4. **配置环境变量**（重要！）
   - `DEEPSEEK_API_KEY` = `sk-df1dcd335c3f43ef94621d654e645088`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hxthvavzdtybkryojudt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c`
   - `NODE_ENV` = `production`

5. **部署并获取访问地址**
   - 点击 **创建** 或 **部署**
   - 等待部署完成（1-3 分钟）
   - 获取访问地址并测试

## 📋 环境变量清单

部署时需要配置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DEEPSEEK_API_KEY` | `sk-df1dcd335c3f43ef94621d654e645088` | DeepSeek API 密钥 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` | Supabase 匿名密钥 |
| `NODE_ENV` | `production` | 生产环境 |

## ⚠️ 重要提示

### 关于 Cloudflare Pages

由于添加了 `output: 'standalone'`，**当前配置与 Cloudflare Pages 不兼容**。

如果需要同时支持两个平台：

1. **方案 A**: 使用两个分支
   - `main` - 用于阿里云（有 standalone）
   - `cloudflare` - 用于 Cloudflare（无 standalone）

2. **方案 B**: 条件配置
   - 根据环境变量决定是否启用 standalone

3. **方案 C**: 只使用阿里云
   - 删除 Cloudflare 相关配置

### 成本控制

- 使用最小规格（0.5 核 + 1GB 内存）
- 设置实例数量为 1
- 注意免费额度的使用限制
- 设置预算告警

## 📚 参考文档

- `SAE_STEP_BY_STEP.md` - **推荐**：分步操作指南（最详细）
- `ALIYUN_SAE_DETAILED_GUIDE.md` - SAE 详细部署指南
- `ALIYUN_QUICK_START.md` - 快速开始指南
- `ALIYUN_DEPLOYMENT.md` - 完整的部署指南
- `ACR_PERSONAL_EDITION_GUIDE.md` - 个人版 ACR 使用指南
- `DOCKER_BUILD_GUIDE.md` - Docker 构建详细指南
- `CHINA_DEPLOYMENT_OPTIONS.md` - 其他部署方案对比

## 🆘 需要帮助？

### 当前可能遇到的问题

1. **Docker Desktop 未运行**
   - 错误：`The system cannot find the file specified`
   - 解决：启动 Docker Desktop，等待完全启动

2. **ACR 登录失败（403 Forbidden）**
   - 解决：使用个人版地址和固定密码登录
   - 地址：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`

3. **构建脚本编码错误**
   - 已修复：脚本已更新为纯英文，避免编码问题

### 获取帮助

如果遇到问题：

1. 查看 `SAE_STEP_BY_STEP.md` 中的常见问题部分
2. 查看 `DOCKER_BUILD_GUIDE.md` 中的故障排查
3. 检查 SAE 应用日志
4. 确认环境变量是否正确配置
5. 验证 Docker 镜像是否正常构建

### 下一步操作

1. ✅ 确保 Docker Desktop 正在运行
2. ✅ 登录 ACR（使用个人版地址和固定密码）
3. ⏳ 运行 `.\docker-build.ps1` 构建和推送镜像
4. ⏳ 在 SAE 中创建应用并部署

