# ACR 登录问题排查

## ❌ 错误信息
```
Get "https://registry.cn-guangzhou.aliyuncs.com/v2/": unauthorized: authentication required
```

## 🔍 可能的原因

1. **密码错误**：ACR 登录密码不正确
2. **访问凭证未设置**：ACR 中未设置登录密码
3. **用户名格式错误**：需要使用正确的用户名格式

## ✅ 解决方法

### 方法 1: 检查并设置 ACR 访问凭证

#### 步骤 1: 进入 ACR 控制台
1. 登录阿里云控制台
2. 搜索 **容器镜像服务** 或 **ACR**
3. 进入控制台

#### 步骤 2: 设置访问凭证
1. 点击左侧菜单 **访问凭证**
2. 找到 **设置 Registry 登录密码**
3. 点击 **设置密码**
4. 输入新密码（记住这个密码）
5. 点击 **确定**

#### 步骤 3: 重新登录
```powershell
docker login registry.cn-guangzhou.aliyuncs.com
```

**输入：**
- Username: `a15181013617`（你的阿里云账号）
- Password: 刚才设置的密码

### 方法 2: 使用临时登录令牌（推荐）

#### 步骤 1: 获取临时登录令牌
1. 在 ACR 控制台，点击 **访问凭证**
2. 找到 **临时登录令牌**
3. 点击 **生成临时登录令牌**
4. 复制生成的令牌（类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

#### 步骤 2: 使用令牌登录
```powershell
# 使用令牌作为密码登录
docker login registry.cn-guangzhou.aliyuncs.com -u a15181013617 -p <临时令牌>
```

**或者交互式输入：**
```powershell
docker login registry.cn-guangzhou.aliyuncs.com
# Username: a15181013617
# Password: <粘贴临时令牌>
```

### 方法 3: 检查用户名格式

有时候需要使用完整的账号格式：

```powershell
# 尝试使用邮箱格式（如果是邮箱注册）
docker login registry.cn-guangzhou.aliyuncs.com
# Username: 你的完整邮箱
# Password: ACR 密码

# 或者使用手机号格式
docker login registry.cn-guangzhou.aliyuncs.com
# Username: 你的手机号
# Password: ACR 密码
```

## 🔑 推荐操作流程

### 1. 设置 ACR 登录密码（如果还没有）

1. 进入 ACR 控制台 → **访问凭证**
2. 点击 **设置 Registry 登录密码**
3. 设置一个密码（记住它）
4. 保存

### 2. 使用密码登录

```powershell
docker login registry.cn-guangzhou.aliyuncs.com
```

**输入：**
- Username: `a15181013617`
- Password: 你刚才设置的 ACR 密码（不是阿里云登录密码）

## ⚠️ 重要提示

1. **ACR 登录密码 ≠ 阿里云登录密码**
   - ACR 需要单独设置登录密码
   - 在 ACR 控制台的 **访问凭证** 中设置

2. **密码不会显示**
   - 输入密码时不会显示字符（这是正常的）
   - 直接输入后按回车

3. **临时令牌有时效性**
   - 临时登录令牌通常 1 小时有效
   - 建议设置永久密码

## 📝 验证登录成功

登录成功后，你会看到：
```
Login Succeeded
```

如果还是失败，检查：
- ACR 服务是否已开通
- 账号是否有 ACR 访问权限
- 网络连接是否正常

## 🆘 如果还是不行

请告诉我：
1. 你是否在 ACR 控制台设置了登录密码？
2. 你使用的是哪个密码（阿里云登录密码还是 ACR 密码）？
3. 在 ACR 控制台的 **访问凭证** 页面看到了什么？

