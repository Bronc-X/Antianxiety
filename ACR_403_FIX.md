# ACR 403 Forbidden 错误解决

## ❌ 错误信息
```
login attempt to https://registry.cn-guangzhou.aliyuncs.com/v2/ failed with status: 403 Forbidden
```

## 🔍 可能的原因

1. **ACR 服务未完全开通**：虽然创建了仓库，但服务可能未完全激活
2. **账号权限不足**：账号没有 ACR 的访问权限
3. **地域问题**：可能需要确认地域是否正确
4. **访问凭证问题**：密码或令牌配置不正确

## ✅ 解决步骤

### 步骤 1: 确认 ACR 服务已开通

1. 登录阿里云控制台
2. 搜索 **容器镜像服务** 或 **ACR**
3. 进入控制台
4. 检查是否能看到：
   - 镜像仓库列表
   - 访问凭证页面
   - 如果没有，可能需要先开通服务

### 步骤 2: 检查访问凭证设置

1. 在 ACR 控制台，点击 **访问凭证**
2. 确认 **Registry 登录密码** 已设置
3. 如果未设置，点击 **设置密码** 并设置

### 步骤 3: 尝试使用临时登录令牌

#### 3.1 生成临时令牌
1. 在 ACR 控制台 → **访问凭证**
2. 找到 **临时登录令牌**
3. 点击 **生成临时登录令牌**
4. 复制生成的令牌（类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

#### 3.2 使用令牌登录
```powershell
# 方法 1: 直接使用令牌
docker login registry.cn-guangzhou.aliyuncs.com -u a15181013617 -p <临时令牌>

# 方法 2: 交互式输入
docker login registry.cn-guangzhou.aliyuncs.com
# Username: a15181013617
# Password: <粘贴临时令牌>
```

### 步骤 4: 检查账号权限

1. 确认账号已完成实名认证
2. 确认账号有 ACR 服务的访问权限
3. 如果是子账号，需要主账号授权

### 步骤 5: 尝试使用阿里云 CLI（如果其他方法不行）

如果 Docker 登录一直失败，可以尝试使用阿里云 CLI：

```powershell
# 安装阿里云 CLI（如果还没有）
# 下载地址：https://help.aliyun.com/document_detail/110341.html

# 配置 CLI
aliyun configure

# 使用 CLI 登录 ACR
aliyun cr GetAuthorizationToken --region cn-guangzhou
```

## 🔑 推荐操作流程

### 方案 A: 使用临时登录令牌（最简单）

1. **生成临时令牌**：
   - ACR 控制台 → **访问凭证** → **临时登录令牌** → **生成**

2. **使用令牌登录**：
   ```powershell
   docker login registry.cn-guangzhou.aliyuncs.com
   # Username: a15181013617
   # Password: <粘贴临时令牌>
   ```

### 方案 B: 检查并重新设置密码

1. **检查密码设置**：
   - ACR 控制台 → **访问凭证**
   - 确认密码已设置

2. **如果未设置，设置密码**：
   - 点击 **设置 Registry 登录密码**
   - 设置新密码
   - 保存

3. **重新登录**：
   ```powershell
   docker login registry.cn-guangzhou.aliyuncs.com
   # Username: a15181013617
   # Password: 刚才设置的密码
   ```

## ⚠️ 常见问题

### Q1: 为什么会出现 403？

**可能原因**：
- ACR 服务未完全激活
- 账号权限不足
- 密码或令牌错误
- 地域配置错误

### Q2: 临时令牌在哪里？

**位置**：
- ACR 控制台 → **访问凭证** → **临时登录令牌**
- 点击 **生成临时登录令牌**
- 复制生成的令牌

### Q3: 临时令牌有效期多久？

**通常**：1 小时

**建议**：如果经常使用，设置永久密码更方便

## 🎯 快速解决步骤

1. **进入 ACR 控制台**
2. **访问凭证** → **临时登录令牌** → **生成**
3. **复制令牌**
4. **在终端执行**：
   ```powershell
   docker login registry.cn-guangzhou.aliyuncs.com
   # Username: a15181013617
   # Password: <粘贴临时令牌>
   ```

## 📝 验证登录成功

登录成功后，你会看到：
```
Login Succeeded
```

然后就可以继续运行构建脚本了：
```powershell
.\docker-build.ps1
```

## 🆘 如果还是不行

请检查：
1. ACR 服务是否已完全开通？
2. 账号是否已完成实名认证？
3. 在 ACR 控制台能否看到镜像仓库？
4. 能否生成临时登录令牌？

如果以上都正常但还是 403，可能需要联系阿里云客服检查账号权限。

