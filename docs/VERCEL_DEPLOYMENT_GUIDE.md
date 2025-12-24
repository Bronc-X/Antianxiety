# 🚀 AntiAnxiety.app Vercel 部署指南

> **域名**: www.antianxiety.app  
> **注册商**: Namecheap  
> **部署平台**: Vercel  
> **预计时间**: 20-30 分钟

---

## 📋 部署清单

### 第一阶段：Vercel 项目部署

- [ ] **1.1 登录 Vercel**
  - 访问 https://vercel.com/login
  - 使用 GitHub 账号登录（推荐）或邮箱注册

- [ ] **1.2 导入 GitHub 仓库**
  - 点击 "Add New Project"
  - 选择 `Bronc-X/Antianxiety` 仓库
  - 确认 Framework Preset 自动检测为 "Next.js"

- [ ] **1.3 配置环境变量**
  
  在 Vercel 部署页面的 "Environment Variables" 部分，添加以下变量：

  ```env
  # ===== 必需 =====
  NEXT_PUBLIC_SUPABASE_URL=<你的 Supabase URL>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 Supabase Anon Key>
  SUPABASE_SERVICE_ROLE_KEY=<你的 Service Role Key>

  # ===== AI 服务 =====
  ANTHROPIC_API_KEY=<你的 Claude API Key>
  OPENAI_API_KEY=<你的 OpenAI Key - 用于 Embeddings>

  # ===== 可选服务 =====
  SEMANTIC_SCHOLAR_API_KEY=<可选>
  RESEND_API_KEY=<用于发送邮件>
  ADMIN_API_KEY=<管理员 API 密钥，自己生成一个随机字符串>

  # ===== OAuth (如需 GitHub 登录) =====
  GITHUB_CLIENT_ID=<可选>
  GITHUB_CLIENT_SECRET=<可选>

  # ===== 穿戴设备 (如需) =====
  FITBIT_CLIENT_ID=<可选>
  FITBIT_CLIENT_SECRET=<可选>
  OURA_CLIENT_ID=<可选>
  OURA_CLIENT_SECRET=<可选>
  ```

  > ⚠️ **重要**: 从你本地的 `.env.local` 复制真实值，不要使用示例值！

- [ ] **1.4 点击 Deploy**
  - 等待构建完成（约 2-5 分钟）
  - 构建成功后，你会获得一个 `*.vercel.app` 临时域名

---

### 第二阶段：Namecheap DNS 配置

- [ ] **2.1 登录 Namecheap**
  - 访问 https://www.namecheap.com
  - 进入 Dashboard → Domain List → `antianxiety.app` → Manage

- [ ] **2.2 配置 DNS 记录**
  
  进入 "Advanced DNS" 标签页，删除现有记录，添加以下记录：

  | Type | Host | Value | TTL |
  |------|------|-------|-----|
  | **A** | `@` | `76.76.21.21` | Automatic |
  | **CNAME** | `www` | `cname.vercel-dns.com` | Automatic |

  > 💡 `76.76.21.21` 是 Vercel 的 DNS 服务器 IP

- [ ] **2.3 删除干扰记录**
  - 删除所有 Parking Page、URL Redirect 记录
  - 删除其他 A 记录或 CNAME 记录

---

### 第三阶段：Vercel 域名绑定

- [ ] **3.1 在 Vercel 添加域名**
  - 进入项目 → Settings → Domains
  - 添加 `antianxiety.app`
  - 添加 `www.antianxiety.app`

- [ ] **3.2 等待 DNS 生效**
  - 通常 5-30 分钟
  - 最长可能需要 24 小时（取决于 DNS 缓存）

- [ ] **3.3 验证 SSL 证书**
  - Vercel 会自动颁发 Let's Encrypt 证书
  - 确保域名显示绿色 ✓ Valid Configuration

---

### 第四阶段：验证部署

- [ ] **4.1 访问测试**
  ```bash
  # 测试根域名
  curl -I https://antianxiety.app
  
  # 测试 www 域名
  curl -I https://www.antianxiety.app
  
  # 验证 HTTPS 重定向
  curl -I http://antianxiety.app
  ```

- [ ] **4.2 功能验证**
  - [ ] 首页正常加载
  - [ ] 登录/注册流程正常
  - [ ] AI 聊天功能正常
  - [ ] Supabase 数据读写正常

- [ ] **4.3 Cron Jobs 验证**
  - 进入 Vercel Dashboard → 项目 → Settings → Crons
  - 确认看到两个 Cron 任务：
    - `/api/ingest-content` (每天 02:00 UTC)
    - `/api/cron/curate-content` (每天 03:00 UTC)

---

## 🔧 故障排查

### DNS 不生效

```bash
# 检查 DNS 解析
dig antianxiety.app
dig www.antianxiety.app

# 期望看到：
# antianxiety.app.    IN A  76.76.21.21
# www.antianxiety.app. IN CNAME cname.vercel-dns.com.
```

### 构建失败

1. 检查 Vercel 构建日志
2. 确保所有必需环境变量已设置
3. 本地运行 `npm run build` 确认无错误

### SSL 证书问题

- 确保 DNS 记录正确指向 Vercel
- 删除 Namecheap 的任何 URL 重定向设置
- 等待 10-30 分钟让 Vercel 自动颁发证书

---

## 📊 部署后监控

| 服务 | 监控页面 |
|------|---------|
| Vercel Logs | https://vercel.com/dashboard → Logs |
| Supabase | https://supabase.com/dashboard |
| Analytics | Vercel Dashboard → Analytics |

---

## 🔄 后续优化（可选）

### 迁移到 Cloudflare DNS（推荐）

如果需要 DDoS 保护和全球 CDN 加速：

1. 在 Cloudflare 添加站点 `antianxiety.app`
2. 在 Namecheap 修改 Nameservers 为 Cloudflare 提供的
3. 等待 24-48 小时 DNS 生效
4. 在 Cloudflare 配置 CNAME 记录（代理模式设为 DNS only）

---

## ✅ 完成！

部署完成后，你的应用将在以下地址可访问：
- 🌐 https://antianxiety.app
- 🌐 https://www.antianxiety.app

**Merry Christmas! 🎄**
