# 阿里云 ACR 创建镜像仓库详细步骤

## 📋 概述

本指南详细说明如何在阿里云个人容器镜像服务（ACR）中创建镜像仓库。

---

## 步骤 1: 登录阿里云控制台

1. 访问 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 使用你的阿里云账号登录

---

## 步骤 2: 开通容器镜像服务（ACR）

### 2.1 进入 ACR 控制台

1. 在控制台顶部搜索框输入：**容器镜像服务** 或 **ACR**
2. 点击搜索结果中的 **容器镜像服务**
3. 或直接访问：https://cr.console.aliyun.com/

### 2.2 开通服务

1. 如果首次使用，会看到开通页面
2. 选择 **个人版**（免费）
3. 阅读并同意服务协议
4. 点击 **立即开通**

**注意**：
- 个人版是免费的
- 需要完成实名认证（如果还没有）

---

## 步骤 3: 创建命名空间

### 3.1 进入命名空间管理

1. 在 ACR 控制台左侧菜单，点击 **命名空间**
2. 或直接访问：https://cr.console.aliyun.com/cn-guangzhou/namespaces

### 3.2 创建命名空间

1. 点击 **创建命名空间** 按钮（通常在右上角）
2. 填写命名空间信息：
   - **命名空间名称**：`nomoreanxious`
     - 只能包含小写字母、数字、连字符（-）
     - 长度 2-30 个字符
   - **类型**：选择 **私有**
     - 私有：只有你有权限访问
     - 公开：所有人都可以拉取镜像
3. 点击 **确定**

### 3.3 验证创建成功

创建成功后，在命名空间列表中应该能看到 `nomoreanxious`。

---

## 步骤 4: 创建镜像仓库

### 4.1 进入镜像仓库管理

1. 在 ACR 控制台左侧菜单，点击 **镜像仓库**
2. 或直接访问：https://cr.console.aliyun.com/cn-guangzhou/instances

### 4.2 创建镜像仓库

1. 点击 **创建镜像仓库** 按钮（通常在右上角）
2. 填写仓库信息：

   **基本信息**：
   - **命名空间**：选择刚才创建的 `nomoreanxious`
   - **仓库名称**：`nomoreanxious`
     - 只能包含小写字母、数字、连字符（-）、下划线（_）
     - 长度 2-64 个字符
   - **仓库类型**：选择 **私有**
   - **摘要**：`NoMoreAnxious 应用镜像`（可选，用于描述）

3. 点击 **下一步**

### 4.3 选择代码源

1. 在 **代码源** 页面，选择 **不绑定**
   - 因为我们使用本地构建，不需要绑定 Git 仓库
2. 点击 **创建镜像仓库**

### 4.4 验证创建成功

创建成功后，会显示仓库详情页面。记录以下信息：

- **Registry 地址**：类似 `crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`
- **命名空间**：`nomoreanxious`
- **仓库名称**：`nomoreanxious`
- **完整镜像地址**：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious`

---

## 步骤 5: 设置访问凭证

### 5.1 进入访问凭证设置

1. 在镜像仓库详情页面，点击 **访问凭证** 标签
2. 或直接访问：https://cr.console.aliyun.com/cn-guangzhou/instances/[你的实例ID]/repositories/[命名空间]/[仓库名]/settings

### 5.2 设置固定密码

1. 在 **访问凭证** 页面，找到 **设置固定密码** 选项
2. 点击 **设置固定密码**
3. 输入密码：
   - 密码长度：8-30 个字符
   - 必须包含大小写字母、数字
   - 建议使用强密码
4. 确认密码
5. 点击 **确定**

**重要**：
- 请记住这个密码，后续 Docker 登录需要使用
- 如果忘记密码，可以重新设置

### 5.3 获取登录信息

记录以下登录信息：

- **登录地址**：你的 Registry 地址（例如：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`）
- **用户名**：你的阿里云账号（例如：`a15181013617`）
- **密码**：刚才设置的固定密码

---

## 步骤 6: 验证配置

### 6.1 检查仓库信息

在镜像仓库详情页面，确认以下信息：

- ✅ 命名空间：`nomoreanxious`
- ✅ 仓库名称：`nomoreanxious`
- ✅ 仓库类型：私有
- ✅ 访问凭证：已设置固定密码

### 6.2 记录完整镜像地址

完整的镜像地址格式：
```
crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

**说明**：
- `crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com` - Registry 地址
- `nomoreanxious` - 命名空间
- `nomoreanxious` - 仓库名称
- `latest` - 标签（版本）

---

## 📝 下一步

完成以上步骤后，你已经成功创建了镜像仓库。接下来：

1. **更新 docker-build.ps1 脚本**（如果需要）：
   - 如果 Registry 地址与脚本中的不同，需要更新 `$REGISTRY` 变量

2. **本地构建镜像**：
   ```powershell
   .\docker-build.ps1
   ```

3. **登录并推送镜像**：
   ```powershell
   docker login --username=你的账号 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
   # 输入固定密码
   ```

4. **在 SAE 中部署**：
   - 使用完整的镜像地址创建应用

详细步骤请参考：`LOCAL_ALIYUN_DEPLOYMENT.md`

---

## 🐛 常见问题

### Q1: 找不到"创建命名空间"按钮

**解决方法**：
- 确保已开通 ACR 服务
- 检查是否在正确的区域（例如：华南1-广州）
- 刷新页面重试

### Q2: 命名空间名称已存在

**解决方法**：
- 使用其他名称（例如：`nomoreanxious-app`）
- 或使用已有的命名空间

### Q3: 无法设置固定密码

**解决方法**：
- 确保已完成实名认证
- 检查账号权限
- 尝试刷新页面重试

### Q4: 忘记固定密码

**解决方法**：
- 在访问凭证页面，点击 **重置固定密码**
- 设置新密码

---

## ✅ 检查清单

完成以下检查项：

- [ ] ACR 服务已开通（个人版）
- [ ] 命名空间 `nomoreanxious` 已创建
- [ ] 镜像仓库 `nomoreanxious` 已创建
- [ ] 固定密码已设置
- [ ] 已记录 Registry 地址
- [ ] 已记录完整镜像地址
- [ ] 已记录登录用户名和密码

---

**现在可以开始本地构建和推送镜像了！**

