# ACR 登录网络超时问题解决

## ❌ 错误信息
```
Error response from daemon: Get "https://crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com/v2/": Get "https://dockerauth-cn-guangzhou.aliyuncs.com/auth?account=a15181013617&client_id=docker&offline_token=true&service=registry.aliyuncs.com%3Acn-guangzhou%3A26842": net/http: TLS handshake timeout
```

## 🔍 问题原因

这是网络连接超时问题，可能的原因：
1. **网络连接不稳定**
2. **防火墙或代理拦截**
3. **DNS 解析问题**
4. **阿里云服务暂时不可用**

## ✅ 解决方法

### 方法 1: 检查网络连接（推荐先试）

#### 1.1 测试网络连接

在 Cursor 终端中执行：

```powershell
# 测试能否访问阿里云
ping crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com

# 或者测试 HTTPS 连接
curl -I https://crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
```

#### 1.2 检查网络稳定性

- 确保网络连接稳定
- 如果使用 WiFi，尝试切换到有线网络
- 如果使用 VPN，尝试断开 VPN 后重试

### 方法 2: 配置 Docker 镜像加速器（推荐）

阿里云提供了 Docker 镜像加速器，可以改善连接：

#### 2.1 获取镜像加速器地址

1. 登录阿里云控制台
2. 进入 **容器镜像服务（ACR）**
3. 点击左侧菜单 **镜像加速器**
4. 复制你的专属加速器地址（格式类似：`https://xxxxx.mirror.aliyuncs.com`）

#### 2.2 配置 Docker Desktop

1. 打开 Docker Desktop
2. 点击 **Settings**（设置）
3. 点击 **Docker Engine**
4. 在 JSON 配置中添加：

```json
{
  "registry-mirrors": [
    "https://你的加速器地址.mirror.aliyuncs.com"
  ]
}
```

5. 点击 **Apply & Restart**
6. 等待 Docker 重启完成

### 方法 3: 增加超时时间

#### 3.1 配置 Docker 超时设置

在 Docker Desktop 的 **Settings** → **Docker Engine** 中添加：

```json
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5,
  "experimental": false
}
```

### 方法 4: 使用代理（如果在中国大陆）

如果在中国大陆，可能需要配置代理或使用镜像加速器。

#### 4.1 配置 HTTP 代理（如果有）

在 Docker Desktop 的 **Settings** → **Resources** → **Proxies** 中配置代理。

### 方法 5: 重试登录

网络问题可能是暂时的，可以：

1. **等待几分钟后重试**
   ```powershell
   docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
   ```

2. **使用不同的网络环境**
   - 切换到其他网络
   - 使用手机热点

### 方法 6: 检查防火墙和杀毒软件

1. **临时关闭防火墙**（测试用）
   - Windows 设置 → 更新和安全 → Windows 安全中心 → 防火墙和网络保护
   - 临时关闭防火墙测试

2. **检查杀毒软件**
   - 某些杀毒软件可能拦截 Docker 的网络连接
   - 临时关闭或添加例外

## 🎯 推荐操作流程

### 步骤 1: 配置镜像加速器（最重要）

1. 在 ACR 控制台获取镜像加速器地址
2. 在 Docker Desktop 中配置加速器
3. 重启 Docker Desktop

### 步骤 2: 检查网络

```powershell
# 测试网络连接
ping crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
```

### 步骤 3: 重试登录

```powershell
docker login --username=a15181013617 crpi-7sdjjtp0a37i7b0r.cn-guangzhou.personal.cr.aliyuncs.com
```

## ⚠️ 常见问题

### Q1: 为什么会出现 TLS handshake timeout？

**可能原因**：
- 网络连接不稳定
- 防火墙拦截
- DNS 解析慢
- 服务器暂时不可用

### Q2: 配置镜像加速器后还是超时？

**解决方法**：
- 确认加速器地址正确
- 确认 Docker Desktop 已重启
- 尝试使用其他网络环境

### Q3: 是否必须配置镜像加速器？

**不是必须的**，但强烈推荐，因为：
- 可以改善连接速度
- 减少超时问题
- 提高镜像拉取速度

## 📝 快速检查清单

- [ ] 网络连接是否稳定？
- [ ] 是否配置了 Docker 镜像加速器？
- [ ] Docker Desktop 是否已重启？
- [ ] 防火墙是否拦截？
- [ ] 是否使用了 VPN（可能需要断开）？

## 🆘 如果还是不行

1. **等待一段时间后重试**（可能是临时网络问题）
2. **尝试使用手机热点**（测试是否是网络环境问题）
3. **检查阿里云服务状态**（访问阿里云状态页面）
4. **联系阿里云客服**（如果持续无法连接）

---

**建议先配置镜像加速器，这是最有效的解决方法！**

