/**
 * Test Script: Scientific Search (Semantic Scholar + PubMed)
 * 
 * Run with: npx tsx scripts/test-scientific-search.ts
 */

// 模拟环境变量（如果没有设置）
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
process.env.OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1';

async function testSemanticScholar(query: string) {
  console.log('\n📚 Testing Semantic Scholar API...');
  console.log(`Query: "${query}"`);
  
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=paperId,title,abstract,year,citationCount,url`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`❌ Semantic Scholar failed: ${response.status}`);
      const text = await response.text();
      console.error(text);
      return;
    }
    
    const data = await response.json();
    const papers = data?.data || [];
    
    console.log(`✅ Found ${papers.length} papers from Semantic Scholar`);
    papers.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`\n  [${i + 1}] ${p.title}`);
      console.log(`      Year: ${p.year || 'N/A'}, Citations: ${p.citationCount || 0}`);
      console.log(`      URL: ${p.url || 'N/A'}`);
    });
  } catch (error) {
    console.error('❌ Semantic Scholar error:', error);
  }
}

async function testPubMed(query: string) {
  console.log('\n🏥 Testing PubMed API...');
  console.log(`Query: "${query}"`);
  
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&sort=relevance`;
  
  try {
    // Step 1: Search
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error(`❌ PubMed search failed: ${searchResponse.status}`);
      return;
    }
    
    const searchData = await searchResponse.json();
    const pmids: string[] = searchData?.esearchresult?.idlist || [];
    
    console.log(`✅ Found ${pmids.length} PMIDs: ${pmids.join(', ')}`);
    
    if (pmids.length === 0) return;
    
    // Step 2: Fetch details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const fetchResponse = await fetch(fetchUrl);
    
    if (!fetchResponse.ok) {
      console.error(`❌ PubMed fetch failed: ${fetchResponse.status}`);
      return;
    }
    
    const fetchData = await fetchResponse.json();
    const results = fetchData?.result || {};
    
    pmids.slice(0, 3).forEach((pmid, i) => {
      const paper = results[pmid];
      if (paper) {
        console.log(`\n  [${i + 1}] ${paper.title}`);
        console.log(`      Date: ${paper.pubdate || 'N/A'}`);
        console.log(`      URL: https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
      }
    });
  } catch (error) {
    console.error('❌ PubMed error:', error);
  }
}

async function testFullSearch() {
  console.log('\n🔬 Testing Full Scientific Search...');
  
  // 动态导入（避免 ESM 问题）
  const { searchScientificTruth } = await import('../lib/services/scientific-search');
  
  const query = 'How does sleep affect HRV and stress?';
  console.log(`Query: "${query}"`);
  
  try {
    const result = await searchScientificTruth(query);
    
    console.log(`\n✅ Keywords extracted: ${result.keywords.join(', ')}`);
    console.log(`✅ Total papers found: ${result.papers.length}`);
    console.log(`✅ Consensus: ${result.consensus.level} (${(result.consensus.score * 100).toFixed(0)}%)`);
    console.log(`   Rationale: ${result.consensus.rationale}`);
    
    console.log('\n📄 Top 5 Papers (Ranked):');
    result.papers.slice(0, 5).forEach((p) => {
      console.log(`\n  [${p.rank}] ${p.title}`);
      console.log(`      Source: ${p.source}, Year: ${p.year || 'N/A'}`);
      console.log(`      Citations: ${p.citationCount}, Composite Score: ${p.compositeScore}`);
      console.log(`      URL: ${p.url}`);
    });
  } catch (error) {
    console.error('❌ Full search error:', error);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Scientific Search Test Suite');
  console.log('='.repeat(60));
  
  const testQuery = 'sleep HRV stress cortisol';
  
  await testSemanticScholar(testQuery);
  await testPubMed(testQuery);
  
  // 只有在有 API key 时才测试完整搜索
  if (process.env.OPENAI_API_KEY) {
    await testFullSearch();
  } else {
    console.log('\n⚠️ Skipping full search test (no OPENAI_API_KEY)');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
}

main().catch(console.error);
