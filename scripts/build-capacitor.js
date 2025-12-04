/**
 * Capacitor 构建脚本（在线运行模式）
 *
 * 不再使用静态导出；直接运行 Next.js 构建并同步到 Capacitor。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');
const remoteUrl = 'https://project-metabasis.vercel.app';

function ensureRedirectPlaceholder() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${remoteUrl}" />
    <script>location.href='${remoteUrl}';</script>
    <title>No More Anxious</title>
  </head>
  <body>
    <p>Redirecting to ${remoteUrl} ...</p>
  </body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  console.log(`🧭 已生成占位 index.html，重定向到 ${remoteUrl}`);
}

function run() {
  console.log('🚀 开始 Capacitor 构建 (动态运行模式)...\n');

  try {
    console.log('📦 步骤 1: 执行 Next.js 构建...');
    execSync('npx next build', {
      stdio: 'inherit',
      cwd: rootDir,
    });

    console.log('\n📦 步骤 2: 生成远程重定向占位...');
    ensureRedirectPlaceholder();

    console.log('\n📦 步骤 3: 同步 Capacitor 项目...');
    execSync('npx cap sync', {
      stdio: 'inherit',
      cwd: rootDir,
    });

    console.log('\n✅ Capacitor 构建完成');
    console.log('   - 构建产物位于 .next');
    console.log('   - out/ 已写入重定向占位页面');
    console.log('   - Android 项目已同步 (远程运行)');
    console.log('\n运行 "npm run android" 打开 Android Studio');
  } catch (error) {
    console.error('\n❌ 构建失败:', error.message);
    process.exit(1);
  }
}

run();
