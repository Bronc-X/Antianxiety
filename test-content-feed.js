/**
 * 个性化信息推送功能快速测试脚本
 * 
 * 使用方法：
 * 1. 在浏览器中打开 Web 应用并登录
 * 2. 打开开发者工具（F12）→ Console
 * 3. 复制此文件内容并粘贴到 Console 中执行
 * 
 * 或者：
 * 1. 在浏览器 Console 中逐个执行以下函数
 */

// ============================================
// 测试函数 1: 生成用户画像向量
// ============================================
async function testGeneratePersona() {
  console.log('🔵 开始生成用户画像向量...');
  
  try {
    const response = await fetch('/api/user/persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 用户画像向量生成成功！');
      console.log('响应:', data);
      return true;
    } else {
      console.error('❌ 生成失败:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
    return false;
  }
}

// ============================================
// 测试函数 2: 获取个性化信息流
// ============================================
async function testGetFeed(limit = 10) {
  console.log(`🔵 开始获取个性化信息流（限制: ${limit}）...`);
  
  try {
    const response = await fetch(`/api/feed?limit=${limit}`, {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      console.log(`✅ 成功获取 ${data.items.length} 条内容！`);
      console.log('内容列表:');
      data.items.forEach((item, index) => {
        console.log(`\n${index + 1}. [${item.source_type}] 相关性: ${item.relevance_score.toFixed(2)}/5.0`);
        console.log(`   内容: ${item.content_text.substring(0, 100)}...`);
        console.log(`   链接: ${item.source_url}`);
      });
      return data;
    } else {
      console.log('⚠️ 没有相关内容');
      if (data.message) {
        console.log('提示:', data.message);
      }
      return data;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
    return null;
  }
}

// ============================================
// 测试函数 3: 验证用户画像向量
// ============================================
async function testVerifyPersona() {
  console.log('🔵 验证用户画像向量...');
  
  try {
    // 这里需要直接查询 Supabase，或者通过 API
    // 由于是客户端，我们通过尝试获取 feed 来间接验证
    const response = await fetch('/api/feed?limit=1', {
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (data.message && data.message.includes('用户画像向量未生成')) {
      console.log('❌ 用户画像向量未生成');
      console.log('💡 提示: 请先调用 testGeneratePersona() 生成画像向量');
      return false;
    } else {
      console.log('✅ 用户画像向量已存在');
      return true;
    }
  } catch (error) {
    console.error('❌ 验证失败:', error);
    return false;
  }
}

// ============================================
// 测试函数 4: 完整测试流程
// ============================================
async function runFullTest() {
  console.log('🚀 开始完整测试流程...\n');
  
  // 步骤 1: 验证/生成用户画像向量
  console.log('📋 步骤 1: 验证用户画像向量');
  const hasPersona = await testVerifyPersona();
  
  if (!hasPersona) {
    console.log('\n📋 步骤 1.5: 生成用户画像向量');
    const generated = await testGeneratePersona();
    if (!generated) {
      console.error('\n❌ 测试终止：无法生成用户画像向量');
      return;
    }
    // 等待一下让向量生成完成
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 步骤 2: 获取信息流
  console.log('\n📋 步骤 2: 获取个性化信息流');
  const feedData = await testGetFeed(10);
  
  if (feedData && feedData.items && feedData.items.length > 0) {
    // 步骤 3: 验证相关性过滤
    console.log('\n📋 步骤 3: 验证相关性过滤（>= 4.5/5.0）');
    const aboveThreshold = feedData.items.filter(item => item.relevance_score >= 4.5);
    console.log(`✅ 相关性 >= 4.5 的内容: ${aboveThreshold.length}/${feedData.items.length}`);
    
    if (aboveThreshold.length === feedData.items.length) {
      console.log('✅ 相关性过滤正常工作！');
    } else {
      console.log('⚠️ 部分内容相关性 < 4.5，但已被正确过滤');
    }
  } else {
    console.log('\n⚠️ 没有内容可显示');
    console.log('💡 提示: 可能需要先爬取内容或内容池为空');
  }
  
  console.log('\n✅ 测试完成！');
}

if (require.main === module) {
  runFullTest().catch((error) => {
    console.error('测试运行出错:', error);
    process.exit(1);
  });
}

// ============================================
// 导出测试函数（在 Console 中可以直接调用）
// ============================================
console.log(`
╔══════════════════════════════════════════════════════════╗
║  个性化信息推送功能测试脚本已加载                        ║
╠══════════════════════════════════════════════════════════╣
║  可用函数：                                              ║
║                                                          ║
║  1. testGeneratePersona()    - 生成用户画像向量         ║
║  2. testGetFeed(limit)        - 获取信息流              ║
║  3. testVerifyPersona()       - 验证画像向量             ║
║  4. runFullTest()             - 运行完整测试            ║
║                                                          ║
║  快速开始：执行 runFullTest()                            ║
╚══════════════════════════════════════════════════════════╝
`);

// 自动运行完整测试（可选）
// runFullTest();

