/**
 * 测试 Chat API 全流程
 * Run with: npx tsx scripts/test-chat-api.ts
 */

async function testChatAPI() {
  console.log('='.repeat(70));
  console.log('🧪 测试 Chat API 全流程');
  console.log('='.repeat(70));

  const testMessage = '我通常下午三点半会非常困，这是什么原因？';
  console.log(`\n📝 测试消息: "${testMessage}"`);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-skip-auth': 'true', // 开发模式跳过认证
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: testMessage }
        ]
      }),
    });

    console.log(`\n📊 响应状态: ${response.status}`);

    // 检查自定义 headers
    const papersHeader = response.headers.get('x-antianxiety-papers');
    const consensusHeader = response.headers.get('x-antianxiety-consensus');
    const searchStatus = response.headers.get('x-neuromind-search-status');

    console.log('\n📋 响应 Headers:');
    console.log(`  x-antianxiety-papers: ${papersHeader ? '✅ 有数据' : '❌ 无数据'}`);
    console.log(`  x-antianxiety-consensus: ${consensusHeader ? '✅ 有数据' : '❌ 无数据'}`);
    console.log(`  x-neuromind-search-status: ${searchStatus || '❌ 无数据'}`);

    if (papers) {
      const papersData = JSON.parse(papers);
      console.log(`\n📚 论文数量: ${papersData.length}`);
      papersData.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`  [${i + 1}] ${p.title.slice(0, 50)}...`);
      });
    }

    if (consensus) {
      const consensusData = JSON.parse(consensus);
      console.log(`\n🎯 共识度: ${consensusData.level} (${(consensusData.score * 100).toFixed(0)}%)`);
    }

    if (searchStatus) {
      const statusData = JSON.parse(searchStatus);
      console.log(`\n🔍 搜索状态: ${statusData.success ? '✅ 成功' : '❌ 需要重试'}`);
    }

    // 读取响应体（流式）
    console.log('\n💬 AI 回复 (前500字):');
    const text = await response.text();
    console.log(text.slice(0, 500) + (text.length > 500 ? '...' : ''));

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n' + '='.repeat(70));
}

testChatAPI();
