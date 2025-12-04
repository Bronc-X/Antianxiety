/**
 * 测试: "我通常下午三点半会非常困"
 * 5秒内各10次，显示抓取内容
 * Run with: npx tsx scripts/test-afternoon-fatigue.ts
 */

const QUERY = '我通常下午三点半会非常困';
const SEARCH_QUERY = 'afternoon fatigue sleepiness 3pm circadian'; // 英文关键词

interface Paper {
  title: string;
  abstract?: string;
  year?: number;
  citations?: number;
  url: string;
}

interface TestResult {
  api: string;
  attempt: number;
  success: boolean;
  status?: number;
  papers: Paper[];
  time: number;
}

async function testSemanticScholar(attempt: number): Promise<TestResult> {
  const start = Date.now();
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(SEARCH_QUERY)}&limit=5&fields=paperId,title,abstract,year,citationCount,url`;
  
  try {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const time = Date.now() - start;
    
    if (!response.ok) {
      return { api: 'Semantic Scholar', attempt, success: false, status: response.status, papers: [], time };
    }
    
    const data = await response.json();
    const papers: Paper[] = (data?.data || []).map((p: any) => ({
      title: p.title,
      abstract: p.abstract?.slice(0, 200),
      year: p.year,
      citations: p.citationCount,
      url: p.url
    }));
    
    return { api: 'Semantic Scholar', attempt, success: true, papers, time };
  } catch (e: any) {
    return { api: 'Semantic Scholar', attempt, success: false, status: 0, papers: [], time: Date.now() - start };
  }
}

async function testPubMed(attempt: number): Promise<TestResult> {
  const start = Date.now();
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(SEARCH_QUERY)}&retmax=5&retmode=json`;
  
  try {
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return { api: 'PubMed', attempt, success: false, status: searchResponse.status, papers: [], time: Date.now() - start };
    }
    
    const searchData = await searchResponse.json();
    const pmids: string[] = searchData?.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      return { api: 'PubMed', attempt, success: true, papers: [], time: Date.now() - start };
    }
    
    // Fetch details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const fetchResponse = await fetch(fetchUrl);
    const time = Date.now() - start;
    
    if (!fetchResponse.ok) {
      return { api: 'PubMed', attempt, success: false, status: fetchResponse.status, papers: [], time };
    }
    
    const fetchData = await fetchResponse.json();
    const results = fetchData?.result || {};
    
    const papers: Paper[] = pmids.filter(id => results[id]).map(id => ({
      title: results[id].title,
      year: parseInt(results[id].pubdate?.split(' ')[0]) || undefined,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
    }));
    
    return { api: 'PubMed', attempt, success: true, papers, time };
  } catch (e: any) {
    return { api: 'PubMed', attempt, success: false, status: 0, papers: [], time: Date.now() - start };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 测试查询: "' + QUERY + '"');
  console.log('🔍 搜索关键词: ' + SEARCH_QUERY);
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  
  // 并发发起所有请求
  const allPromises: Promise<TestResult>[] = [];
  for (let i = 1; i <= 10; i++) {
    allPromises.push(testSemanticScholar(i));
    allPromises.push(testPubMed(i));
  }
  
  const results = await Promise.all(allPromises);
  const totalTime = Date.now() - startTime;
  
  // 分类
  const ssResults = results.filter(r => r.api === 'Semantic Scholar');
  const pmResults = results.filter(r => r.api === 'PubMed');
  
  // 统计
  const ssSuccess = ssResults.filter(r => r.success).length;
  const pmSuccess = pmResults.filter(r => r.success).length;
  
  console.log('\n📊 成功率统计:');
  console.log(`  Semantic Scholar: ${ssSuccess}/10 (${ssSuccess * 10}%)`);
  console.log(`  PubMed: ${pmSuccess}/10 (${pmSuccess * 10}%)`);
  console.log(`  总耗时: ${totalTime}ms`);
  
  // 显示第一个成功的 Semantic Scholar 结果内容
  const firstSS = ssResults.find(r => r.success && r.papers.length > 0);
  if (firstSS) {
    console.log('\n' + '='.repeat(80));
    console.log('📚 Semantic Scholar 抓取内容 (首次成功):');
    console.log('='.repeat(80));
    firstSS.papers.forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.title}`);
      console.log(`    年份: ${p.year || 'N/A'} | 引用: ${p.citations || 0}`);
      if (p.abstract) {
        console.log(`    摘要: ${p.abstract}...`);
      }
      console.log(`    链接: ${p.url}`);
    });
  } else {
    console.log('\n❌ Semantic Scholar 所有请求都失败了');
  }
  
  // 显示第一个成功的 PubMed 结果内容
  const firstPM = pmResults.find(r => r.success && r.papers.length > 0);
  if (firstPM) {
    console.log('\n' + '='.repeat(80));
    console.log('🏥 PubMed 抓取内容 (首次成功):');
    console.log('='.repeat(80));
    firstPM.papers.forEach((p, i) => {
      console.log(`\n[${i + 1}] ${p.title}`);
      console.log(`    年份: ${p.year || 'N/A'}`);
      console.log(`    链接: ${p.url}`);
    });
  } else {
    console.log('\n❌ PubMed 所有请求都失败了');
  }
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
