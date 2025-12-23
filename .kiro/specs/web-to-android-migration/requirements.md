# Requirements Document

## Introduction

本规范定义了将 AntiAnxiety Web 应用完整迁移到 Android 平台的需求。项目采用 Capacitor 在线运行模式，Android 应用通过 WebView 加载远程部署的 Web 应用，实现"一次开发，多端同步"的目标。

## Glossary

- **Web_App**: 基于 Next.js 的 Web 应用，部署在 Vercel
- **Android_App**: 使用 Capacitor 封装的 Android 原生应用
- **WebView**: Android 系统提供的网页渲染组件
- **Capacitor**: 跨平台应用框架，用于将 Web 应用封装为原生应用
- **Online_Mode**: 在线运行模式，应用通过 WebView 加载远程 URL
- **Native_Plugin**: Capacitor 原生插件，提供设备功能访问
- **Production_URL**: 生产环境 Web 应用的部署地址
- **Development_URL**: 开发环境本地服务器地址

## Requirements

### Requirement 1: 在线运行模式配置

**User Story:** 作为开发者，我想配置 Android 应用使用在线运行模式，以便应用始终加载最新的 Web 内容。

#### Acceptance Criteria

1. WHEN Android_App 启动 THEN THE System SHALL 加载 Production_URL 指定的 Web 应用
2. WHEN 开发环境运行 THEN THE System SHALL 加载 Development_URL (localhost:3000)
3. WHEN Production_URL 更新 THEN THE Android_App SHALL 自动加载新内容无需重新发布
4. THE Capacitor_Config SHALL 根据 NODE_ENV 环境变量自动切换开发和生产 URL
5. WHEN 网络连接失败 THEN THE System SHALL 显示友好的错误提示

### Requirement 2: 核心功能完整性

**User Story:** 作为用户，我想在 Android 应用中使用所有 Web 功能，以便获得完整的应用体验。

#### Acceptance Criteria

1. WHEN 用户打开 Android_App THEN THE System SHALL 显示与 Web_App 相同的登录界面
2. WHEN 用户登录成功 THEN THE System SHALL 跳转到主页并保持登录状态
3. WHEN 用户访问任何页面 THEN THE System SHALL 正确渲染所有 UI 组件和交互
4. WHEN 用户使用 AI 助手 THEN THE System SHALL 正常发送和接收消息
5. WHEN 用户切换语言 THEN THE System SHALL 立即更新界面语言
6. WHEN 用户完成习惯打卡 THEN THE System SHALL 正确记录并更新数据
7. WHEN 用户查看分析报告 THEN THE System SHALL 正确显示图表和数据
8. WHEN 用户管理健康计划 THEN THE System SHALL 正确同步计划数据

### Requirement 3: 原生功能集成

**User Story:** 作为用户，我想使用 Android 设备的原生功能，以便获得更好的移动体验。

#### Acceptance Criteria

1. WHEN 用户点击按钮 THEN THE System SHALL 提供触觉反馈（震动）
2. WHEN 应用启动 THEN THE System SHALL 显示启动画面（Splash Screen）
3. WHEN 应用切换到后台 THEN THE System SHALL 在多任务界面显示隐私遮罩
4. WHEN 网络状态变化 THEN THE System SHALL 检测并通知用户
5. WHEN 用户接收通知 THEN THE System SHALL 显示本地推送通知
6. THE Status_Bar SHALL 使用沉浸式样式与应用主题一致
7. WHEN 用户保存偏好设置 THEN THE System SHALL 使用原生存储持久化数据

### Requirement 4: 性能优化

**User Story:** 作为用户，我想应用快速响应，以便获得流畅的使用体验。

#### Acceptance Criteria

1. WHEN 应用冷启动 THEN THE System SHALL 在 3 秒内显示首屏内容
2. WHEN 应用热启动 THEN THE System SHALL 在 1 秒内恢复界面
3. WHEN 用户切换页面 THEN THE System SHALL 在 500 毫秒内完成导航
4. WHEN AI 响应简单问题 THEN THE System SHALL 在 5 秒内返回结果
5. WHEN AI 响应复杂问题 THEN THE System SHALL 在 10 秒内返回结果
6. THE WebView SHALL 启用硬件加速以提升渲染性能
7. THE System SHALL 缓存静态资源以减少网络请求

### Requirement 5: 兼容性保证

**User Story:** 作为用户，我想应用在不同 Android 设备上正常运行，以便所有用户都能使用。

#### Acceptance Criteria

1. THE Android_App SHALL 支持 Android 10 (API 29) 及以上版本
2. WHEN 在小屏设备运行 THEN THE System SHALL 正确适配布局
3. WHEN 在大屏设备运行 THEN THE System SHALL 充分利用屏幕空间
4. WHEN 系统启用深色模式 THEN THE System SHALL 自动切换到深色主题
5. WHEN 设备旋转 THEN THE System SHALL 正确适配横屏和竖屏布局
6. THE System SHALL 支持不同屏幕密度（mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi）

