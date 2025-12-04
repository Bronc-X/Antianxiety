/**
 * Test Script: Scientific Search APIs (Pure Node.js)
 * Run with: node scripts/test-apis.js
 */

async function testSemanticScholar() {
  console.log('\n📚 Testing Semantic Scholar API...');
  const query = 'sleep HRV stress cortisol';
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=paperId,title,abstract,year,citationCount,url`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Failed: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const papers = data?.data || [];
    
    console.log(`✅ Found ${papers.length} papers`);
    papers.forEach((p, i) => {
      console.log(`  [${i + 1}] ${p.title?.slice(0, 80)}...`);
      console.log(`      Year: ${p.year || 'N/A'}, Citations: ${p.citationCount || 0}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testPubMed() {
  console.log('\n🏥 Testing PubMed API...');
  const query = 'sleep HRV stress cortisol';
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json`;
  
  try {
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error(`❌ Search failed: ${searchResponse.status}`);
      return;
    }
    
    const searchData = await searchResponse.json();
    const pmids = searchData?.esearchresult?.idlist || [];
    console.log(`✅ Found ${pmids.length} PMIDs: ${pmids.join(', ')}`);
    
    if (pmids.length === 0) return;
    
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const fetchResponse = await fetch(fetchUrl);
    const fetchData = await fetchResponse.json();
    const results = fetchData?.result || {};
    
    pmids.forEach((pmid, i) => {
      const paper = results[pmid];
      if (paper?.title) {
        console.log(`  [${i + 1}] ${paper.title.slice(0, 80)}...`);
        console.log(`      Date: ${paper.pubdate || 'N/A'}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('🧪 Scientific Search API Test');
  console.log('='.repeat(50));
  
  await testSemanticScholar();
  await testPubMed();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test complete!');
}

main();
