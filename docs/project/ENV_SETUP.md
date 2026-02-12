# 环境变量配置指南

项目环境变量以 `.env.example` 为准，本文件提供最常用配置说明。

## 必需的环境变量

### 1) Supabase（本地/生产都需要）

如何获取 Supabase URL 和 Anon Key：

1. 登录 Supabase Dashboard
2. 进入项目 → **Settings** → **API**
3. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## AI 相关环境变量（启用聊天/向量记忆/推荐时需要）

- `OPENAI_API_KEY`：OpenAI-compatible API Key（服务端使用）
- `OPENAI_API_BASE`：可选，OpenAI-compatible Base URL（例如 `https://aicanapi.com/v1`）
- `OPENAI_EMBEDDING_MODEL` / `EMBEDDING_MODEL`：可选，默认 `text-embedding-3-small`

## 部署相关（按需）

- `SUPABASE_SERVICE_ROLE_KEY`：仅服务端使用，用于 Cron/后台写入（不要暴露到客户端）
- `CRON_SECRET`：保护 `/api/cron/*` 手动触发
- `CONTENT_INGEST_API_KEY`：保护 `/api/ingest-content`
- `SEMANTIC_SCHOLAR_API_KEY`：可选，提高学术检索额度
- `OPENALEX_ENABLED`：可选，是否启用 OpenAlex 扩源（默认 true，设为 `false` 可关闭）
- `OPENALEX_MAILTO`：可选，OpenAlex 礼貌池邮箱（提升速率）
- `OPENALEX_SCORE_MULTIPLIER`：可选，OpenAlex 排序降权（0.5-1.0，默认 0.9）
- `RESEND_API_KEY`：可选，用于发送评估报告邮件
- `ADMIN_API_KEY`：保护管理员代查接口（`Authorization: Bearer <key>`）

## 配置步骤

### 方法一：创建 `.env.local`

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

然后编辑 `.env.local`，填入真实值。

## 验证配置

```bash
npm run check-env
npm run dev
```

## 安全提示

- 不要把真实密钥写进仓库/文档
- `.env.local` 应保留在本地（已被 `.gitignore` 忽略）

## 新电脑环境准备（Mac）

### 已验证组合（2026-02）

- macOS 15.6
- Xcode 26
- iOS 26 Simulator
- Node.js 20.20.x
- npm 10.x
- CocoaPods 1.16.x
- OpenJDK 17

### 必装软件

1. Xcode 26（App Store）+ Command Line Tools：`xcode-select --install`
2. Homebrew：<https://brew.sh>
3. Node.js 20 LTS：`brew install node@20`
4. Android Studio（含 SDK / Emulator）
5. Android Platform Tools（adb）：`brew install --cask android-platform-tools`
6. JDK 17：`brew install openjdk@17`
7. CocoaPods（仅 legacy `ios/` Capacitor 工程需要）：`brew install cocoapods`

### 可选：zsh PATH 持久化（Homebrew keg-only 版本）

```bash
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zprofile
exec zsh
```

### 关键环境变量（Android）

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

### 项目初始化

```bash
npm ci
npm run check-env
npm run dev
```

### Android 构建准备（Capacitor）

```bash
npx cap sync android
npm run android
```

### iOS 构建准备（`antianxietynew/` 原生工程）

```bash
open antianxietynew/AntiAnxietynew.xcodeproj
xcodebuild -project antianxietynew/AntiAnxietynew.xcodeproj -scheme AntiAnxietynew -destination 'generic/platform=iOS Simulator' build
```

补充：
- iOS HealthKit 需要在 Xcode 中打开 `antianxietynew/AntiAnxietynew.xcodeproj`，并在 `AntiAnxietynew` target 启用 HealthKit Capability。
- Android Health Connect 需要安装并配置对应的 Capacitor 插件（见 `package.json` 依赖和 native 配置）。
- `ios/App/App.xcworkspace` 属于历史 Capacitor iOS 包装工程，不是当前主线 iOS 交付路径。
