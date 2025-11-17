# 阿里云本地部署指南

## 📋 概述

本指南将帮助你在阿里云个人容器镜像服务（ACR）中创建镜像仓库，并使用本地 Docker 构建和推送镜像。

## 🎯 步骤概览

1. 在阿里云 ACR 中创建镜像仓库
2. 本地构建 Docker 镜像
3. 登录 ACR 并推送镜像
4. 在 SAE 中部署应用

---

## 步骤 1: 在阿里云 ACR 中创建镜像仓库

### 1.1 登录阿里云控制台

1. 访问 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 使用你的账号登录

### 1.2 开通容器镜像服务（ACR）

1. 在控制台搜索 **容器镜像服务** 或 **ACR**
2. 点击进入 **容器镜像服务** 控制台
3. 如果未开通，点击 **开通服务**
4. 选择 **个人版**（免费）

### 1.3 创建命名空间

1. 在 ACR 控制台，点击左侧菜单 **命名空间**
2. 点击 **创建命名空间**
3. 填写信息：
   - **命名空间名称**：`nomoreanxious`（或你喜欢的名称）
   - **类型**：选择 **私有**
4. 点击 **确定**

### 1.4 创建镜像仓库

1. 在 ACR 控制台，点击左侧菜单 **镜像仓库**
2. 点击 **创建镜像仓库**
3. 填写信息：
   - **命名空间**：选择刚才创建的 `nomoreanxious`
   - **仓库名称**：`nomoreanxious`（或你喜欢的名称）
   - **仓库类型**：选择 **私有**
   - **摘要**：`NoMoreAnxious 应用镜像`（可选）
   - **仓库类型**：选择 **标准版**
4. 点击 **下一步**
5. 选择代码源：**不绑定**（因为我们使用本地构建）
6. 点击 **创建镜像仓库**

### 1.5 获取镜像仓库地址

创建完成后，你会看到镜像仓库的完整地址，格式如下：

```
crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious
```

**重要**：请记录以下信息：
- **Registry 地址**：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`（你的个人版地址）
- **命名空间**：`nomoreanxious`
- **仓库名称**：`nomoreanxious`

### 1.6 设置登录密码

1. 在镜像仓库页面，点击 **访问凭证**
2. 点击 **设置固定密码**
3. 设置一个密码（请记住这个密码，后续登录需要）
4. 点击 **确定**

---

## 步骤 2: 本地构建 Docker 镜像

### 2.1 确保 Docker 已安装并运行

1. **检查 Docker 是否安装**：
   ```powershell
   docker --version
   ```

2. **启动 Docker Desktop**（如果未运行）：
   - 打开 Docker Desktop 应用
   - 等待 Docker 完全启动（状态栏显示 "Docker Desktop is running"）

3. **验证 Docker 运行正常**：
   ```powershell
   docker ps
   ```

### 2.2 准备环境变量

在项目根目录创建或检查 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://hxthvavzdtybkryojudt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c
DEEPSEEK_API_KEY=sk-df1dcd335c3f43ef94621d654e645088
```

### 2.3 构建 Docker 镜像

在项目根目录打开 PowerShell，运行：

```powershell
# 方式 1: 使用构建脚本（推荐）
.\docker-build.ps1

# 方式 2: 手动构建
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://hxthvavzdtybkryojudt.supabase.co" `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c" `
  -t nomoreanxious:latest .
```

**注意**：
- 构建过程可能需要 5-10 分钟
- 确保网络连接正常（需要下载依赖）
- 如果构建失败，查看错误信息并修复

### 2.4 验证镜像构建成功

```powershell
docker images | findstr nomoreanxious
```

应该能看到类似输出：
```
nomoreanxious   latest   abc123def456   2 minutes ago   250MB
```

---

## 步骤 3: 登录 ACR 并推送镜像

### 3.1 更新 docker-build.ps1 脚本（如果需要）

如果你的 ACR 地址与脚本中的不同，需要更新 `docker-build.ps1`：

```powershell
# 打开 docker-build.ps1，修改以下变量：
$REGISTRY = "你的个人版ACR地址"  # 例如：crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
$NAMESPACE = "nomoreanxious"  # 你的命名空间
$IMAGE_NAME = "nomoreanxious"  # 你的仓库名称
```

### 3.2 登录 ACR

```powershell
# 使用你的阿里云账号和设置的固定密码登录
docker login --username=你的阿里云账号 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
```

**示例**：
```powershell
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
# 输入：你在 ACR 中设置的固定密码
```

### 3.3 标记镜像

```powershell
# 标记镜像为 ACR 地址格式
docker tag nomoreanxious:latest crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

**注意**：请将地址替换为你的实际 ACR 地址。

### 3.4 推送镜像

