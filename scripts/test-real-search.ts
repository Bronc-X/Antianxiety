/**
 * 测试真实的 searchScientificTruth 函数
 * Run with: npx tsx scripts/test-real-search.ts
 */

// 手动加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

import { searchScientificTruth } from '../lib/services/scientific-search';

async function main() {
  const query = '我通常下午三点半会非常困';
  
  console.log('='.repeat(70));
  console.log('🧪 测试 searchScientificTruth');
  console.log(`📝 用户问题: "${query}"`);
  console.log('='.repeat(70));
  
  // 检查环境变量
  console.log(`\n🔐 环境变量检查:`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`  ANTHROPIC_API_BASE: ${process.env.ANTHROPIC_API_BASE || '未设置'}`);
  
  const startTime = Date.now();
  
  try {
    const result = await searchScientificTruth(query);
    const elapsed = Date.now() - startTime;
    
    console.log(`\n⏱️ 耗时: ${elapsed}ms`);
    console.log(`🔑 提取的关键词: ${result.keywords.join(', ')}`);
    console.log(`📊 共识度: ${result.consensus.level} (${(result.consensus.score * 100).toFixed(0)}%)`);
    console.log(`📋 理由: ${result.consensus.rationale}`);
    console.log(`📚 论文总数: ${result.papers.length}`);
    
    // 按来源分组
    const ssPapers = result.papers.filter(p => p.source === 'semantic_scholar');
    const pmPapers = result.papers.filter(p => p.source === 'pubmed');
    
    console.log(`\n   - Semantic Scholar: ${ssPapers.length} 篇`);
    console.log(`   - PubMed: ${pmPapers.length} 篇`);
    console.log(`\n🎯 搜索状态: ${result.success ? '✅ 成功' : '❌ 需要重试'}`);
    if (result.retryNeeded) {
      console.log('💡 提示: 系统繁忙，请按 [R] 重试');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📄 Top 10 论文 (按综合评分排序):');
    console.log('='.repeat(70));
    
    result.papers.slice(0, 10).forEach((p) => {
      console.log(`\n[${p.rank}] ${p.title}`);
      console.log(`    来源: ${p.source} | 年份: ${p.year || 'N/A'} | 引用: ${p.citationCount}`);
      console.log(`    评分: 综合=${p.compositeScore} (权威=${p.authorityScore}, 时效=${p.recencyScore}, 来源=${p.sourceQualityScore})`);
      console.log(`    链接: ${p.url}`);
      if (p.abstract) {
        console.log(`    摘要: ${p.abstract.slice(0, 150)}...`);
      }
    });
    
  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
}

main();