### Requirement 6: 网络安全配置

**User Story:** 作为开发者，我想配置网络安全策略，以便应用安全地访问远程资源。

#### Acceptance Criteria

1. THE System SHALL 允许 HTTPS 连接到 Production_URL
2. WHEN 开发环境运行 THEN THE System SHALL 允许 HTTP 连接到 localhost
3. THE System SHALL 配置 network_security_config.xml 定义安全策略
4. THE System SHALL 验证 SSL 证书以防止中间人攻击
5. WHEN 证书验证失败 THEN THE System SHALL 拒绝连接并显示错误

### Requirement 7: 构建和发布流程

**User Story:** 作为开发者，我想简化构建和发布流程，以便快速迭代和部署。

#### Acceptance Criteria

1. THE System SHALL 提供 npm 脚本用于同步 Capacitor 项目
2. THE System SHALL 提供 npm 脚本用于打开 Android Studio
3. WHEN 执行构建命令 THEN THE System SHALL 生成 Debug APK 用于测试
4. WHEN 执行发布构建 THEN THE System SHALL 生成签名的 Release APK
5. THE System SHALL 支持生成 App Bundle (AAB) 用于 Google Play 发布
6. THE Build_Config SHALL 自动递增版本号
7. THE System SHALL 提供构建检查清单确保发布质量

### Requirement 8: 开发调试支持

**User Story:** 作为开发者，我想方便地调试 Android 应用，以便快速定位和修复问题。

#### Acceptance Criteria

1. WHEN 开发模式运行 THEN THE System SHALL 启用 Chrome DevTools 调试
2. THE System SHALL 支持 adb reverse 端口转发连接本地服务器
3. WHEN 应用崩溃 THEN THE System SHALL 记录详细的错误日志
4. THE System SHALL 支持热重载以提升开发效率
5. THE System SHALL 提供测试清单覆盖所有核心功能

### Requirement 9: 用户体验优化

**User Story:** 作为用户，我想获得原生应用的体验，以便感觉应用是专为 Android 设计的。

#### Acceptance Criteria

1. WHEN 用户点击链接 THEN THE System SHALL 在应用内打开而非外部浏览器
2. WHEN 用户返回 THEN THE System SHALL 正确处理返回栈导航
3. WHEN 应用失去焦点 THEN THE System SHALL 保存当前状态
4. WHEN 应用恢复焦点 THEN THE System SHALL 恢复之前的状态
5. THE System SHALL 使用原生字体和样式以匹配 Android 设计规范
6. THE System SHALL 提供流畅的动画和过渡效果

### Requirement 10: 数据同步和持久化

**User Story:** 作为用户，我想应用数据在 Web 和 Android 之间同步，以便无缝切换设备。

#### Acceptance Criteria

1. WHEN 用户在 Web_App 更新数据 THEN THE Android_App SHALL 显示最新数据
2. WHEN 用户在 Android_App 更新数据 THEN THE Web_App SHALL 显示最新数据
3. THE System SHALL 使用 Supabase 作为统一的后端数据存储
4. THE System SHALL 使用 Supabase Realtime 实现实时数据同步
5. WHEN 网络断开 THEN THE System SHALL 缓存本地数据
6. WHEN 网络恢复 THEN THE System SHALL 自动同步缓存的数据

### Requirement 11: 错误处理和恢复

**User Story:** 作为用户，我想应用能够优雅地处理错误，以便在出现问题时知道如何解决。

#### Acceptance Criteria

1. WHEN 网络请求失败 THEN THE System SHALL 显示友好的错误消息
2. WHEN 服务器返回错误 THEN THE System SHALL 显示具体的错误原因
3. WHEN 应用崩溃 THEN THE System SHALL 自动重启并恢复到安全状态
4. THE System SHALL 提供重试机制用于失败的网络请求
5. WHEN 用户遇到错误 THEN THE System SHALL 提供明确的解决建议

### Requirement 12: 测试覆盖

**User Story:** 作为开发者，我想确保应用质量，以便用户获得稳定可靠的体验。

#### Acceptance Criteria

1. THE System SHALL 提供基础功能测试清单（登录、导航、语言切换）
2. THE System SHALL 提供 AI 功能测试清单（对话、论文搜索、记忆）
3. THE System SHALL 提供性能测试清单（首屏加载、AI 响应、页面切换）
4. THE System SHALL 提供兼容性测试清单（Android 版本、屏幕尺寸、深色模式、横竖屏）
5. WHEN 发现问题 THEN THE System SHALL 记录问题详情和复现步骤
6. THE System SHALL 提供测试报告模板用于记录测试结果
