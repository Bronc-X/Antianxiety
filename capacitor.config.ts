import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置文件（在线运行模式）
 *
 * 使用远程 URL 加载 Web 应用，webDir 仅作为占位。
 * 
 * 开发模式：使用 localhost:3000（需要 adb reverse）
 * 生产模式：使用 Vercel 部署的 URL
 */
const isDev = process.env.NODE_ENV === 'development';
const productionUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/native`
  : 'https://www.antianxiety.app/native';

const config: CapacitorConfig = {
  // 应用唯一标识符
  appId: 'com.antianxiety.app',

  // 应用显示名称
  appName: 'AntiAnxiety',

  // 静态资源占位目录（用于同步流程）
  webDir: 'out',

  server: isDev ? {
    // 开发模式：使用 adb reverse 端口转发，模拟器可以用 localhost 访问宿主机
    url: 'http://localhost:3000',
    androidScheme: 'http',
    cleartext: true
  } : {
    // 生产模式：使用 Vercel 部署的 URL
    url: productionUrl,
    androidScheme: 'https',
    cleartext: false
  },

  // 插件配置
  plugins: {
    // 启动画面配置
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF6EF',
      showSpinner: false,
      splashFadeOutDuration: 300
    },
    // 状态栏配置 - 沉浸式体验
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true, // 让 Web 内容延伸到状态栏下方
      backgroundColor: '#00000000' // 透明背景
    },
    // 隐私屏幕 - 多任务界面模糊
    PrivacyScreen: {
      enable: true,
      imageName: 'Splash' // iOS上也是用启动图作为隐私遮罩
    },
    // 网络状态检测
    Network: {
    },
    // 触觉反馈
    Haptics: {
    },
    // 本地存储
    Preferences: {
    }
  }
};

export default config;
