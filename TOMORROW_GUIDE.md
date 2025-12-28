# 明天开发指南 (2025-12-28)

> 新电脑完整初始化 + 项目恢复 + 上线准备

---

## 第一部分：新电脑环境配置 (Mac)

### 前置准备清单

在开始之前，请确保你有以下账号信息：

- [ ] GitHub 账号密码 / SSH Key
- [ ] Supabase 账号 (yangshengliwork@gmail.com)
- [ ] Vercel 账号
- [ ] Anthropic API Key
- [ ] OpenAI API Key

---

### 1. 安装 Xcode 和命令行工具

```bash
# 先安装命令行工具（必需，约 2GB）
xcode-select --install

# 等待安装完成后验证
xcode-select -p
# 应输出: /Library/Developer/CommandLineTools
```

> **可选**: 如果需要 iOS 开发，从 App Store 安装完整 Xcode (约 12GB)

---

### 2. 安装 Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# ⚠️ M系列芯片(M1/M2/M3/M4)需要添加到PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile

# 验证安装
brew --version
# 应输出: Homebrew 4.x.x
```

---

### 3. 安装 Node.js 20 LTS

```bash
# 使用 Homebrew 安装
brew install node@20

# 添加到 PATH (如果需要)
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# 验证版本
node -v   # 应为 v20.x.x (需要 >= 20.0.0)
npm -v    # 应为 10.x.x
```

---

### 4. 安装 Git 和配置

```bash
# 安装 Git
brew install git

# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "yangshengliwork@gmail.com"

# 生成 SSH Key (推荐)
ssh-keygen -t ed25519 -C "yangshengliwork@gmail.com"
# 按回车使用默认路径，可设置密码或留空

# 复制公钥
cat ~/.ssh/id_ed25519.pub
# 复制输出内容到 GitHub -> Settings -> SSH and GPG keys -> New SSH key

# 测试 SSH 连接
ssh -T git@github.com
# 应输出: Hi Bronc-X! You've successfully authenticated...
```

---

### 5. 安装代码编辑器

```bash
# VS Code (推荐)
brew install --cask visual-studio-code

# 或者 Cursor
brew install --cask cursor
```

**推荐 VS Code 插件:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

---

### 6. 克隆项目

```bash
cd ~/Desktop

# 使用 SSH (推荐)
git clone git@github.com:Bronc-X/Antianxiety.git

# 或使用 HTTPS
# git clone https://github.com/Bronc-X/Antianxiety.git

cd Antianxiety

# 查看所有分支
git branch -a

# 切换到开发分支
git checkout feature/unlearn-style-redesign
git pull origin feature/unlearn-style-redesign

# 查看当前分支
git branch
# 应显示: * feature/unlearn-style-redesign
```

---

### 7. 安装项目依赖

```bash
# 在项目根目录执行
npm install

# 如果遇到权限问题
sudo chown -R $(whoami) ~/.npm
npm install
```

预计安装约 500+ 个包，耗时 1-3 分钟。

---

### 8. 配置环境变量 ⚠️ 重要

```bash
# 复制环境变量模板
cp .env.example .env.local

# 打开编辑
code .env.local  # 或 cursor .env.local
```

**必填环境变量 (从 Supabase Dashboard 获取):**

```bash
# ============ 必需配置 ============
# Supabase 项目配置 (从 supabase.com -> Project Settings -> API 获取)
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI 服务 (必需)
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-proj-xxx

# 站点URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============ 可选配置 ============
# OAuth 登录
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# 穿戴设备
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=

# 其他服务
SEMANTIC_SCHOLAR_API_KEY=
RESEND_API_KEY=
ADMIN_API_KEY=
```

---

### 9. 验证配置并启动

```bash
# 检查环境变量配置
npm run check-env

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 确认正常运行。

**预期结果:**
- ✅ 页面正常加载
- ✅ 可以注册/登录
- ✅ AI 对话正常工作

---

## 第二部分：iOS/Android 开发环境 (可选)

### iOS 环境

```bash
# 安装 CocoaPods
brew install cocoapods

# 同步 iOS 项目
npx cap sync ios

# 打开 Xcode 项目
npx cap open ios
```

在 Xcode 中打开 `ios/App/App.xcworkspace`

---

### Android 环境

```bash
# 1. 安装 Android Studio
brew install --cask android-studio

# 2. 安装 JDK 17
brew install --cask temurin@17

# 3. 配置环境变量 (添加到 ~/.zshrc 或 ~/.zprofile)
cat << 'EOF' >> ~/.zshrc
# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
EOF

# 4. 生效配置
source ~/.zshrc

# 5. 打开 Android Studio 完成初始化
# - 打开 Android Studio
# - 选择 "More Actions" -> "SDK Manager"
# - 安装 Android SDK 34 或更高版本
# - 安装 Android SDK Build-Tools
# - 安装 Android Emulator

# 6. 同步 Android 项目
npx cap sync android

# 7. 打开 Android 项目
npx cap open android
```

---

## 第三部分：Supabase 配置

### 获取现有项目凭证

