/**
 * 内容爬取系统验证工具
 * 用于检查 content_feed_vectors 表的数据和爬取功能
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyContentCrawl() {
  console.log('🔍 开始验证内容爬取系统...\n');

  try {
    // 1. 检查表是否存在
    console.log('1. 检查 content_feed_vectors 表...');
    const { error: tableError } = await supabase
      .from('content_feed_vectors')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ 表不存在或无法访问:', tableError.message);
      return;
    }
    console.log('✅ 表存在\n');

    // 2. 统计总数据量
    console.log('2. 统计数据量...');
    const { count, error: countError } = await supabase
      .from('content_feed_vectors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 统计失败:', countError.message);
      return;
    }
    console.log(`✅ 总记录数: ${count || 0}\n`);

    // 3. 按来源类型统计
    console.log('3. 按来源类型统计...');
    const { data: typeData, error: typeError } = await supabase
      .from('content_feed_vectors')
      .select('source_type');

    if (typeError) {
      console.error('❌ 查询失败:', typeError.message);
      return;
    }

    const typeCounts: Record<string, number> = {};
    typeData?.forEach((item) => {
      const type = item.source_type || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    console.log('✅ 来源类型分布:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} 条`);
    });
    console.log('');

    // 4. 检查向量嵌入
    console.log('4. 检查向量嵌入...');
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('content_feed_vectors')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(10);

    if (embeddingError) {
      console.error('❌ 查询失败:', embeddingError.message);
      return;
    }

    const totalWithEmbedding = embeddingData?.length || 0;
    const totalRecords = count || 0;
    const embeddingRate = totalRecords > 0 ? (totalWithEmbedding / totalRecords * 100).toFixed(1) : '0';

    console.log(`✅ 有向量嵌入的记录: ${totalWithEmbedding}/${totalRecords} (${embeddingRate}%)`);
    if (totalWithEmbedding > 0) {
      const sample = embeddingData?.[0];
      if (sample?.embedding) {
        console.log(`   - 示例向量维度: ${(sample.embedding as number[]).length}`);
      }
    }
    console.log('');

    // 5. 检查最近爬取的内容
    console.log('5. 检查最近爬取的内容...');
    const { data: recentData, error: recentError } = await supabase
      .from('content_feed_vectors')
      .select('id, source_type, source_url, crawled_at, content_text')
      .order('crawled_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ 查询失败:', recentError.message);
      return;
    }

    if (recentData && recentData.length > 0) {
      console.log('✅ 最近爬取的 5 条内容:');
      recentData.forEach((item, index) => {
        console.log(`\n   ${index + 1}. [${item.source_type}]`);
        console.log(`      来源: ${item.source_url || 'N/A'}`);
        console.log(`      爬取时间: ${item.crawled_at || 'N/A'}`);
        console.log(`      内容预览: ${(item.content_text || '').substring(0, 100)}...`);
      });
    } else {
      console.log('⚠️  暂无最近爬取的内容');
    }
    console.log('');

    // 6. 检查内容质量
    console.log('6. 检查内容质量...');
    const { data: qualityData, error: qualityError } = await supabase
      .from('content_feed_vectors')
      .select('id, content_text, source_type')
      .not('content_text', 'is', null)
      .limit(10);

    if (qualityError) {
      console.error('❌ 查询失败:', qualityError.message);
      return;
    }

    if (qualityData && qualityData.length > 0) {
      const avgLength = qualityData.reduce((sum, item) => {
        return sum + ((item.content_text as string)?.length || 0);
      }, 0) / qualityData.length;

      console.log(`✅ 平均内容长度: ${Math.round(avgLength)} 字符`);
      console.log(`✅ 内容类型: ${new Set(qualityData.map((item) => item.source_type)).size} 种`);
    }
    console.log('');

    // 7. 验证建议
    console.log('📋 验证建议:');
    if (totalRecords === 0) {
      console.log('   ⚠️  表中没有数据，请运行爬取任务');
    } else if (totalRecords < 10) {
      console.log('   ⚠️  数据量较少，建议增加爬取频率或扩大爬取范围');
    } else {
      console.log('   ✅ 数据量充足');
    }

    if (parseFloat(embeddingRate) < 80) {
      console.log('   ⚠️  向量嵌入率较低，请检查嵌入生成功能');
    } else {
      console.log('   ✅ 向量嵌入率正常');
    }

    const uniqueTypes = Object.keys(typeCounts).length;
    if (uniqueTypes < 3) {
      console.log('   ⚠️  来源类型较少，建议增加更多数据源');
    } else {
      console.log('   ✅ 来源类型丰富');
    }

    console.log('\n✅ 验证完成！');
  } catch (error) {
    console.error('❌ 验证过程中出错:', error);
  }
}

// 运行验证
verifyContentCrawl();

