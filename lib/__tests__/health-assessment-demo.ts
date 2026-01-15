/**
 * Demo Test: Health Assessment Engine
 * 
 * 测试案例: 模拟一个典型的"压力型肥胖"用户
 */

import {
    runHealthAssessment,
    requiresImmediateAttention,
    type UserProfile,
    type QuestionnaireScores,
} from '../health-assessment-engine';

// ============ 测试案例 1: 压力型肥胖用户 ============

console.log('='.repeat(60));
console.log('测试案例 1: 压力型肥胖 (Stress Belly) 用户');
console.log('='.repeat(60));

const stressBellyUser: UserProfile = {
    id: 'test-user-001',
    gender: 'male',
    age: 35,
    height: 1.75,        // 175 cm
    weight: 85,          // 85 kg -> BMI = 27.8 (超重)
    waistLine: 95,       // 95 cm > 90 cm 阈值 (中心性肥胖)
};

// GAD-7 高焦虑状态 (每题都选"经常")
const stressBellyScores: QuestionnaireScores = {
    gad7: {
        gad7_1: 'more_than_half',  // 2分
        gad7_2: 'more_than_half',  // 2分
        gad7_3: 'nearly_every_day', // 3分
        gad7_4: 'more_than_half',  // 2分
        gad7_5: 'several_days',    // 1分
        gad7_6: 'more_than_half',  // 2分
        gad7_7: 'several_days',    // 1分
    },
    // 总分: 2+2+3+2+1+2+1 = 13 (中度焦虑, 触发高皮质醇风险)
};

const result1 = runHealthAssessment(stressBellyUser, stressBellyScores);

console.log('\n📊 用户档案:');
console.log(`   性别: ${stressBellyUser.gender}`);
console.log(`   年龄: ${stressBellyUser.age}`);
console.log(`   BMI: ${result1.bmi?.toFixed(1)} (阈值: 24)`);
console.log(`   腰围: ${stressBellyUser.waistLine} cm (阈值: 90)`);

console.log('\n📋 GAD-7 量表得分: 13 分 (中度焦虑)');

console.log('\n🏷️ 识别到的标签:');
result1.tags.forEach(tag => console.log(`   - ${tag}`));

console.log('\n📝 分析报告:');
result1.analysisReport.forEach(report => console.log(`   ${report}`));

if (result1.crossAnalysis) {
    console.log('\n🔍 交叉分析结果:');
    console.log(`   综合征: ${result1.crossAnalysis.syndrome}`);
    console.log(`   洞察: ${result1.crossAnalysis.insight}`);
}

console.log('\n⚠️ 风险等级:', result1.severity);
console.log('🚨 需要立即关注:', requiresImmediateAttention(result1));

// ============ 测试案例 2: 健康用户 ============

console.log('\n\n');
console.log('='.repeat(60));
console.log('测试案例 2: 健康用户 (无风险)');
console.log('='.repeat(60));

const healthyUser: UserProfile = {
    id: 'test-user-002',
    gender: 'female',
    age: 28,
    height: 1.65,
    weight: 55,          // BMI = 20.2 (正常)
    waistLine: 70,       // 正常
};

const healthyScores: QuestionnaireScores = {
    gad7: {
        gad7_1: 'not_at_all',
        gad7_2: 'not_at_all',
        gad7_3: 'several_days',
        gad7_4: 'not_at_all',
        gad7_5: 'not_at_all',
        gad7_6: 'several_days',
        gad7_7: 'not_at_all',
    },
    // 总分: 0+0+1+0+0+1+0 = 2 (极轻微焦虑)
};

const result2 = runHealthAssessment(healthyUser, healthyScores);

console.log('\n📊 用户档案:');
console.log(`   BMI: ${result2.bmi?.toFixed(1)} (正常)`);

console.log('\n📋 GAD-7 量表得分: 2 分 (极轻微)');

console.log('\n🏷️ 识别到的标签:');
if (result2.tags.length === 0) {
    console.log('   (无风险标签)');
} else {
    result2.tags.forEach(tag => console.log(`   - ${tag}`));
}

console.log('\n⚠️ 风险等级:', result2.severity);
console.log('🚨 需要立即关注:', requiresImmediateAttention(result2));

// ============ 测试案例 3: 亚健康用户 (SHSQ-25) ============

console.log('\n\n');
console.log('='.repeat(60));
console.log('测试案例 3: 亚健康状态用户 (慢性疲劳)');
console.log('='.repeat(60));

const subHealthUser: UserProfile = {
    id: 'test-user-003',
    gender: 'male',
    age: 42,
    height: 1.78,
    weight: 72,
};

// SHSQ-25: 疲劳维度高分
const subHealthScores: QuestionnaireScores = {
    shsq25: {
        // 疲劳维度 (Q1-Q9): 每题都选"经常" (2分)
        shsq_1: 'often',
        shsq_2: 'often',
        shsq_3: 'often',
        shsq_4: 'often',
        shsq_5: 'often',
        shsq_6: 'often',
        shsq_7: 'often',
        shsq_8: 'often',
        shsq_9: 'often',  // 疲劳维度总分: 18 (触发慢性疲劳)
        // 其他维度: 偶尔 (1分)
        shsq_10: 'sometimes',
        shsq_11: 'sometimes',
        shsq_12: 'sometimes',
        shsq_13: 'sometimes',
        shsq_14: 'sometimes',
        shsq_15: 'sometimes',
        shsq_16: 'sometimes',
        shsq_17: 'sometimes',
        shsq_18: 'sometimes',
        shsq_19: 'sometimes',
        shsq_20: 'sometimes',
        shsq_21: 'sometimes',
        shsq_22: 'sometimes',
        shsq_23: 'sometimes',
        shsq_24: 'sometimes',
        shsq_25: 'sometimes',
    },
    // 总分: 18 + 16 = 34 (轻度亚健康，但疲劳维度触发慢性疲劳)
};

const result3 = runHealthAssessment(subHealthUser, subHealthScores);

console.log('\n📋 SHSQ-25 量表:');
const shsqResult = result3.scaleResults.find(r => r.scaleId === 'shsq25');
if (shsqResult) {
    console.log(`   总分: ${shsqResult.totalScore}`);
    console.log(`   严重程度: ${shsqResult.severity}`);
    if (shsqResult.subscores) {
        console.log(`   疲劳维度: ${shsqResult.subscores.fatigue} (阈值: 18)`);
        console.log(`   心血管: ${shsqResult.subscores.cardiovascular}`);
        console.log(`   消化: ${shsqResult.subscores.digestive}`);
        console.log(`   免疫: ${shsqResult.subscores.immune}`);
        console.log(`   精神: ${shsqResult.subscores.mental}`);
    }
}

console.log('\n🏷️ 识别到的标签:');
result3.tags.forEach(tag => console.log(`   - ${tag}`));

console.log('\n📝 分析报告:');
result3.analysisReport.forEach(report => console.log(`   ${report}`));

console.log('\n⚠️ 风险等级:', result3.severity);

// ============ 汇总 ============

console.log('\n\n');
console.log('='.repeat(60));
console.log('测试汇总');
console.log('='.repeat(60));
console.log(`案例1 (压力型肥胖): ${result1.tags.length} 个标签, ${result1.severity} 风险`);
console.log(`案例2 (健康用户): ${result2.tags.length} 个标签, ${result2.severity} 风险`);
console.log(`案例3 (亚健康): ${result3.tags.length} 个标签, ${result3.severity} 风险`);
