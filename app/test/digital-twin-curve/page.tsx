/**
 * Digital Twin Curve Test Page
 * 
 * Test page to verify the useDigitalTwinCurve hook functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { useDigitalTwinCurve, getDataQualityStatus, getCurrentMilestone, getMetricPredictions } from '@/hooks/domain';

export default function DigitalTwinCurveTestPage() {
    const {
        curveData,
        isLoading,
        error,
        generateCurve,
        refreshCurve
    } = useDigitalTwinCurve();

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'passed' | 'failed'>('idle');
    const [testResults, setTestResults] = useState<string[]>([]);

    const runTests = async () => {
        setTestStatus('testing');
        setTestResults([]);
        const results: string[] = [];

        try {
            // Test 1: Generate curve
            results.push('🔄 Testing generateCurve()...');
            await generateCurve();
            results.push('✅ generateCurve() completed');

            // Wait for state to update
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (e) {
            results.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
            setTestStatus('failed');
        }

        setTestResults(results);
    };

    // Run validation tests when curveData is available
    useEffect(() => {
        if (curveData && testStatus === 'testing') {
            const results = [...testResults];

            // Test 2: Validate structure
            results.push('🔄 Validating output structure...');

            if (curveData.meta) {
                results.push(`✅ meta.ruleVersion: ${curveData.meta.ruleVersion}`);
                results.push(`✅ meta.currentWeek: ${curveData.meta.currentWeek}`);
            } else {
                results.push('❌ meta is missing');
            }

            if (curveData.A_predictedLongitudinalOutcomes?.timepoints?.length === 6) {
                results.push('✅ View A: 6 timepoints present');
                const week0 = curveData.A_predictedLongitudinalOutcomes.timepoints[0];
                results.push(`  - Week 0 anxiety: ${week0.metrics.anxietyScore.value} (${week0.metrics.anxietyScore.confidence})`);
            } else {
                results.push('❌ View A: timepoints missing or incorrect count');
            }

            if (curveData.B_timeSinceBaselineVisit?.milestones?.length === 6) {
                results.push('✅ View B: 6 milestones present');
                const current = getCurrentMilestone(curveData);
                results.push(`  - Current milestone: ${current?.event || 'none'}`);
            } else {
                results.push('❌ View B: milestones missing or incorrect count');
            }

            if (curveData.C_participantBaselineData?.scales?.length === 4) {
                results.push('✅ View C: 4 scales present');
            } else {
                results.push('❌ View C: scales missing or incorrect count');
            }

            if (curveData.D_metricEndpoints?.charts) {
                results.push('✅ View D: charts present');
                results.push(`  - anxietyTrend points: ${curveData.D_metricEndpoints.charts.anxietyTrend.points.length}`);
            } else {
                results.push('❌ View D: charts missing');
            }

            // Test helper functions
            results.push('🔄 Testing helper functions...');
            const quality = getDataQualityStatus(curveData);
            results.push(`✅ getDataQualityStatus(): isGood=${quality.isGood}, warnings=${quality.warnings.length}`);

            const anxietyPreds = getMetricPredictions(curveData, 'anxietyScore');
            results.push(`✅ getMetricPredictions(): ${anxietyPreds.length} predictions`);

            // All tests passed
            const hasErrors = results.some(r => r.startsWith('❌'));
            setTestStatus(hasErrors ? 'failed' : 'passed');
            setTestResults(results);
        }
    }, [curveData, testStatus]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🧪 Digital Twin Curve Hook 测试</h1>

                {/* Control Panel */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">控制面板</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={runTests}
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
                        >
                            {isLoading ? '加载中...' : '运行测试'}
                        </button>
                        <button
                            onClick={refreshCurve}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
                        >
                            刷新曲线
                        </button>
                    </div>

                    {/* Status */}
                    <div className="mt-4">
                        <span className="text-gray-400">状态: </span>
                        <span className={
                            testStatus === 'passed' ? 'text-green-400' :
                                testStatus === 'failed' ? 'text-red-400' :
                                    testStatus === 'testing' ? 'text-yellow-400' :
                                        'text-gray-400'
                        }>
                            {testStatus === 'passed' ? '✅ 测试通过' :
                                testStatus === 'failed' ? '❌ 测试失败' :
                                    testStatus === 'testing' ? '🔄 测试中...' :
                                        '等待运行'}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-900/50 rounded-lg">
                            <span className="text-red-300">错误: {error}</span>
                        </div>
                    )}
                </div>

                {/* Test Results */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">测试结果</h2>
                    <div className="font-mono text-sm space-y-1">
                        {testResults.length > 0 ? (
                            testResults.map((result, i) => (
                                <div key={i} className={
                                    result.startsWith('✅') ? 'text-green-400' :
                                        result.startsWith('❌') ? 'text-red-400' :
                                            result.startsWith('🔄') ? 'text-yellow-400' :
                                                'text-gray-300'
                                }>
                                    {result}
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500">点击 "运行测试" 开始</div>
                        )}
                    </div>
                </div>

                {/* Raw Data Preview */}
                {curveData && (
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">原始数据预览</h2>

                        {/* Meta */}
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-blue-400 mb-2">Meta</h3>
                            <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-xs">
                                {JSON.stringify(curveData.meta, null, 2)}
                            </pre>
                        </div>

                        {/* View A Summary */}
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-green-400 mb-2">View A: 纵向预测 (Week 0 & 15)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded">
                                    <h4 className="text-sm font-medium mb-2">Week 0</h4>
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(curveData.A_predictedLongitudinalOutcomes.timepoints[0].metrics, null, 2)}
                                    </pre>
                                </div>
                                <div className="bg-gray-900 p-4 rounded">
                                    <h4 className="text-sm font-medium mb-2">Week 15 (Target)</h4>
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(curveData.A_predictedLongitudinalOutcomes.timepoints[5].metrics, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* View B Summary */}
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-yellow-400 mb-2">View B: 时间线</h3>
                            <div className="flex flex-wrap gap-2">
                                {curveData.B_timeSinceBaselineVisit.milestones.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`px-3 py-1 rounded text-sm ${m.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                                                m.status === 'current' ? 'bg-blue-900/50 text-blue-300 ring-2 ring-blue-500' :
                                                    'bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        W{m.week}: {m.event}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* View C Summary */}
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-purple-400 mb-2">View C: 基线数据</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {curveData.C_participantBaselineData.scales.map((s, i) => (
                                    <div key={i} className="bg-gray-900 p-3 rounded text-center">
                                        <div className="text-sm font-medium">{s.name}</div>
                                        <div className="text-2xl font-bold">{s.value ?? 'N/A'}</div>
                                        <div className="text-xs text-gray-400">{s.interpretation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* View D Summary */}
                        <div>
                            <h3 className="text-lg font-medium text-orange-400 mb-2">View D: 汇总统计</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-900 p-4 rounded text-center">
                                    <div className="text-sm text-gray-400">Overall Improvement</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {curveData.D_metricEndpoints.summaryStats.overallImprovement.value?.toFixed(1) ?? 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {curveData.D_metricEndpoints.summaryStats.overallImprovement.unit}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-4 rounded text-center">
                                    <div className="text-sm text-gray-400">Days to First Result</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {curveData.D_metricEndpoints.summaryStats.daysToFirstResult.value ?? 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {curveData.D_metricEndpoints.summaryStats.daysToFirstResult.unit}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-4 rounded text-center">
                                    <div className="text-sm text-gray-400">Consistency Score</div>
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {curveData.D_metricEndpoints.summaryStats.consistencyScore.value ?? 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {curveData.D_metricEndpoints.summaryStats.consistencyScore.unit}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
