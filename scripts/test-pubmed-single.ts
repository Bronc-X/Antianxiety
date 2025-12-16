/**
 * 单独测试 PubMed API
 */

async function testPubMed(query: string) {
  console.log(`\n🔍 测试查询: "${query}"`);
  
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&sort=relevance`;
  
  console.log(`📡 URL: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl);
    console.log(`📊 Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    const pmids = data?.esearchresult?.idlist || [];
    console.log(`✅ Found ${pmids.length} PMIDs: ${pmids.join(', ')}`);
    
    if (pmids.length > 0) {
      // Fetch details
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
      const fetchResponse = await fetch(fetchUrl);
      const fetchData = await fetchResponse.json();
      
      pmids.forEach((pmid: string) => {
        const paper = fetchData?.result?.[pmid];
        if (paper) {
          console.log(`\n📄 [${pmid}] ${paper.title}`);
          console.log(`   Date: ${paper.pubdate}`);
        }
      });
    }
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
  }
}

async function main() {
  // 测试不同的搜索词
  await testPubMed('afternoon fatigue sleepiness 3pm circadian');
  await testPubMed('afternoon fatigue circadian');
  await testPubMed('post lunch dip sleepiness');
  await testPubMed('circadian rhythm afternoon drowsiness');
}

main();
