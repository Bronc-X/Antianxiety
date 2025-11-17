# Docker 镜像构建和推送详细指南

## 📋 前置条件

- ✅ 已安装 Docker Desktop（Windows）
- ✅ Docker 正在运行
- ✅ 已创建 ACR 镜像仓库
- ✅ 已获取 ACR 登录信息

## 🚀 操作步骤

### 步骤 1: 修改构建脚本配置

#### 1.1 打开 `docker-build.ps1` 文件

在项目根目录找到 `docker-build.ps1`，用文本编辑器打开。

#### 1.2 确认配置（已自动更新）

脚本中的配置应该如下：

```powershell
$REGISTRY = "registry.cn-guangzhou.aliyuncs.com"  # 华南3（广州）
$NAMESPACE = "nomoreanxious"  # 你的命名空间
$IMAGE_NAME = "nomoreanxious"  # 你的仓库名称
$VERSION = "latest"
```

**如果你的配置不同，请修改为你的实际值：**
- `$REGISTRY`: 你的 ACR 登录地址（华南3广州是 `registry.cn-guangzhou.aliyuncs.com`）
- `$NAMESPACE`: 你的命名空间（应该是 `nomoreanxious`）
- `$IMAGE_NAME`: 你的仓库名称（应该是 `nomoreanxious`）

### 步骤 2: 登录阿里云 ACR

#### 2.1 打开 PowerShell

- 按 `Win + X`，选择 **Windows PowerShell** 或 **终端**
- 或者按 `Win + R`，输入 `powershell`，回车

#### 2.2 进入项目目录

```powershell
cd C:\Users\38939\Desktop\project-metabasis
```

**注意**：替换为你的实际项目路径。

#### 2.3 登录 ACR

```powershell
docker login registry.cn-guangzhou.aliyuncs.com
```

**执行后会提示输入：**
- **Username**: 你的阿里云账号（通常是邮箱或手机号）
- **Password**: 你在 ACR 控制台设置的登录密码

**成功提示**：
```
Login Succeeded
```

**如果失败**：
- 检查用户名和密码是否正确
- 确认 ACR 访问凭证已设置
- 检查网络连接

### 步骤 3: 运行构建脚本

#### 3.1 确保在项目根目录

```powershell
# 确认当前目录（应该看到 package.json、Dockerfile 等文件）
ls
```

#### 3.2 运行脚本

```powershell
.\docker-build.ps1
```

**如果提示权限错误**，执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后再运行：
```powershell
.\docker-build.ps1
```

### 步骤 4: 等待构建完成

#### 4.1 构建过程

脚本会执行以下步骤：

1. **构建 Docker 镜像**（最耗时，可能需要 5-10 分钟）
   - 下载 Node.js 基础镜像
   - 安装依赖（npm ci）
   - 构建 Next.js 应用（npm run build）
   - 打包最终镜像

2. **标记镜像**
   - 为镜像打标签

3. **推送镜像到 ACR**
   - 上传镜像到阿里云

#### 4.2 成功标志

看到以下输出表示成功：

```
🚀 开始构建 Docker 镜像...
[构建过程输出...]
✅ 构建成功！
🏷️  标记镜像...
📤 推送镜像到阿里云 ACR...
[推送过程输出...]
✅ 推送成功！
📦 镜像地址: registry.cn-guangzhou.aliyuncs.com/nomoreanxious/nomoreanxious:latest

下一步：
1. 在 SAE 控制台创建应用
2. 使用镜像地址: registry.cn-guangzhou.aliyuncs.com/nomoreanxious/nomoreanxious:latest
3. 配置环境变量
4. 部署应用
```

### 步骤 5: 验证镜像

#### 5.1 在 ACR 控制台验证

1. 登录阿里云控制台
2. 进入 **容器镜像服务（ACR）**
3. 点击 **镜像仓库**
4. 找到你的仓库 `nomoreanxious/nomoreanxious`
5. 点击进入，应该能看到 `latest` 标签的镜像
6. 查看镜像大小、创建时间等信息

#### 5.2 使用命令行验证（可选）

```powershell
# 查看本地镜像
docker images | findstr nomoreanxious

# 查看镜像详情
docker inspect registry.cn-guangzhou.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

## 🐛 常见问题

### Q1: 构建失败 - "npm ci" 错误

**可能原因**：
- 网络问题，无法下载依赖
- `package-lock.json` 文件损坏

**解决方法**：
```powershell
# 删除 node_modules 和 package-lock.json，重新生成
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Q2: 构建失败 - "npm run build" 错误

**可能原因**：
- 环境变量未设置（NEXT_PUBLIC_* 变量）
- 代码错误

**解决方法**：
- 检查代码是否有错误
- 确认 `next.config.ts` 配置正确
- 查看构建日志中的具体错误信息

### Q3: 推送失败 - "unauthorized" 或 "authentication required"

**可能原因**：
- 未登录 ACR
- 登录已过期
- 用户名或密码错误

**解决方法**：
```powershell
# 重新登录
docker login registry.cn-guangzhou.aliyuncs.com
```

### Q4: 推送失败 - "repository does not exist"

**可能原因**：
- 镜像仓库未创建
- 命名空间或仓库名称错误

**解决方法**：
- 确认 ACR 中已创建镜像仓库
- 检查 `docker-build.ps1` 中的 `$NAMESPACE` 和 `$IMAGE_NAME` 是否正确

### Q5: 构建很慢

**正常情况**：
- 首次构建需要下载基础镜像和依赖，可能需要 10-15 分钟
- 后续构建会使用缓存，会快很多

**优化方法**：
- 确保网络连接稳定
- 使用国内镜像源（如果可能）

### Q6: PowerShell 执行策略错误

**错误信息**：
```
无法加载文件，因为在此系统上禁止运行脚本
```

**解决方法**：
```powershell
# 临时允许执行脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 或者永久允许（当前用户）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 完整操作示例

```powershell
# 1. 进入项目目录
cd C:\Users\38939\Desktop\project-metabasis

# 2. 登录 ACR
docker login registry.cn-guangzhou.aliyuncs.com
# 输入用户名和密码

# 3. 运行构建脚本
.\docker-build.ps1

# 4. 等待完成，看到 "✅ 推送成功！"
```

## ✅ 成功后的下一步

镜像推送成功后：

1. **记录镜像地址**：
   ```
   registry.cn-guangzhou.aliyuncs.com/nomoreanxious/nomoreanxious:latest
   ```

2. **在 SAE 中创建应用**：
   - 使用上面的镜像地址
   - 配置环境变量
   - 部署应用

3. **测试应用**：
   - 访问应用地址
   - 验证功能是否正常

## 🎯 快速参考

| 操作 | 命令 |
|------|------|
| 登录 ACR | `docker login registry.cn-guangzhou.aliyuncs.com` |
| 运行构建脚本 | `.\docker-build.ps1` |
| 查看本地镜像 | `docker images` |
| 查看 ACR 镜像 | 在 ACR 控制台查看 |

---

如果遇到问题，请告诉我具体的错误信息！

