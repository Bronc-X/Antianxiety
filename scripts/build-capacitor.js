/**
 * Capacitor 构建脚本（在线运行模式）
 * 
 * 本项目使用在线运行模式：
 * - Android 应用通过 WebView 加载远程 URL (project-metabasis.vercel.app)
 * - 无需静态导出，Web 更新后用户刷新即可看到最新版本
 * - 仅在修改原生配置时需要重新构建 APK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const remoteUrl = 'https://project-metabasis.vercel.app';

/**
 * 生成占位 HTML（用于 Capacitor 同步）
 */
function ensureRedirectPlaceholder() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=${remoteUrl}">
  <title>No More Anxious</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #FAF6EF;
      color: #2C2C2C;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #E8DFD0;
      border-top-color: #9CAF88;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script>window.location.href = '${remoteUrl}';</script>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>正在加载 No More Anxious...</p>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✅ 占位页面已生成，重定向到 ${remoteUrl}`);
}

/**
 * 主构建流程
 */
function run() {
  console.log('🚀 No More Anxious - Capacitor 构建\n');
  console.log('📱 运行模式: 在线 (WebView 加载远程 URL)');
  console.log(`🌐 远程地址: ${remoteUrl}\n`);

  try {
    // 步骤 1: 生成占位页面
    console.log('📦 步骤 1/2: 生成占位页面...');
    ensureRedirectPlaceholder();

    // 步骤 2: 同步到 Android
    console.log('\n📦 步骤 2/2: 同步 Capacitor 项目...');
    execSync('npx cap sync android', {
      stdio: 'inherit',
      cwd: rootDir,
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ 构建完成！');
    console.log('='.repeat(50));
    console.log('\n📱 下一步操作:');
    console.log('   1. 运行 "npm run android" 打开 Android Studio');
    console.log('   2. 在 Android Studio 中点击 Run 按钮');
    console.log('   3. 选择模拟器或连接的真机');
    console.log('\n💡 提示:');
    console.log('   - Web 代码更新后，用户刷新应用即可看到最新版本');
    console.log('   - 仅在修改原生配置时需要重新构建 APK');
    
  } catch (error) {
    console.error('\n❌ 构建失败:', error.message);
    process.exit(1);
  }
}

run();