```powershell
# 推送镜像到 ACR
docker push crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

**注意**：
- 推送过程可能需要几分钟
- 确保网络连接稳定
- 如果推送失败，检查登录状态和权限

### 3.5 验证推送成功

1. 在阿里云 ACR 控制台，进入你的镜像仓库
2. 点击 **镜像版本** 标签
3. 应该能看到 `latest` 标签的镜像
4. 记录完整的镜像地址，格式：
   ```
   crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
   ```

---

## 步骤 4: 在 SAE 中部署应用

### 4.1 开通 SAE 服务

1. 在阿里云控制台搜索 **Serverless 应用引擎** 或 **SAE**
2. 点击进入 SAE 控制台
3. 如果未开通，点击 **开通服务**

### 4.2 创建应用

1. 在 SAE 控制台，点击 **应用管理** → **创建应用**
2. 选择 **镜像部署**
3. 填写应用信息：
   - **应用名称**：`nomoreanxious`
   - **命名空间**：选择或创建命名空间
   - **镜像地址**：粘贴你的完整镜像地址
     ```
     crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
     ```
   - **镜像拉取凭证**：选择 **自动创建**（SAE 会自动使用 ACR 凭证）

### 4.3 配置应用规格

- **实例规格**：0.5 核 + 1GB 内存（免费额度内）
- **实例数量**：1
- **VPC**：选择默认 VPC
- **应用实例规格**：选择最小规格

### 4.4 配置网络

- **端口**：`3000`
- **协议**：`HTTP`
- **公网访问**：✅ 开启（如果需要外网访问）

### 4.5 配置环境变量

在 **环境变量** 部分，添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DEEPSEEK_API_KEY` | `sk-df1dcd335c3f43ef94621d654e645088` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hxthvavzdtybkryojudt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c` |
| `NODE_ENV` | `production` |

### 4.6 部署应用

1. 检查所有配置
2. 点击 **创建** 或 **确认创建**
3. 等待部署完成（通常 1-3 分钟）

### 4.7 获取访问地址

1. 部署完成后，在应用列表中找到你的应用
2. 点击应用名称进入详情页
3. 在 **访问设置** 中，找到 **公网访问地址**
4. 复制访问地址，格式类似：
   ```
   https://nomoreanxious-xxx.cn-guangzhou.sae.aliyuncs.com
   ```

### 4.8 测试应用

1. 在浏览器中打开访问地址
2. 测试应用功能：
   - 首页加载正常
   - 登录功能正常
   - AI 聊天功能正常

---

## 🔄 更新应用

当你修改代码后，需要重新构建和部署：

### 1. 重新构建镜像

```powershell
# 使用构建脚本
.\docker-build.ps1

# 或手动构建
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://hxthvavzdtybkryojudt.supabase.co" `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_ZKHE_7pEfxhwDS1UEMAD2g_hYeWrR1c" `
  -t nomoreanxious:latest .
```

### 2. 重新推送镜像

```powershell
# 标记镜像
docker tag nomoreanxious:latest crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest

# 推送镜像
docker push crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

### 3. 在 SAE 中重新部署

1. 进入 SAE 控制台
2. 找到你的应用
3. 点击 **部署新版本**
4. 选择最新的镜像版本
5. 点击 **确认部署**

---

## 🐛 常见问题

### Q1: Docker 构建失败，提示环境变量未设置

**解决方法**：
- 确保在构建时使用 `--build-arg` 传递环境变量
- 检查环境变量值是否正确

### Q2: 登录 ACR 失败，提示 403 Forbidden

**解决方法**：
- 确保在 ACR 控制台设置了固定密码
- 使用固定密码登录，不是阿里云账号密码
- 检查账号是否有 ACR 权限

### Q3: 推送镜像失败，提示网络错误

**解决方法**：
- 检查网络连接
- 尝试使用阿里云镜像加速器
- 检查 Docker Desktop 是否正常运行

### Q4: SAE 部署失败，提示镜像拉取失败

**解决方法**：
- 确保镜像已成功推送到 ACR
- 检查 SAE 的镜像拉取凭证配置
- 确保镜像地址正确

### Q5: 应用无法访问

**解决方法**：
- 检查 SAE 应用是否正常运行（查看日志）
- 检查公网访问是否开启
- 检查端口配置是否正确（应该是 3000）

---

## 📝 快速参考

### 常用命令

```powershell
# 构建镜像
docker build --build-arg NEXT_PUBLIC_SUPABASE_URL="..." --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="..." -t nomoreanxious:latest .

# 登录 ACR
docker login --username=你的账号 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com

# 标记镜像
docker tag nomoreanxious:latest crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest

# 推送镜像
docker push crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest

# 查看本地镜像
docker images | findstr nomoreanxious

# 查看容器
docker ps -a
```

### 重要地址

- **ACR 控制台**：https://cr.console.aliyun.com/
- **SAE 控制台**：https://sae.console.aliyun.com/
- **阿里云控制台**：https://ecs.console.aliyun.com/

---

## ✅ 检查清单

- [ ] ACR 服务已开通
- [ ] 命名空间已创建
- [ ] 镜像仓库已创建
- [ ] ACR 固定密码已设置
- [ ] Docker Desktop 已安装并运行
- [ ] 本地镜像构建成功
- [ ] ACR 登录成功
- [ ] 镜像推送成功
- [ ] SAE 服务已开通
- [ ] SAE 应用已创建
- [ ] 环境变量已配置
- [ ] 应用部署成功
- [ ] 应用访问正常

---

**现在开始按照步骤操作吧！如果遇到问题，请查看常见问题部分或告诉我具体的错误信息。**

