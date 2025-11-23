/**
 * RAG系统测试脚本
 * 用于验证整个系统是否正常工作
 */

import { chatWithRAG } from '../lib/rag';
import { generateSystemPrompt } from '../lib/system_prompts';

// 测试用例
const testCases = [
  {
    name: '易疲劳场景',
    userQuestion: '为什么我总是感觉累？',
    userContext: {
      age: 38,
      metabolic_concerns: ['easy_fatigue'],
      activity_level: 'sedentary',
      stress_level: 7,
    },
    expectedKeywords: ['线粒体', '发电厂', 'Zone 2', '有氧'],
  },
  {
    name: '腹部长肉场景',
    userQuestion: '肚子越来越大，怎么办？',
    userContext: {
      age: 35,
      metabolic_concerns: ['belly_fat'],
      activity_level: 'sedentary',
      stress_level: 8,
    },
    expectedKeywords: ['IL-17', 'TNF', '炎症', '禁食', '16:8'],
  },
  {
    name: '餐后困倦场景',
    userQuestion: '为什么我下午三点老是想睡觉？',
    userContext: {
      age: 40,
      metabolic_concerns: ['easy_fatigue', 'carb_cravings'],
    },
    expectedKeywords: ['血糖', '碳水', '开合跳', '线粒体'],
  },
  {
    name: '紧急症状检测',
    userQuestion: '我刚才跑步时胸口很疼',
    userContext: {
      age: 42,
    },
    expectedKeywords: ['⚠️', '120', '医生', '安全'],
  },
];

// 模拟用户ID（实际使用时需要真实的用户ID）
const TEST_USER_ID = 'test-user-' + Date.now();

/**
 * 执行单个测试用例
 */
async function runTestCase(testCase: typeof testCases[0]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 测试场景: ${testCase.name}`);
  console.log(`❓ 用户提问: ${testCase.userQuestion}`);
  console.log('-'.repeat(60));

  try {
    const startTime = Date.now();
    
    const response = await chatWithRAG({
      userId: TEST_USER_ID,
      userQuestion: testCase.userQuestion,
      userContext: testCase.userContext,
      language: 'zh',
    });
    
    const duration = Date.now() - startTime;

    console.log(`\n🤖 AI回复:\n${response.answer}\n`);
    console.log(`📊 元数据:`);
    console.log(`   - 模型: ${response.metadata.model}`);
    console.log(`   - 检索时间: ${response.metadata.retrievalTime}ms`);
    console.log(`   - 生成时间: ${response.metadata.generationTime}ms`);
    console.log(`   - 总时长: ${duration}ms`);
    console.log(`   - 使用tokens: ${response.metadata.tokensUsed || 'N/A'}`);
    
    console.log(`\n📚 检索到的知识 (${response.knowledgeUsed.length}条):`);
    response.knowledgeUsed.forEach((k, i) => {
      console.log(`   ${i + 1}. [${k.category}] 相似度: ${k.similarity.toFixed(3)}`);
      console.log(`      标签: ${k.tags.join(', ')}`);
    });

    // 验证关键词
    console.log(`\n✅ 关键词检查:`);
    const foundKeywords: string[] = [];
    const missingKeywords: string[] = [];
    
    testCase.expectedKeywords.forEach(keyword => {
      if (response.answer.includes(keyword)) {
        foundKeywords.push(keyword);
        console.log(`   ✓ "${keyword}"`);
      } else {
        missingKeywords.push(keyword);
        console.log(`   ✗ "${keyword}" (未找到)`);
      }
    });

    // 回复质量检查
    console.log(`\n📝 回复质量检查:`);
    const checks = {
      '长度控制': response.answer.length <= 250,
      '包含emoji': /[\u{1F300}-\u{1F9FF}]/u.test(response.answer),
      '包含研究引用': /\d{4}/.test(response.answer) || response.answer.includes('研究'),
      '非学术化': !response.answer.includes('皮质醇-褪黑素') && !response.answer.includes('糖皮质激素'),
    };
    
    Object.entries(checks).forEach(([name, passed]) => {
      console.log(`   ${passed ? '✓' : '✗'} ${name}`);
    });

    const allPassed = Object.values(checks).every(v => v) && missingKeywords.length === 0;
    
    console.log(`\n${allPassed ? '✅ 测试通过' : '⚠️ 测试部分通过'}`);
    
    return {
      name: testCase.name,
      passed: allPassed,
      duration,
      foundKeywords: foundKeywords.length,
      totalKeywords: testCase.expectedKeywords.length,
    };
    
  } catch (error) {
    console.error(`\n❌ 测试失败:`, error);
    return {
      name: testCase.name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 RAG系统测试开始...\n');
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`测试用户ID: ${TEST_USER_ID}`);
  
  // 先测试System Prompt生成
  console.log('\n📋 测试System Prompt生成...');
  const systemPrompt = generateSystemPrompt({
    age: 38,
    metabolic_concerns: ['easy_fatigue', 'belly_fat'],
    stress_level: 7,
  });
  
  console.log(`✓ System Prompt长度: ${systemPrompt.length} 字符`);
  console.log(`✓ 包含角色设定: ${systemPrompt.includes('小绿医生') ? '是' : '否'}`);
  console.log(`✓ 包含沟通风格: ${systemPrompt.includes('三步回复法') ? '是' : '否'}`);
  console.log(`✓ 包含用户困扰: ${systemPrompt.includes('易疲劳') ? '是' : '否'}`);

  // 执行所有测试用例
  const results = [];
  for (const testCase of testCases) {
    const result = await runTestCase(testCase);
    results.push(result);
    
    // 间隔1秒避免API限流
    if (testCase !== testCases[testCases.length - 1]) {
      console.log('\n⏳ 等待1秒...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 输出总结
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 测试总结');
  console.log(`${'='.repeat(60)}\n`);
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`通过数: ${passedCount}`);
  console.log(`失败数: ${totalCount - passedCount}`);
  console.log(`通过率: ${((passedCount / totalCount) * 100).toFixed(1)}%\n`);
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if ('duration' in result) {
      console.log(`   耗时: ${result.duration}ms`);
      if ('foundKeywords' in result) {
        console.log(`   关键词: ${result.foundKeywords}/${result.totalKeywords}`);
      }
    }
    if ('error' in result) {
      console.log(`   错误: ${result.error}`);
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(passedCount === totalCount ? '🎉 所有测试通过！' : '⚠️ 部分测试失败，请检查日志');
  console.log(`${'='.repeat(60)}\n`);
  
  // 返回退出码
  process.exit(passedCount === totalCount ? 0 : 1);
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的Promise拒绝:', error);
  process.exit(1);
});

// 运行测试
main().catch(error => {
  console.error('❌ 测试脚本执行失败:', error);
  process.exit(1);
});
