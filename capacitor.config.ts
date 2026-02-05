import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置文件（本地开发优先）
 *
 * 默认使用本地 dev server（热更新），除非显式设置 CAPACITOR_ENV=production。
 * - 开发模式：使用本地 URL（可通过 CAPACITOR_SERVER_URL 覆盖）
 * - 生产模式：使用部署 URL
 */
const devServerUrl = process.env.CAPACITOR_SERVER_URL ?? 'http://localhost:3000/native';
const capacitorEnv = process.env.CAPACITOR_ENV?.toLowerCase();
const nodeEnv = process.env.NODE_ENV?.toLowerCase();
const isProd = capacitorEnv === 'production' || capacitorEnv === 'prod' || nodeEnv === 'production';
const isDev = !isProd;
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

  server: {
    // 本地开发模式：使用 Mac 的 IP 地址（iOS 模拟器需要）
    url: isDev ? devServerUrl : productionUrl,
    cleartext: isDev,
    // 允许所有导航在 WebView 内部进行，不跳转 Safari
    allowNavigation: [
      '192.168.1.12:*',
      '172.20.10.4:*',
      'localhost:*',
      '127.0.0.1:*',
      '*.antianxiety.app',
      'antianxiety.app'
    ]
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
