/**
 * Test PubMed Rate Limiting
 * Run with: node scripts/test-pubmed-rate.js
 */

async function testPubMedRateLimit() {
  console.log('🧪 Testing PubMed Rate Limiting...\n');
  
  const queries = [
    'sleep HRV stress',
    'cortisol anxiety',
    'metabolism exercise',
    'circadian rhythm melatonin',
    'heart rate variability',
    'inflammation immune',
    'vitamin D health',
    'stress management',
    'sleep quality',
    'metabolic health'
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&retmode=json`;
    
    try {
      const start = Date.now();
      const response = await fetch(url);
      const elapsed = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        const count = data?.esearchresult?.idlist?.length || 0;
        console.log(`✅ [${i + 1}] "${query}" - ${count} results (${elapsed}ms)`);
        successCount++;
      } else {
        console.log(`❌ [${i + 1}] "${query}" - Status ${response.status} (${elapsed}ms)`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ [${i + 1}] "${query}" - Error: ${error.message}`);
      failCount++;
    }
    
    // 不加延迟，测试真实限流情况
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${successCount} success, ${failCount} failed`);
  
  if (failCount === 0) {
    console.log('✅ PubMed has NO rate limiting for basic usage!');
  } else {
    console.log('⚠️ PubMed may have rate limiting');
  }
}

testPubMedRateLimit();
