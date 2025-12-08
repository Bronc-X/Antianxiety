# 🔨 Android 构建和部署指南

**创建日期**: 2025-12-07  
**项目**: No More Anxious  
**目标**: 构建和发布 Android APK

---

## 📋 前置要求

1. ✅ Node.js 18+ 已安装
2. ✅ Android Studio 已安装
3. ✅ Android SDK (API 23+) 已安装
4. ✅ Java JDK 11+ 已安装
5. ✅ 环境变量已配置（`ANDROID_HOME`）

---

## 🛠️ 构建流程

### 1. 开发模式构建（Debug APK）

**用途**: 本地测试和调试

```bash
# 步骤 1: 确保 Web 代码已构建（可选，在线模式不需要）
npm run build

# 步骤 2: 同步 Capacitor 项目
npm run cap:sync

# 步骤 3: 打开 Android Studio
npm run android

# 步骤 4: 在 Android Studio 中构建
# - 点击菜单: Build > Build Bundle(s) / APK(s) > Build APK(s)
# - 或点击工具栏的 Run 按钮（会自动构建并安装到设备）
```

**输出位置**: `android/app/build/outputs/apk/debug/app-debug.apk`

### 2. 生产模式构建（Release APK）

**用途**: 发布到应用商店

#### 2.1 配置签名密钥

```bash
# 生成签名密钥（首次构建）
keytool -genkey -v -keystore nomoreanxious-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nomoreanxious

# 将密钥文件移动到安全位置（不要提交到 Git）
mv nomoreanxious-release-key.jks ~/.android/
```

#### 2.2 配置签名信息

编辑 `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE") ?: "../nomoreanxious-release-key.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS") ?: "nomoreanxious"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 2.3 构建 Release APK

```bash
# 设置环境变量（可选，如果使用环境变量）
export KEYSTORE_FILE=~/.android/nomoreanxious-release-key.jks
export KEYSTORE_PASSWORD=your_password
export KEY_ALIAS=nomoreanxious
export KEY_PASSWORD=your_password

# 构建 Release APK
cd android
./gradlew assembleRelease

# 或使用 Android Studio
# Build > Build Bundle(s) / APK(s) > Build APK(s)
# 选择 "release" 变体
```

**输出位置**: `android/app/build/outputs/apk/release/app-release.apk`

### 3. App Bundle 构建（AAB）

**用途**: 发布到 Google Play Store（推荐）

```bash
cd android
./gradlew bundleRelease
```

**输出位置**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🌐 在线运行模式配置

本项目使用**在线运行模式**，Android 应用通过 WebView 加载远程部署的 Web 应用。

### 开发模式

**配置**: `capacitor.config.ts`
```typescript
server: {
  url: 'http://localhost:3000',
  androidScheme: 'http',
  cleartext: true
}
```

**使用方法**:
1. 启动开发服务器: `npm run dev`
2. 设置端口转发: `adb reverse tcp:3000 tcp:3000`
3. 在 Android Studio 中运行应用

### 生产模式

**配置**: `capacitor.config.ts`
```typescript
server: {
  url: 'https://project-metabasis.vercel.app',
  androidScheme: 'https',
  cleartext: false
}
```

**自动切换**: 根据 `NODE_ENV` 环境变量自动切换

---

## 📱 安装和测试

### 安装 Debug APK

```bash
# 方法 1: 使用 adb
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 方法 2: 在 Android Studio 中点击 Run
```

### 安装 Release APK

```bash
# 方法 1: 使用 adb
adb install android/app/build/outputs/apk/release/app-release.apk

# 方法 2: 传输到设备后手动安装
# - 启用"未知来源"安装权限
# - 使用文件管理器打开 APK 文件
```

---

## 🔍 版本管理

### 更新版本号

编辑 `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2  // 递增（整数）
        versionName "1.0.1"  // 版本号（字符串）
    }
}
```

**版本号规则**:
- `versionCode`: 每次发布递增（1, 2, 3, ...）
- `versionName`: 语义化版本（1.0.0, 1.0.1, 1.1.0, ...）

---

## 🚀 发布到 Google Play Store

### 1. 准备发布材料

- [ ] App Bundle (AAB) 文件
- [ ] 应用图标（512x512 PNG）
- [ ] 应用截图（至少 2 张）
- [ ] 应用描述（中英文）
- [ ] 隐私政策链接

### 2. 创建 Google Play Console 账户

1. 访问 https://play.google.com/console
2. 创建开发者账户（一次性费用 $25）
3. 创建新应用

### 3. 上传 App Bundle

1. 进入"发布" > "生产环境"
2. 点击"创建新版本"
3. 上传 `app-release.aab` 文件
4. 填写版本说明
5. 提交审核

---

## 🐛 常见问题

### 问题 1: Gradle 同步失败

**症状**: Android Studio 显示 Gradle 同步错误

**解决方案**:
```bash
# 清理 Gradle 缓存
cd android
./gradlew clean

# 删除 .gradle 目录
rm -rf .gradle

# 重新同步
./gradlew --refresh-dependencies
```

### 问题 2: 构建失败 - 找不到签名密钥

**症状**: `Keystore file not found`

**解决方案**:
- 检查 `build.gradle` 中的 `storeFile` 路径
- 确保密钥文件存在
- 检查环境变量是否正确设置

### 问题 3: 应用无法连接到生产 URL

**症状**: 生产环境 APK 显示网络错误

**检查项**:
- 检查 `capacitor.config.ts` 中的生产 URL
- 确保 Vercel 部署正常
- 检查 `network_security_config.xml` 配置

### 问题 4: 启动画面不显示

**症状**: 启动时直接显示 WebView

**检查项**:
- 检查 `styles.xml` 中的 `AppTheme.NoActionBarLaunch` 主题
- 检查 `splash.xml` drawable 是否存在
- 检查 SplashScreen 插件配置

---

## 📊 构建检查清单

### 构建前检查

- [ ] 版本号已更新
- [ ] 生产环境 URL 已配置
- [ ] 签名密钥已配置（Release 构建）
- [ ] 环境变量已设置（如需要）

### 构建后检查

- [ ] APK/AAB 文件已生成
- [ ] 文件大小合理（< 50MB）
- [ ] 在真机上测试安装
- [ ] 验证所有功能正常

### 发布前检查

- [ ] 应用图标已更新
- [ ] 应用名称正确
- [ ] 权限说明已更新
- [ ] 隐私政策链接有效

---

## 📚 相关文档

- [Android 测试指南](./ANDROID_TEST_GUIDE.md)
- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Google Play Console 帮助](https://support.google.com/googleplay/android-developer)

---

**最后更新**: 2025-12-07





