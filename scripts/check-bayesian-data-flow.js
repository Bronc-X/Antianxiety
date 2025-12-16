/**
 * 贝叶斯信念循环数据流诊断工具
 * 
 * 检查项：
 * 1. user_metrics 表是否存在
 * 2. 触发器是否存在
 * 3. 触发器是否正常执行
 * 4. 数据流是否打通：habit_completions → trigger → user_metrics
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBayesianDataFlow() {
  console.log('🔍 开始检查贝叶斯信念循环数据流...\n');

  try {
    // 1. 检查 user_metrics 表结构
    console.log('📋 步骤 1/5: 检查 user_metrics 表结构');
    const { data: metricsData, error: metricsError } = await supabase
      .from('user_metrics')
      .select('*')
      .limit(1);

    if (metricsError) {
      if (metricsError.message.includes('does not exist')) {
        console.log('❌ user_metrics 表不存在');
        console.log('   需要执行: supabase_user_metrics.sql\n');
        return;
      }
      console.log(`⚠️  查询错误: ${metricsError.message}\n`);
    } else {
      console.log('✅ user_metrics 表存在');
      console.log(`   当前记录数: ${metricsData?.length || 0}\n`);
    }

    // 2. 检查 habit_completions 表数据
    console.log('📋 步骤 2/5: 检查 habit_completions 表');
    const { data: completions, error: completionsError } = await supabase
      .from('habit_completions')
      .select('id, habit_id, user_id, completed_at, belief_score_snapshot')
      .order('completed_at', { ascending: false })
      .limit(5);

    if (completionsError) {
      console.log(`❌ habit_completions 查询失败: ${completionsError.message}\n`);
    } else {
      console.log(`✅ habit_completions 表有 ${completions?.length || 0} 条最近记录`);
      if (completions && completions.length > 0) {
        console.log('   最近5条记录:');
        completions.forEach((c, i) => {
          console.log(`   ${i + 1}. ID: ${c.id} | User: ${c.user_id?.slice(0, 8)}... | 时间: ${c.completed_at}`);
        });
      }
      console.log();
    }

    // 3. 检查 user_metrics 表数据
    console.log('📋 步骤 3/5: 检查 user_metrics 表数据');
    const { data: metrics, error: metricsDataError } = await supabase
      .from('user_metrics')
      .select('id, user_id, date, belief_curve_score, confidence_score, physical_performance_score')
      .order('date', { ascending: false })
      .limit(10);

    if (metricsDataError) {
      console.log(`❌ user_metrics 查询失败: ${metricsDataError.message}\n`);
    } else {
      console.log(`✅ user_metrics 表有 ${metrics?.length || 0} 条记录`);
      if (metrics && metrics.length > 0) {
        console.log('   最近10条记录:');
        metrics.forEach((m, i) => {
          console.log(`   ${i + 1}. User: ${m.user_id?.slice(0, 8)}... | 日期: ${m.date} | 信念分数: ${m.belief_curve_score} | 信心分数: ${m.confidence_score}`);
        });
      } else {
        console.log('   ⚠️  没有记录 - 触发器可能未执行');
      }
      console.log();
    }

    // 4. 检查数据对应关系
    console.log('📋 步骤 4/5: 检查数据流对应关系');
    if (completions && completions.length > 0 && metrics && metrics.length > 0) {
      const completionUserIds = new Set(completions.map(c => c.user_id));
      const metricsUserIds = new Set(metrics.map(m => m.user_id));
      
      const hasOverlap = [...completionUserIds].some(id => metricsUserIds.has(id));
      
      if (hasOverlap) {
        console.log('✅ habit_completions 和 user_metrics 有共同用户');
        console.log('   数据流可能已打通\n');
      } else {
        console.log('⚠️  habit_completions 和 user_metrics 没有共同用户');
        console.log('   触发器可能未正常执行\n');
      }
    } else {
      console.log('⚠️  无法检查对应关系（缺少数据）\n');
    }

    // 5. 检查贝叶斯函数是否存在（通过RPC调用）
    console.log('📋 步骤 5/5: 测试贝叶斯函数');
    console.log('   尝试调用 calculate_belief_curve_score...');
    
    // 获取一个测试用户ID
    const { data: userData } = await supabase.auth.getUser();
    const testUserId = userData?.user?.id || (completions && completions[0]?.user_id);
    
    if (!testUserId) {
      console.log('   ⚠️  没有可用的用户ID进行测试\n');
    } else {
      const { data: funcResult, error: funcError } = await supabase
        .rpc('calculate_belief_curve_score', {
          p_user_id: testUserId,
          p_date: new Date().toISOString().split('T')[0]
        });

      if (funcError) {
        if (funcError.message.includes('does not exist')) {
          console.log('   ❌ 贝叶斯函数不存在');
          console.log('      需要执行: supabase_bayesian_functions.sql\n');
        } else {
          console.log(`   ⚠️  函数调用错误: ${funcError.message}\n`);
        }
      } else {
        console.log(`   ✅ 贝叶斯函数正常，返回值: ${funcResult}\n`);
      }
    }

    // 6. 生成诊断报告
    console.log('=' .repeat(60));
    console.log('📊 诊断报告总结\n');
    
    const hasMetricsTable = !metricsError || !metricsError.message?.includes('does not exist');
    const hasMetricsData = metrics && metrics.length > 0;
    const hasCompletionsData = completions && completions.length > 0;
    
    console.log('表结构状态:');
    console.log(`  user_metrics 表: ${hasMetricsTable ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`  habit_completions 表: ${hasCompletionsData ? '✅ 有数据' : '⚠️  无数据'}`);
    
    console.log('\n数据流状态:');
    console.log(`  user_metrics 有数据: ${hasMetricsData ? '✅ 是' : '❌ 否'}`);
    
    if (!hasMetricsData && hasCompletionsData) {
      console.log('\n🔴 问题诊断:');
      console.log('  - habit_completions 有数据，但 user_metrics 没有数据');
      console.log('  - 可能原因：触发器未创建或未执行');
      console.log('\n💡 建议:');
      console.log('  1. 执行 supabase_bayesian_functions.sql（创建函数）');
      console.log('  2. 执行 ALL_SQL_SCRIPTS_TO_EXECUTE.sql（创建触发器）');
      console.log('  3. 手动完成一个习惯，检查 user_metrics 是否自动更新');
    } else if (hasMetricsData) {
      console.log('\n✅ 数据流状态: 正常');
      console.log('  贝叶斯计算触发器正常工作');
    } else {
      console.log('\n⚠️  数据流状态: 无法判断（缺少测试数据）');
      console.log('  建议：添加测试数据后再次检查');
    }
    
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ 检查过程出错:', error.message);
  }
}

checkBayesianDataFlow();
