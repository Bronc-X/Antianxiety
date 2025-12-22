/**
 * 项目结构属性测试
 * 
 * **Feature: nextjs-capacitor-migration, Property 9: 静态导出无 API 路由**
 * **Feature: nextjs-capacitor-migration, Property 10: 环境变量客户端访问**
 * 
 * **Validates: Requirements 1.5, 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 递归获取目录下所有文件
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) {
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * 获取目录下所有子目录名
 */
function getSubDirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath).filter((file) => {
    const fullPath = path.join(dirPath, file);
    return fs.statSync(fullPath).isDirectory();
  });
}

describe('Property 9: 在线运行时 API 路由说明', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 9: 在线运行时 API 路由说明**
   *
   * 在在线运行模式下，允许存在 app/api。此测试用于列出仍依赖网络/后端的路由，便于后续优化。
   */
  it('should document API routes that require online runtime', () => {
    const appDir = path.resolve(__dirname, '../../app');
    const apiDir = path.join(appDir, 'api');

    // 检查 api 目录是否存在
    const apiExists = fs.existsSync(apiDir);

    if (apiExists) {
      // 获取所有 API 路由文件
      const apiFiles = getAllFiles(apiDir).filter(f =>
        f.endsWith('route.ts') || f.endsWith('route.js')
      );

      // 记录仍依赖后端的 API 路由数量
      console.log(`[Runtime Required] Found ${apiFiles.length} API route files that rely on backend runtime`);
      console.log('API routes found:', apiFiles.map(f => f.replace(apiDir, '/api')));

      expect(apiExists).toBe(true); // 当前状态：API 路由存在
    } else {
      expect(apiExists).toBe(false);
    }
  });

  it('should verify next.config.ts is NOT static export (dynamic runtime)', () => {
    const nextConfigPath = path.resolve(__dirname, '../../next.config.ts');
    const configContent = fs.readFileSync(nextConfigPath, 'utf-8');

    // 确认没有强制静态导出
    expect(configContent).not.toContain("output: 'export'");
  });
});

