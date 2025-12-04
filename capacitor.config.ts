import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置文件（在线运行模式）
 *
 * 使用远程 URL 加载 Web 应用，webDir 仅作为占位。
 */
const config: CapacitorConfig = {
  // 应用唯一标识符
  appId: 'com.nomoreanxious.app',
  
  // 应用显示名称
  appName: 'No More Anxious',
  
  // 静态资源占位目录（用于同步流程）
  webDir: 'out',
  
  server: {
    // 远程 Web 应用地址（需保持可访问）
    url: 'https://project-metabasis.vercel.app',
    // Android 使用 https scheme 以支持现代 Web API
    androidScheme: 'https'
  },
  
  // 插件配置
  plugins: {
    // 启动画面配置
    SplashScreen: {
      // 启动画面显示时长 (毫秒)
      launchShowDuration: 2000,
      // 背景色 - 使用应用主题的 warm cream 色
      backgroundColor: '#FAF6EF',
      // 不显示加载指示器
      showSpinner: false,
      // 淡出动画时长
      splashFadeOutDuration: 300
    }
  }
};

export default config;
