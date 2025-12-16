/**
 * AI 记忆系统测试脚本
 * 测试向量生成、存储和检索功能
 * 
 * 运行方式: npx tsx scripts/test-ai-memory.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// 检查环境变量
console.log('🔍 检查环境变量...');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ 已配置' : '❌ 未配置');
console.log('- OPENAI_API_BASE:', process.env.OPENAI_API_BASE || '未设置');
console.log('- EMBEDDING_MODEL:', process.env.EMBEDDING_MODEL || '未设置 (默认: text-embedding-3-small)');
console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置');

async function testEmbedding() {
  console.log('\n📊 测试 1: 向量生成');
  console.log('='.repeat(50));
  
  const { generateEmbedding } = await import('../lib/aiMemory');
  
  const testText = '我最近睡眠质量不好，经常失眠';
  console.log(`测试文本: "${testText}"`);
  
  try {
    const startTime = Date.now();
    const embedding = await generateEmbedding(testText);
    const duration = Date.now() - startTime;
    
    if (embedding && embedding.length > 0) {
      console.log(`✅ 向量生成成功！`);
      console.log(`   - 维度: ${embedding.length}`);
      console.log(`   - 耗时: ${duration}ms`);
      console.log(`   - 前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      return embedding;
    } else {
      console.log('❌ 向量生成失败：返回空数组');
      return null;
    }
  } catch (error) {
    console.error('❌ 向量生成异常:', error);
    return null;
  }
}

async function testStoreMemory(embedding: number[] | null) {
  console.log('\n📊 测试 2: 记忆存储');
  console.log('='.repeat(50));
  
  if (!embedding) {
    console.log('⏭️ 跳过：没有可用的向量');
    return false;
  }
  
  const { storeMemory } = await import('../lib/aiMemory');
  
  // 使用测试用户 ID（需要替换为实际用户 ID）
  const testUserId = process.env.TEST_USER_ID || 'test-user-id';
  const testContent = `[测试] 我最近睡眠质量不好，经常失眠 - ${new Date().toISOString()}`;
  
  console.log(`用户 ID: ${testUserId}`);
  console.log(`内容: "${testContent.substring(0, 50)}..."`);
  
  try {
    const result = await storeMemory(testUserId, testContent, 'user', embedding);
    
    if (result.success) {
      console.log('✅ 记忆存储成功！');
      return true;
    } else {
      console.log('❌ 记忆存储失败:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 记忆存储异常:', error);
    return false;
  }
}

async function testRetrieveMemories(embedding: number[] | null) {
  console.log('\n📊 测试 3: 记忆检索');
  console.log('='.repeat(50));
  
  if (!embedding) {
    console.log('⏭️ 跳过：没有可用的向量');
    return;
  }
  
  const { retrieveMemories } = await import('../lib/aiMemory');
  
  const testUserId = process.env.TEST_USER_ID || 'test-user-id';
  
  console.log(`用户 ID: ${testUserId}`);
  console.log('检索相似记忆...');
  
  try {
    const memories = await retrieveMemories(testUserId, embedding, 5);
    
    if (memories && memories.length > 0) {
      console.log(`✅ 检索到 ${memories.length} 条相关记忆：`);
      memories.forEach((m, i) => {
        console.log(`   ${i + 1}. [${m.role}] ${m.content_text.substring(0, 50)}...`);
        console.log(`      时间: ${m.created_at}`);
      });
    } else {
      console.log('⚠️ 没有检索到相关记忆（可能是新用户或阈值过高）');
    }
  } catch (error) {
    console.error('❌ 记忆检索异常:', error);
  }
}

async function main() {
  console.log('🧠 AI 记忆系统测试');
  console.log('='.repeat(50));
  console.log(`时间: ${new Date().toISOString()}`);
  
  // 测试 1: 向量生成
  const embedding = await testEmbedding();
  
  // 测试 2: 记忆存储（需要有效的用户 ID）
  // await testStoreMemory(embedding);
  console.log('\n📊 测试 2: 记忆存储');
  console.log('='.repeat(50));
  console.log('⏭️ 跳过：需要有效的用户 ID');
  console.log('   提示: 设置 TEST_USER_ID 环境变量后可测试存储功能');
  
  // 测试 3: 记忆检索（需要有效的用户 ID）
  // await testRetrieveMemories(embedding);
  console.log('\n📊 测试 3: 记忆检索');
  console.log('='.repeat(50));
  console.log('⏭️ 跳过：需要有效的用户 ID');
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 测试完成！');
  console.log('\n📋 下一步:');
  console.log('1. 在 Supabase 执行 supabase_ai_memory_upgrade.sql');
  console.log('2. 设置 TEST_USER_ID 环境变量测试完整流程');
  console.log('3. 在应用中测试 AI 助理对话');
}

main().catch(console.error);