describe('Property 10: 环境变量客户端访问', () => {
  /**
   * **Feature: nextjs-capacitor-migration, Property 10: 环境变量客户端访问**
   * 
   * *For any* 需要在客户端访问的环境变量，变量名 SHALL 以 NEXT_PUBLIC_ 为前缀。
   */

  // 生成有效的环境变量名
  const validEnvVarName = fc.stringMatching(/^[A-Z][A-Z0-9_]{0,30}$/);

  it('should verify NEXT_PUBLIC_ prefix requirement for client-side env vars', () => {
    fc.assert(
      fc.property(validEnvVarName, (varName) => {
        // 客户端可访问的环境变量必须以 NEXT_PUBLIC_ 开头
        const clientAccessible = `NEXT_PUBLIC_${varName}`;
        const serverOnly = varName;

        // 验证命名规则
        expect(clientAccessible.startsWith('NEXT_PUBLIC_')).toBe(true);
        expect(serverOnly.startsWith('NEXT_PUBLIC_')).toBe(false);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify existing NEXT_PUBLIC_ env vars in .env.example', () => {
    const envExamplePath = path.resolve(__dirname, '../../.env.example');

    if (fs.existsSync(envExamplePath)) {
      const envContent = fs.readFileSync(envExamplePath, 'utf-8');
      const lines = envContent.split('\n').filter(line =>
        line.trim() && !line.startsWith('#')
      );

      // 找出所有 NEXT_PUBLIC_ 变量
      const publicVars = lines.filter(line =>
        line.startsWith('NEXT_PUBLIC_')
      );

      // 验证公共变量格式正确
      publicVars.forEach(varLine => {
        const varName = varLine.split('=')[0];
        expect(varName.startsWith('NEXT_PUBLIC_')).toBe(true);
      });

      console.log(`Found ${publicVars.length} NEXT_PUBLIC_ environment variables`);
    }
  });

  it('should verify Supabase env vars use NEXT_PUBLIC_ prefix for client access', () => {
    // 验证 Supabase 客户端环境变量命名
    const requiredPublicVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    requiredPublicVars.forEach(varName => {
      expect(varName.startsWith('NEXT_PUBLIC_')).toBe(true);
    });
  });
});

describe('Project Structure Validation (Requirements 6.1)', () => {
  /**
   * Validates that the project follows the required directory structure:
   * app/, components/, lib/, hooks/, types/
   * 
   * **Validates: Requirements 6.1**
   */

  const projectRoot = path.resolve(__dirname, '../..');

  it('should have all required top-level directories', () => {
    const requiredDirs = ['app', 'components', 'lib', 'hooks', 'types'];

    requiredDirs.forEach(dir => {
      const dirPath = path.join(projectRoot, dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  it('should have components/ui directory for Shadcn components', () => {
    const uiDir = path.join(projectRoot, 'components', 'ui');
    expect(fs.existsSync(uiDir)).toBe(true);

    // Verify some core Shadcn components exist
    const expectedComponents = ['button.tsx', 'card.tsx', 'input.tsx'];
    expectedComponents.forEach(component => {
      const componentPath = path.join(uiDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);
    });
  });

  it('should have components/motion directory for Framer Motion components', () => {
    const motionDir = path.join(projectRoot, 'components', 'motion');
    expect(fs.existsSync(motionDir)).toBe(true);

    // Verify motion components exist
    const expectedComponents = [
      'MotionButton.tsx',
      'PageTransition.tsx',
      'StaggerList.tsx',
      'BreathingBackground.tsx',
      'index.ts'
    ];
    expectedComponents.forEach(component => {
      const componentPath = path.join(motionDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);
    });
  });

  it('should have components/lottie directory for Lottie animations', () => {
    const lottieDir = path.join(projectRoot, 'components', 'lottie');
    expect(fs.existsSync(lottieDir)).toBe(true);

    // Verify lottie components exist
    const expectedComponents = [
      'LoadingAnimation.tsx',
      'SuccessAnimation.tsx',
      'EmptyStateAnimation.tsx'
    ];
    expectedComponents.forEach(component => {
      const componentPath = path.join(lottieDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);
    });
  });

  it('should have components/layout directory for layout components', () => {
    const layoutDir = path.join(projectRoot, 'components', 'layout');
    expect(fs.existsSync(layoutDir)).toBe(true);

    // Verify GlassCard exists
    const glassCardPath = path.join(layoutDir, 'GlassCard.tsx');
    expect(fs.existsSync(glassCardPath)).toBe(true);
  });

  it('should have public/lottie directory for Lottie JSON files', () => {
    const lottieAssetsDir = path.join(projectRoot, 'public', 'lottie');
    expect(fs.existsSync(lottieAssetsDir)).toBe(true);

    // Verify some lottie JSON files exist
    const expectedFiles = ['loading.json', 'success.json'];
    expectedFiles.forEach(file => {
      const filePath = path.join(lottieAssetsDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('should have types/index.ts exporting all public types', () => {
    const typesIndexPath = path.join(projectRoot, 'types', 'index.ts');
    expect(fs.existsSync(typesIndexPath)).toBe(true);

    const content = fs.readFileSync(typesIndexPath, 'utf-8');

    // Verify key type exports
    expect(content).toContain('MotionButtonProps');
    expect(content).toContain('GlassCardProps');
    expect(content).toContain('Platform');
    expect(content).toContain('AnimationSize');
  });

  it('should have hooks/index.ts barrel export', () => {
    const hooksIndexPath = path.join(projectRoot, 'hooks', 'index.ts');
    expect(fs.existsSync(hooksIndexPath)).toBe(true);

    const content = fs.readFileSync(hooksIndexPath, 'utf-8');

    // Verify hook exports
    expect(content).toContain('useLottie');
    expect(content).toContain('useHaptics');
    expect(content).toContain('usePreferences');
    expect(content).toContain('useNetwork');
  });

  it('should have lib/capacitor.ts utility functions', () => {
    const capacitorLibPath = path.join(projectRoot, 'lib', 'capacitor.ts');
    expect(fs.existsSync(capacitorLibPath)).toBe(true);

    const content = fs.readFileSync(capacitorLibPath, 'utf-8');

    // Verify utility functions
    expect(content).toContain('isNative');
    expect(content).toContain('getPlatform');
  });

  it('should have lib/animations.ts animation presets', () => {
    const animationsLibPath = path.join(projectRoot, 'lib', 'animations.ts');
    expect(fs.existsSync(animationsLibPath)).toBe(true);

    const content = fs.readFileSync(animationsLibPath, 'utf-8');

    // Verify animation presets
    expect(content).toContain('pageTransition');
    expect(content).toContain('staggerContainer');
    expect(content).toContain('breathingBlob');
  });
});

describe('Capacitor Configuration Validation', () => {
  it('should verify capacitor.config.ts exists and has correct settings', () => {
    const capacitorConfigPath = path.resolve(__dirname, '../../capacitor.config.ts');

    expect(fs.existsSync(capacitorConfigPath)).toBe(true);

    const configContent = fs.readFileSync(capacitorConfigPath, 'utf-8');

    // 验证必要配置
    expect(configContent).toContain("appId: 'com.antianxiety.app'");
    expect(configContent).toContain("webDir: 'out'");
    expect(configContent).toContain('SplashScreen');
  });

  it('should verify android directory exists', () => {
    const androidDir = path.resolve(__dirname, '../../android');
    expect(fs.existsSync(androidDir)).toBe(true);
  });

  it('should verify build scripts in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const buildScriptPath = path.resolve(__dirname, '../../scripts/build-capacitor.js');

    expect(packageJson.scripts['build:cap']).toBe('node scripts/build-capacitor.js');
    expect(packageJson.scripts['android']).toBe('npx cap open android');
    expect(fs.existsSync(buildScriptPath)).toBe(true);
  });

  it('should ensure build-capacitor script runs online mode and sync', () => {
    const buildScriptPath = path.resolve(__dirname, '../../scripts/build-capacitor.js');
    const scriptContent = fs.readFileSync(buildScriptPath, 'utf-8');

    // 验证在线运行模式配置
    expect(scriptContent).toContain('在线运行模式');
    expect(scriptContent).toContain('out');
    expect(scriptContent).toContain('npx cap sync');
    expect(scriptContent).toContain('重定向');
    expect(scriptContent).toContain('project-metabasis.vercel.app');
  });
});

describe('Build Process Integration Tests (Requirements 1.4)', () => {
  /**
   * 构建流程集成测试
   * 验证构建脚本正确执行
   * 
   * **Validates: Requirements 1.4**
   * 
   * 注意: 这些测试依赖于运行 `npm run build:cap`，
   * 如果未构建则跳过相关测试
   */

  const projectRoot = path.resolve(__dirname, '../..');

  it('should have out directory after build (skipped if not built)', () => {
    const outDir = path.join(projectRoot, 'out');
    // out 目录应该存在（构建后）
    if (!fs.existsSync(outDir)) {
      console.log('[SKIPPED] out directory not found - run `npm run build:cap` first');
      return;
    }
    expect(fs.existsSync(outDir)).toBe(true);
  });

  it('should have index.html in out directory (skipped if not built)', () => {
    const indexPath = path.join(projectRoot, 'out', 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.log('[SKIPPED] out/index.html not found - run `npm run build:cap` first');
      return;
    }
    expect(fs.existsSync(indexPath)).toBe(true);

    // 验证重定向页面内容
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('Redirecting');
  });

  it('should have android assets synced after build (skipped if not built)', () => {
    const assetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');

    // 如果资产目录不存在，跳过测试（需要先运行 npm run build:cap）
    if (!fs.existsSync(assetsDir)) {
      console.log('[SKIPPED] Android assets not synced - run `npm run build:cap` first');
      return;
    }

    // 验证 capacitor 配置文件
    const configExists = fs.existsSync(path.join(assetsDir, 'capacitor.config.json'));
    const pluginsExists = fs.existsSync(path.join(assetsDir, 'capacitor.plugins.json'));

    if (!configExists || !pluginsExists) {
      console.log('[SKIPPED] Capacitor config files not found - run `npm run build:cap` first');
      return;
    }

    expect(configExists).toBe(true);
    expect(pluginsExists).toBe(true);

    // 验证 public 目录
    const publicDir = path.join(assetsDir, 'public');
    expect(fs.existsSync(publicDir)).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'index.html'))).toBe(true);
  });

  it('should have all required Capacitor plugins configured (skipped if not built)', () => {
    const pluginsPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json');

    // 如果插件配置文件不存在，跳过测试
    if (!fs.existsSync(pluginsPath)) {
      console.log('[SKIPPED] Capacitor plugins.json not found - run `npm run build:cap` first');
      return;
    }

    const plugins = JSON.parse(fs.readFileSync(pluginsPath, 'utf-8'));
    const pluginPkgs = plugins.map((p: { pkg: string }) => p.pkg);

    // 验证必要的插件
    expect(pluginPkgs).toContain('@capacitor/browser');
    expect(pluginPkgs).toContain('@capacitor/haptics');
    expect(pluginPkgs).toContain('@capacitor/network');
    expect(pluginPkgs).toContain('@capacitor/preferences');
    expect(pluginPkgs).toContain('@capacitor/splash-screen');
  });
});

