#!/usr/bin/env node

/**
 * Feature Checklist Verification Script
 * 
 * 运行方式: npm run check-features
 * 
 * 这个脚本验证所有核心功能是否存在，确保 UI 变更不会导致功能丢失。
 */

const fs = require('fs');
const path = require('path');

// ============================================
// 功能清单定义
// ============================================

const FEATURE_CHECKLIST = {
    // Server Actions (The Brain)
    serverActions: {
        path: 'app/actions',
        required: [
            'auth.ts',
            'calibration.ts',
            'chat.ts',
            'dashboard.ts',
            'feed.ts',
            'goals.ts',
            'onboarding.ts',
            'plans.ts',
            'profile.ts',
            'settings.ts',
            'assessment.ts',
            'analysis.ts',
        ],
    },

    // Domain Hooks (The Bridge)
    domainHooks: {
        path: 'hooks/domain',
        required: [
            'useAuth.ts',
            'useCalibration.ts',
            'useDashboard.ts',
            'useFeed.ts',
            'useGoals.ts',
            'useMax.ts',
            'useOnboarding.ts',
            'usePlans.ts',
            'useProfile.ts',
            'useSettings.ts',
            'useProactiveInquiry.ts',
            'useAssessment.ts',
            'useAnalysis.ts',
        ],
    },

    // Unlearn 功能组件
    unlearnComponents: {
        path: 'components/unlearn',
        required: [
            'DailyCalibration.tsx',
            'AIInquiryPanel.tsx',
            'HRVDashboard.tsx',
            'WearableConnect.tsx',
            'PlanDashboard.tsx',
            'FeedbackLoop.tsx',
            'ScienceFeed.tsx',
            'MaxFloatingButton.tsx',
            'MaxChatPanel.tsx',
        ],
    },

    // Unlearn 主页面必须导入的组件
    unlearnPageImports: {
        file: 'app/unlearn/page.tsx',
        mustContain: [
            'DailyCalibration',
            'HRVDashboard',
            'WearableConnect',
            'PlanDashboard',
            'FeedbackLoop',
            'ScienceFeed',
            'MaxFloatingButton',
            'ProactiveInquiryManager',
        ],
    },

    // Unlearn 子路由
    unlearnRoutes: {
        basePath: 'app/unlearn',
        required: [
            'calibration/page.tsx',
            'insights/page.tsx',
            'plans/page.tsx',
            'settings/page.tsx',
        ],
    },
};

// ============================================
// 检查函数
// ============================================

function checkFilesExist(category, config) {
    const results = { passed: [], failed: [] };

    if (config.required) {
        for (const file of config.required) {
            const fullPath = path.join(process.cwd(), config.path, file);
            if (fs.existsSync(fullPath)) {
                results.passed.push(file);
            } else {
                results.failed.push(file);
            }
        }
    }

    return results;
}

function checkFileContains(config) {
    const results = { passed: [], failed: [] };
    const fullPath = path.join(process.cwd(), config.file);

    if (!fs.existsSync(fullPath)) {
        return { passed: [], failed: ['文件不存在: ' + config.file] };
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const item of config.mustContain) {
        if (content.includes(item)) {
            results.passed.push(item);
        } else {
            results.failed.push(item);
        }
    }

    return results;
}

function checkRoutes(config) {
    const results = { passed: [], failed: [] };

    for (const route of config.required) {
        const fullPath = path.join(process.cwd(), config.basePath, route);
        if (fs.existsSync(fullPath)) {
            results.passed.push(route);
        } else {
            results.failed.push(route);
        }
    }

    return results;
}

// ============================================
// 主程序
// ============================================

function runChecks() {
    console.log('\n🔍 AntiAnxiety 功能清单检查\n');
    console.log('='.repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;
    const failures = [];

    // 检查 Server Actions
    console.log('\n📦 Server Actions (The Brain)');
    const actionsResult = checkFilesExist('serverActions', FEATURE_CHECKLIST.serverActions);
    console.log(`   ✅ ${actionsResult.passed.length} 个文件存在`);
    if (actionsResult.failed.length > 0) {
        console.log(`   ❌ ${actionsResult.failed.length} 个文件缺失: ${actionsResult.failed.join(', ')}`);
        failures.push(...actionsResult.failed.map(f => `actions/${f}`));
    }
    totalPassed += actionsResult.passed.length;
    totalFailed += actionsResult.failed.length;

    // 检查 Domain Hooks
    console.log('\n🔗 Domain Hooks (The Bridge)');
    const hooksResult = checkFilesExist('domainHooks', FEATURE_CHECKLIST.domainHooks);
    console.log(`   ✅ ${hooksResult.passed.length} 个文件存在`);
    if (hooksResult.failed.length > 0) {
        console.log(`   ❌ ${hooksResult.failed.length} 个文件缺失: ${hooksResult.failed.join(', ')}`);
        failures.push(...hooksResult.failed.map(f => `hooks/domain/${f}`));
    }
    totalPassed += hooksResult.passed.length;
    totalFailed += hooksResult.failed.length;

    // 检查 Unlearn 组件
    console.log('\n🎨 Unlearn 功能组件');
    const componentsResult = checkFilesExist('unlearnComponents', FEATURE_CHECKLIST.unlearnComponents);
    console.log(`   ✅ ${componentsResult.passed.length} 个组件存在`);
    if (componentsResult.failed.length > 0) {
        console.log(`   ❌ ${componentsResult.failed.length} 个组件缺失: ${componentsResult.failed.join(', ')}`);
        failures.push(...componentsResult.failed.map(f => `components/unlearn/${f}`));
    }
    totalPassed += componentsResult.passed.length;
    totalFailed += componentsResult.failed.length;

    // 检查页面导入
    console.log('\n📄 主页面组件导入');
    const importsResult = checkFileContains(FEATURE_CHECKLIST.unlearnPageImports);
    console.log(`   ✅ ${importsResult.passed.length} 个组件已导入`);
    if (importsResult.failed.length > 0) {
        console.log(`   ❌ ${importsResult.failed.length} 个组件未导入: ${importsResult.failed.join(', ')}`);
        failures.push(...importsResult.failed.map(f => `页面缺少: ${f}`));
    }
    totalPassed += importsResult.passed.length;
    totalFailed += importsResult.failed.length;

    // 检查子路由
    console.log('\n🛤️  Unlearn 子路由');
    const routesResult = checkRoutes(FEATURE_CHECKLIST.unlearnRoutes);
    console.log(`   ✅ ${routesResult.passed.length} 个路由存在`);
    if (routesResult.failed.length > 0) {
        console.log(`   ❌ ${routesResult.failed.length} 个路由缺失: ${routesResult.failed.join(', ')}`);
        failures.push(...routesResult.failed.map(f => `路由缺失: ${f}`));
    }
    totalPassed += routesResult.passed.length;
    totalFailed += routesResult.failed.length;

    // 总结
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 总结: ${totalPassed} 通过, ${totalFailed} 失败\n`);

    if (totalFailed > 0) {
        console.log('❌ 功能检查失败！以下项目需要修复:\n');
        failures.forEach(f => console.log(`   - ${f}`));
        console.log('\n');
        process.exit(1);
    } else {
        console.log('✅ 所有功能检查通过！可以安全提交。\n');
        process.exit(0);
    }
}

runChecks();
