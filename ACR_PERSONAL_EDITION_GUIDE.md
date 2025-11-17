# 阿里云 ACR 个人版登录指南

## 🔍 发现的问题

你使用的是 **ACR 个人版**，不是企业版。个人版的登录地址格式不同：

- **企业版**：`registry.cn-guangzhou.aliyuncs.com`
- **个人版**：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`

## ✅ 解决步骤

### 步骤 1: 设置固定密码

1. 在 ACR 控制台 → **访问凭证**
2. 找到 **固定密码** 部分
3. 点击 **设置密码** 或 **重置密码**
4. 设置一个密码（记住这个密码）
5. 保存

### 步骤 2: 获取访问域名

在 ACR 控制台的 **访问凭证** 页面，找到：

**访问域名**：
- 基于当前网络环境，选择对应的域名
- 通常是：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`

**记录这个完整地址**，这就是你的登录地址。

### 步骤 3: 使用个人版地址登录

在 Cursor 终端中执行：

```powershell
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
```

**输入：**
- Password: 你刚才设置的固定密码

**或者交互式登录：**
```powershell
docker login crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
# Username: a15181013617
# Password: 你设置的固定密码
```

### 步骤 4: 更新构建脚本

我已经更新了 `docker-build.ps1`，但请确认你的实际登录地址。

**检查你的访问凭证页面显示的完整登录地址**，然后：

1. 打开 `docker-build.ps1`
2. 确认 `$REGISTRY` 的值是你的个人版地址：
   ```powershell
   $REGISTRY = "crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com"
   ```
3. 如果地址不同，请修改为你的实际地址

### 步骤 5: 验证镜像地址格式

个人版的镜像地址格式：
```
crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest
```

**注意**：个人版和企业版的地址格式不同，但功能相同。

## 📝 完整操作流程

### 1. 设置固定密码
- ACR 控制台 → **访问凭证** → **固定密码** → **设置密码**

### 2. 获取登录地址
- 在 **访问凭证** 页面找到 **访问域名**
- 记录完整地址（如：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com`）

### 3. 登录 Docker
```powershell
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
# 输入固定密码
```

### 4. 确认构建脚本配置
- 检查 `docker-build.ps1` 中的 `$REGISTRY` 是否正确

### 5. 运行构建脚本
```powershell
.\docker-build.ps1
```

## ⚠️ 重要提示

1. **个人版 vs 企业版**
   - 个人版登录地址包含 `personal.cr.aliyuncs.com`
   - 企业版登录地址是 `registry.cn-xxx.aliyuncs.com`
   - 功能相同，只是地址格式不同

2. **镜像地址格式**
   - 个人版：`crpi-xxx.cn-guangzhou.personal.cr.aliyuncs.com/命名空间/仓库名:标签`
   - 企业版：`registry.cn-guangzhou.aliyuncs.com/命名空间/仓库名:标签`

3. **在 SAE 中使用**
   - 创建 SAE 应用时，使用个人版的完整镜像地址
   - 格式：`crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/nomoreanxious/nomoreanxious:latest`

## 🎯 快速检查清单

- [ ] 已设置固定密码
- [ ] 已获取个人版登录地址
- [ ] 已使用个人版地址登录成功
- [ ] 已更新 `docker-build.ps1` 中的 `$REGISTRY`
- [ ] 已运行构建脚本

## 🆘 如果登录还是失败

1. **确认密码正确**
   - 使用的是固定密码，不是阿里云登录密码
   - 密码是刚才在 ACR 控制台设置的

2. **确认地址正确**
   - 使用访问凭证页面显示的完整地址
   - 不要使用企业版地址格式

3. **检查账号权限**
   - 确认账号已完成实名认证
   - 确认有 ACR 访问权限

---

**现在请按照步骤操作：**
1. 设置固定密码
2. 使用个人版地址登录
3. 告诉我登录结果