1. 登录 https://supabase.com (使用 yangshengliwork@gmail.com)
2. 选择项目 `antianxiety`
3. 进入 **Settings** -> **API**
4. 复制:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

---

### 执行数据库迁移 (如果新建项目)

1. 打开项目 → **SQL Editor**
2. **按顺序**执行以下 SQL 文件 (`supabase/migrations/` 目录):

#### 核心基础表 (必须先执行)
```
1. supabase_init_complete.sql           # 基础 profiles, daily_wellness_logs 等
2. supabase_ai_assistant.sql            # AI 对话表
3. supabase_user_plans.sql              # 用户计划表
4. supabase_content_feed_vectors.sql    # 内容推荐向量
```

#### 功能增强 (按日期顺序)
```
5. 20251216_adaptive_interaction_system.sql   # 自适应交互
6. 20251217_adaptive_plan_followup.sql        # 计划跟进
7. 20251222_wearable_integration.sql          # 穿戴设备
8. 20251222_adaptive_assessment_system.sql    # 自适应评估
9. 20251225_invite_codes.sql                  # 邀请码系统
10. 20251225_user_feed_feedback.sql           # 内容反馈
11. 20251230_update_user_health_data_types.sql # 健康数据类型
12. 20251231_bootstrap_missing_tables.sql     # 补充缺失表 ⚠️ 最新
```

> **注意**: 如果有中英文两个 Supabase 项目，两个都要执行相同 SQL

---

## 第四部分：Vercel 部署配置

### 环境变量对照表

| 变量 | 中文版 (zh.antianxiety.app) | 英文版 (en.antianxiety.app) |
|-----|---------------------------|---------------------------|
| NEXT_PUBLIC_SUPABASE_URL | antianxiety 项目 URL | antianxiety-en 项目 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | antianxiety anon key | antianxiety-en anon key |
| SUPABASE_SERVICE_ROLE_KEY | antianxiety service key | antianxiety-en service key |
| NEXT_PUBLIC_SITE_URL | https://zh.antianxiety.app | https://en.antianxiety.app |
| ANTHROPIC_API_KEY | 相同 | 相同 |
| OPENAI_API_KEY | 相同 | 相同 |

---

## 第五部分：当前进度提醒

### ✅ 已完成
- AI闭环连通 (PlanDashboard/ScienceFeed → 真实API)
- 穿戴设备简化 (只保留 HealthKit + Health Connect)
- WearableConnect 完整同步逻辑
- Toast通知、实时刷新、401处理
- AI计划生成 `/api/user/generate-plan`

### ⏳ 今日待完成
- [ ] 执行 Supabase SQL 迁移 (特别是 20251231_bootstrap_missing_tables.sql)
- [ ] 配置 Vercel 环境变量
- [ ] 端到端测试
- [ ] 合并到 main 分支
- [ ] Health Connect Android Bridge

---

## 第六部分：常用命令速查

```bash
# ===== 开发 =====
npm run dev              # 启动开发服务器 (http://localhost:3000)
npm run build            # 生产构建
npm run lint             # ESLint 检查
npm run check-env        # 检查环境变量

# ===== 移动端 =====
npx cap sync ios         # 同步 iOS
npx cap sync android     # 同步 Android
npx cap open ios         # 打开 Xcode
npx cap open android     # 打开 Android Studio

# ===== Git =====
git status                                    # 查看状态
git add -A                                    # 添加所有修改
git commit -m "feat: description"             # 提交
git push origin feature/unlearn-style-redesign # 推送
git pull origin feature/unlearn-style-redesign # 拉取最新
git checkout main                             # 切换到主分支
git merge feature/unlearn-style-redesign      # 合并分支

# ===== 故障排除 =====
rm -rf node_modules && npm install            # 重装依赖
rm -rf .next && npm run dev                   # 清除缓存重启
npm run restart                               # 强制重启开发服务器
```

---

## 第七部分：获取 API Keys 指南

### Supabase
1. https://supabase.com → 登录
2. 选择项目 → Settings → API
3. 复制 Project URL, anon key, service_role key

### Anthropic (Claude)
1. https://console.anthropic.com
2. API Keys → Create Key
3. 复制 `sk-ant-api03-xxx`

### OpenAI
1. https://platform.openai.com
2. API Keys → Create new secret key
3. 复制 `sk-proj-xxx`

### Vercel
1. https://vercel.com → 登录
2. 选择项目 → Settings → Environment Variables
3. 添加上述所有环境变量

---

## 遇到问题？

常见问题快速解决：

| 问题 | 解决方案 |
|-----|---------|
| `npm install` 失败 | 删除 `node_modules` 和 `package-lock.json` 重试 |
| 端口3000被占用 | `lsof -ti:3000 \| xargs kill -9` |
| Git push 被拒绝 | `git pull --rebase` 后重试 |
| Supabase 连接失败 | 检查 `.env.local` 中的 URL 和 Keys |
| AI 对话无响应 | 确认 ANTHROPIC_API_KEY 正确配置 |

---

## 联系方式

如需帮助，开启 AI 对话继续上次的工作。

祝开发顺利！🚀
