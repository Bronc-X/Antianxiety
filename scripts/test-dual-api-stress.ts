/**
 * 压力测试: Semantic Scholar + PubMed
 * 5秒内各抓取10次
 * Run with: npx tsx scripts/test-dual-api-stress.ts
 */

const queries = [
  'sleep quality', 'anxiety treatment', 'HRV stress', 'cortisol levels',
  'meditation benefits', 'exercise mood', 'circadian rhythm', 'heart health',
  'vitamin D', 'inflammation markers'
];

interface TestResult {
  api: string;
  query: string;
  success: boolean;
  status?: number;
  count?: number;
  time: number;
}

async function testSemanticScholar(query: string): Promise<TestResult> {
  const start = Date.now();
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=3&fields=paperId,title`;
  
  try {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const time = Date.now() - start;
    
    if (!response.ok) {
      return { api: 'Semantic Scholar', query, success: false, status: response.status, time };
    }
    
    const data = await response.json();
    return { api: 'Semantic Scholar', query, success: true, count: data?.data?.length || 0, time };
  } catch (e: any) {
    return { api: 'Semantic Scholar', query, success: false, status: 0, time: Date.now() - start };
  }
}

async function testPubMed(query: string): Promise<TestResult> {
  const start = Date.now();
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&retmode=json`;
  
  try {
    const response = await fetch(url);
    const time = Date.now() - start;
    
    if (!response.ok) {
      return { api: 'PubMed', query, success: false, status: response.status, time };
    }
    
    const data = await response.json();
    return { api: 'PubMed', query, success: true, count: data?.esearchresult?.idlist?.length || 0, time };
  } catch (e: any) {
    return { api: 'PubMed', query, success: false, status: 0, time: Date.now() - start };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 压力测试: Semantic Scholar + PubMed (5秒内各10次)');
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  
  // 并发发起所有请求
  const allPromises: Promise<TestResult>[] = [];
  
  for (let i = 0; i < 10; i++) {
    allPromises.push(testSemanticScholar(queries[i]));
    allPromises.push(testPubMed(queries[i]));
  }
  
  const results = await Promise.all(allPromises);
  const totalTime = Date.now() - startTime;
  
  // 分类结果
  const ssResults = results.filter(r => r.api === 'Semantic Scholar');
  const pmResults = results.filter(r => r.api === 'PubMed');
  
  // 输出 Semantic Scholar 结果
  console.log('\n📚 Semantic Scholar 结果:');
  ssResults.forEach((r, i) => {
    const icon = r.success ? '✅' : '❌';
    const info = r.success ? `${r.count} papers` : `Status ${r.status}`;
    console.log(`  [${i+1}] ${icon} "${r.query}" - ${info} (${r.time}ms)`);
  });
  
  // 输出 PubMed 结果
  console.log('\n🏥 PubMed 结果:');
  pmResults.forEach((r, i) => {
    const icon = r.success ? '✅' : '❌';
    const info = r.success ? `${r.count} papers` : `Status ${r.status}`;
    console.log(`  [${i+1}] ${icon} "${r.query}" - ${info} (${r.time}ms)`);
  });
  
  // 统计
  const ssSuccess = ssResults.filter(r => r.success).length;
  const pmSuccess = pmResults.filter(r => r.success).length;
  const ssAvgTime = Math.round(ssResults.reduce((a, r) => a + r.time, 0) / ssResults.length);
  const pmAvgTime = Math.round(pmResults.reduce((a, r) => a + r.time, 0) / pmResults.length);
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 统计结果:');
  console.log(`  Semantic Scholar: ${ssSuccess}/10 成功 (${ssSuccess * 10}%), 平均 ${ssAvgTime}ms`);
  console.log(`  PubMed:           ${pmSuccess}/10 成功 (${pmSuccess * 10}%), 平均 ${pmAvgTime}ms`);
  console.log(`  总耗时: ${totalTime}ms (目标 < 5000ms)`);
  console.log('='.repeat(70));
}

main().catch(console.error);
