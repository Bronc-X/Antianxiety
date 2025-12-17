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
  envContent.split('\n').forEach((line) => {
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
  // AI 功能（生产通常需要）
  OPENAI_API_KEY: 'OpenAI-compatible API Key（用于 AI 聊天/向量记忆/推荐）',
};

const recommendedForDeployEnvVars = {
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase Service Role Key（cron/后台写入时需要）',
  CRON_SECRET: '保护 /api/cron/* 手动触发（可选）',
  CONTENT_INGEST_API_KEY: '保护 /api/ingest-content（可选）',
};

const isStrict =
  process.env.CHECK_ENV_STRICT === '1' ||
  process.env.NODE_ENV === 'production' ||
  process.env.CI === 'true';

const effectiveRequiredEnvVars = isStrict
  ? { ...requiredEnvVars, ...productionOnlyEnvVars }
  : requiredEnvVars;

const optionalEnvVars = {
  OPENAI_API_BASE: 'OpenAI-compatible Base URL（可选）',
  SEMANTIC_SCHOLAR_API_KEY: 'Semantic Scholar API Key（可选）',
  RESEND_API_KEY: 'Resend API Key（可选）',
  NODE_ENV: 'Node.js 环境（development/production）',
};

console.log('?? 检查环境变量配置...\n');

let hasErrors = false;
const missing = [];
const missingOptionalForLocal = [];
const missingRecommended = [];
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

// 非严格模式下，把“生产通常需要”的变量提示为可选
if (!isStrict) {
  for (const [key, description] of Object.entries(productionOnlyEnvVars)) {
    if (process.env[key]) {
      present.push({ key, description, value: '***已设置***' });
    } else {
      missingOptionalForLocal.push({ key, description });
    }
  }
}

// 部署推荐变量（不阻塞）
for (const [key, description] of Object.entries(recommendedForDeployEnvVars)) {
  if (process.env[key]) {
    present.push({ key, description, value: '***已设置***' });
  } else {
    missingRecommended.push({ key, description });
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
  console.log('? 已配置的环境变量:');
  present.forEach(({ key, description, value }) => {
    console.log(`   ${key}: ${value}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (missing.length > 0) {
  console.log('? 缺失的必需环境变量:');
  missing.forEach(({ key, description }) => {
    console.log(`   ${key}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (missingOptionalForLocal.length > 0) {
  console.log('??  本地开发可选（生产通常需要）的环境变量:');
  missingOptionalForLocal.forEach(({ key, description }) => {
    console.log(`   ${key}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (missingRecommended.length > 0) {
  console.log('??  部署建议配置的环境变量（不阻塞）:');
  missingRecommended.forEach(({ key, description }) => {
    console.log(`   ${key}`);
    console.log(`     说明: ${description}\n`);
  });
}

if (hasErrors) {
  console.log('??  请配置缺失的必需环境变量后再继续！');
  console.log('\n配置方法:');
  console.log('1. 本地开发: 复制 .env.example → .env.local');
  console.log('2. 部署平台: 在项目 Environment Variables 中添加');
  console.log('\n参考文档:');
  console.log('- README.md');
  console.log('- ENV_SETUP.md');
  console.log('- DEPLOYMENT.md');
  process.exit(1);
} else {
  console.log('? 所有必需的环境变量已配置！');
  process.exit(0);
}

