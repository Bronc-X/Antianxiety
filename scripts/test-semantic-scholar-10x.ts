/**
 * 连续测试 Semantic Scholar API 10 次
 * Run with: npx tsx scripts/test-semantic-scholar-10x.ts
 */

const queries = [
  'sleep HRV stress',
  'anxiety cortisol',
  'meditation brain',
  'exercise mental health',
  'nutrition mood',
  'circadian rhythm',
  'heart rate variability',
  'stress resilience',
  'mindfulness anxiety',
  'sleep quality depression'
];

async function testSemanticScholar(query: string, attempt: number): Promise<boolean> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=3&fields=paperId,title,citationCount`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.log(`[${attempt}/10] ❌ FAIL - Query: "${query}" - Status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    const count = data?.data?.length || 0;
    console.log(`[${attempt}/10] ✅ OK   - Query: "${query}" - Found: ${count} papers`);
    return true;
  } catch (error: any) {
    console.log(`[${attempt}/10] ❌ ERROR - Query: "${query}" - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Semantic Scholar API - 连续 10 次测试');
  console.log('='.repeat(60));
  console.log('');
  
  let success = 0;
  let fail = 0;
  
  for (let i = 0; i < 10; i++) {
    const result = await testSemanticScholar(queries[i], i + 1);
    if (result) success++;
    else fail++;
    
    // 每次请求间隔 1 秒，避免过快触发限流
    if (i < 9) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log(`📊 测试结果: ${success}/10 成功, ${fail}/10 失败`);
  console.log(`📈 成功率: ${(success / 10 * 100).toFixed(0)}%`);
  console.log('='.repeat(60));
}

main().catch(console.error);
