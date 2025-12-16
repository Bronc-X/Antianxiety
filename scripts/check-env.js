/**
 * 环境变量检查脚本
 * 用于验证部署所需的环境变量是否已配置
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// 尝试加载 .env.local 文件
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // 移除引号（如果有）
        const cleanValue = value.replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
}

const requiredEnvVars = {
  // Supabase 必需（本地/生产都需要）
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase 项目 URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase 匿名密钥',
};

const productionOnlyEnvVars = {
  // AI 功能（部署到生产时必需）
  DEEPSEEK_API_KEY: 'DeepSeek API 密钥（用于 AI 聊天功能）',
};

const isStrict =
  process.env.CHECK_ENV_STRICT === '1' ||
  process.env.NODE_ENV === 'production' ||
  process.env.CI === 'true';

const effectiveRequiredEnvVars = isStrict
  ? { ...requiredEnvVars, ...productionOnlyEnvVars }
  : requiredEnvVars;

const optionalEnvVars = {
  NODE_ENV: 'Node.js 环境（development/production）',
};

console.log('🔍 检查环境变量配置...\n');

let hasErrors = false;
const missing = [];
const missingOptionalForLocal = [];
const present = [];

// 检查必需的环境变量
for (const [key, description] of Object.entries(effectiveRequiredEnvVars)) {
  if (process.env[key]) {
    present.push({ key, description, value: '***已设置***' });
  } else {
    missing.push({ key, description });
    hasErrors = true;
  }
}

if (!isStrict) {
  for (const [key, description] of Object.entries(productionOnlyEnvVars)) {
    if (process.env[key]) {
      present.push({ key, description, value: '***已设置***' });
    } else {
      missingOptionalForLocal.push({ key, description });
    }
  }
}

// 检查可选的环境变量
for (const [key, description] of Object.entries(optionalEnvVars)) {
  if (process.env[key]) {
    present.push({ key, description, value: process.env[key] });
  }
}

// 输出结果
if (present.length > 0) {
  console.log('✅ 已配置的环境变量:');
  present.forEach(({ key, description, value }) => {
    console.log(`   ${key}: ${value}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (missing.length > 0) {
  console.log('❌ 缺失的环境变量:');
  missing.forEach(({ key, description }) => {
    console.log(`   ${key}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (missingOptionalForLocal.length > 0) {
  console.log('⚠️  本地开发可选（生产需要）的环境变量:');
  missingOptionalForLocal.forEach(({ key, description }) => {
    console.log(`   ${key}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (hasErrors) {
  console.log('⚠️  请配置缺失的环境变量后再部署！');
  console.log('\n配置方法:');
  console.log('1. 本地开发: 在项目根目录创建 .env.local 文件');
  console.log('2. Cloudflare Pages: 在项目设置 → Environment variables 中添加');
  console.log('\n参考文档:');
  console.log('- ENV_SETUP.md - 环境变量配置指南');
  console.log('- DEEPSEEK_SETUP.md - DeepSeek API 配置指南');
  console.log('- cloudflare-deployment.md - Cloudflare 部署指南');
  process.exit(1);
} else {
  console.log('✅ 所有必需的环境变量已配置！');
  process.exit(0);
}
