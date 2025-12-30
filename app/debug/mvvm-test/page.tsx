'use client';

/**
 * MVVM 功能测试页面
 * 
 * 专门用于测试所有 Domain Hooks (The Bridge) 功能完整性
 * 不受任何路由跳转逻辑干扰
 */

import { useState } from 'react';
import { usePlans } from '@/hooks/domain/usePlans';
import { useGoals } from '@/hooks/domain/useGoals';
import { useCalibration } from '@/hooks/domain/useCalibration';
import { useSettings } from '@/hooks/domain/useSettings';
import { useMax } from '@/hooks/domain/useMax';
import { useFeed } from '@/hooks/domain/useFeed';
import { useProfile } from '@/hooks/domain/useProfile';
import { useOnboarding } from '@/hooks/domain/useOnboarding';
import { useAssessment } from '@/hooks/domain/useAssessment';
import { useAnalysis } from '@/hooks/domain/useAnalysis';
import { useDashboard } from '@/hooks/domain/useDashboard';

export default function MVVMTestPage() {
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'plans', label: 'Plans' },
        { id: 'goals', label: 'Goals' },
        { id: 'calibration', label: 'Calibration' },
        { id: 'settings', label: 'Settings' },
        { id: 'max', label: 'Max (Chat)' },
        { id: 'feed', label: 'Feed' },
        { id: 'profile', label: 'Profile' },
        { id: 'onboarding', label: 'Onboarding' },
        { id: 'assessment', label: 'Assessment' },
        { id: 'analysis', label: 'Analysis' },
    ];

    return (
        <div style={{ padding: 20, fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
            <h1 style={{ color: '#10b981', marginBottom: 20 }}>🧪 MVVM 功能测试面板</h1>
            <p style={{ color: '#888', marginBottom: 20 }}>测试所有 Domain Hooks，不受路由跳转干扰</p>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === tab.id ? '#10b981' : '#1f1f1f',
                            color: activeTab === tab.id ? '#000' : '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Panels */}
            <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
                {activeTab === 'dashboard' && <DashboardTest />}
                {activeTab === 'plans' && <PlansTest />}
                {activeTab === 'goals' && <GoalsTest />}
                {activeTab === 'calibration' && <CalibrationTest />}
                {activeTab === 'settings' && <SettingsTest />}
                {activeTab === 'max' && <MaxTest />}
                {activeTab === 'feed' && <FeedTest />}
                {activeTab === 'profile' && <ProfileTest />}
                {activeTab === 'onboarding' && <OnboardingTest />}
                {activeTab === 'assessment' && <AssessmentTest />}
                {activeTab === 'analysis' && <AnalysisTest />}
            </div>
        </div>
    );
}

// ============================================
// Dashboard Test
// ============================================
function DashboardTest() {
    const { data, isLoading, error, refresh } = useDashboard();

    return (
        <div>
            <h2>📊 Dashboard</h2>
            <StatusBadge loading={isLoading} error={error} />
            <ActionButton onClick={refresh} label="Refresh" />
            <DataDisplay data={data} />
        </div>
    );
}

// ============================================
// Plans Test
// ============================================
function PlansTest() {
    const { plans, activePlans, completedPlans, isLoading, error, create, complete, remove, refresh } = usePlans();

    const handleCreate = async () => {
        const success = await create({
            name: `测试计划 ${Date.now()}`,
            category: 'exercise',
            description: '这是一个测试计划',
        });
        alert(success ? '创建成功!' : '创建失败');
    };

    return (
        <div>
            <h2>📋 Plans</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleCreate} label="+ 创建测试计划" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>总数: {plans.length} | 活跃: {activePlans.length} | 已完成: {completedPlans.length}</p>
            <DataDisplay data={plans.slice(0, 5)} />
            {plans.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <ActionButton
                        onClick={() => complete(plans[0].id)}
                        label={`完成第一个: ${plans[0].name}`}
                    />
                    <ActionButton
                        onClick={() => remove(plans[0].id)}
                        label={`删除第一个: ${plans[0].name}`}
                        danger
                    />
                </div>
            )}
        </div>
    );
}

// ============================================
// Goals Test
// ============================================
function GoalsTest() {
    const { goals, activeGoals, completedGoals, isLoading, error, create, toggle, remove, refresh } = useGoals();

    const handleCreate = async () => {
        const success = await create({
            goal_text: `测试目标 ${Date.now()}`,
            category: 'sleep', // Must be one of: sleep, energy, weight, stress, fitness
            priority: 'high',
        });
        alert(success ? '创建成功!' : '创建失败');
    };

    return (
        <div>
            <h2>🎯 Goals</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleCreate} label="+ 创建测试目标" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>总数: {goals.length} | 进行中: {activeGoals.length} | 已完成: {completedGoals.length}</p>
            <DataDisplay data={goals.slice(0, 5)} />
            {goals.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <ActionButton
                        onClick={() => toggle(goals[0].id)}
                        label={`切换状态: ${goals[0].goal_text}`}
                    />
                    <ActionButton
                        onClick={() => remove(goals[0].id)}
                        label={`删除: ${goals[0].goal_text}`}
                        danger
                    />
                </div>
            )}
        </div>
    );
}

// ============================================
// Calibration Test
// ============================================
function CalibrationTest() {
    const { today, history, isLoading, error, save, refresh } = useCalibration();

    const handleSave = async () => {
        const success = await save({
            sleep_duration_minutes: 420,
            sleep_quality: 4,
            mood_status: 'good',
            energy_level: 7,
            stress_level: 3,
        });
        alert(success ? '保存成功!' : '保存失败');
    };

    return (
        <div>
            <h2>📅 Daily Calibration</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleSave} label="保存今日校准" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <h3>今日数据:</h3>
            <DataDisplay data={today} />
            <h3>历史记录 ({history.length} 天):</h3>
            <DataDisplay data={history.slice(0, 3)} />
        </div>
    );
}

// ============================================
// Settings Test
// ============================================
function SettingsTest() {
    const { settings, isLoading, error, update, refresh } = useSettings();

    const handleUpdate = async () => {
        const success = await update({
            max_honesty: 85,
            max_humor: 70,
            ai_personality: 'max',
        });
        alert(success ? '更新成功!' : '更新失败');
    };

    return (
        <div>
            <h2>⚙️ Settings</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleUpdate} label="更新设置" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <DataDisplay data={settings} />
        </div>
    );
}

// ============================================
// Max (Chat) Test
// ============================================
function MaxTest() {
    const {
        conversations,
        messages,
        currentConversationId,
        isLoading,
        isSending,
        error,
        newConversation,
        switchConversation,
        deleteChat,
        refresh
    } = useMax();

    const handleCreateConversation = async () => {
        const conversationId = await newConversation();
        alert(conversationId ? `创建成功! ID: ${String(conversationId).slice(0, 8)}...` : '创建失败');
    };

    const handleSwitchConversation = async () => {
        if (conversations.length > 0) {
            await switchConversation(conversations[0].id);
            alert('已切换到第一个对话');
        } else {
            alert('没有可切换的对话');
        }
    };

    return (
        <div>
            <h2>💬 Max (AI Chat)</h2>
            <StatusBadge loading={isLoading || isSending} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleCreateConversation} label="+ 新建对话" />
                <ActionButton onClick={handleSwitchConversation} label="切换到第一个对话" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>对话数: {conversations?.length || 0} | 当前对话ID: {currentConversationId ? String(currentConversationId).slice(0, 8) : '无'} | 消息数: {messages?.length || 0}</p>
            <h3>对话列表:</h3>
            <DataDisplay data={conversations?.slice(0, 3) || []} />
            <h3>当前对话消息:</h3>
            <DataDisplay data={messages?.slice(-3) || []} />
        </div>
    );
}


// ============================================
// Feed Test
// ============================================
function FeedTest() {
    const { items, savedItems, isLoading, error, markRead, toggleSave, refresh } = useFeed();

    return (
        <div>
            <h2>📰 Feed</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>Feed 条目: {items.length} | 已收藏: {savedItems.length}</p>
            <DataDisplay data={items.slice(0, 3)} />
            {items.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <ActionButton
                        onClick={() => markRead(items[0].id)}
                        label="标记第一条为已读"
                    />
                    <ActionButton
                        onClick={() => toggleSave(items[0].id)}
                        label="收藏/取消收藏第一条"
                    />
                </div>
            )}
        </div>
    );
}

// ============================================
// Profile Test
// ============================================
function ProfileTest() {
    const { profile, isLoading, error, update, refresh } = useProfile();

    const handleUpdate = async () => {
        const success = await update({
            first_name: 'Test',
            primary_goal: 'improve_sleep',
        });
        alert(success ? '更新成功!' : '更新失败');
    };

    return (
        <div>
            <h2>👤 Profile</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleUpdate} label="更新档案" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <DataDisplay data={profile} />
        </div>
    );
}

// ============================================
// Onboarding Test
// ============================================
function OnboardingTest() {
    const { progress, isLoading, error, saveStep, skip, reset, refresh } = useOnboarding();

    const handleSaveStep = async () => {
        const success = await saveStep(progress.current_step, {
            first_name: 'Test User',
            primary_goal: 'boost_energy',
        });
        alert(success ? '步骤保存成功!' : '保存失败');
    };

    return (
        <div>
            <h2>🚀 Onboarding</h2>
            <StatusBadge loading={isLoading} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleSaveStep} label="保存当前步骤" />
                <ActionButton onClick={skip} label="跳过" />
                <ActionButton onClick={reset} label="重置" danger />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>当前步骤: {progress.current_step} / {progress.total_steps} | 已完成: {progress.is_complete ? '是' : '否'}</p>
            <DataDisplay data={progress} />
        </div>
    );
}

// ============================================
// Assessment Test
// ============================================
function AssessmentTest() {
    const { types, questions, history, isLoading, isSubmitting, error, startAssessment, loadHistory, reset } = useAssessment();

    const handleLoadQuestions = async () => {
        if (types.length > 0) {
            await startAssessment(types[0].id);
        } else {
            alert('没有可用的评估类型');
        }
    };

    const handleLoadHistory = async () => {
        await loadHistory();
    };

    return (
        <div>
            <h2>📝 Assessment</h2>
            <StatusBadge loading={isLoading || isSubmitting} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleLoadQuestions} label="开始第一个量表" />
                <ActionButton onClick={handleLoadHistory} label="加载历史" />
                <ActionButton onClick={reset} label="重置" danger />
            </div>
            <p>评估类型: {types?.length || 0} | 问题数: {questions?.length || 0} | 历史结果: {history?.length || 0}</p>
            <h3>评估类型:</h3>
            <DataDisplay data={types || []} />
            <h3>当前问题:</h3>
            <DataDisplay data={questions?.slice(0, 2) || []} />
            <h3>历史结果:</h3>
            <DataDisplay data={history?.slice(0, 3) || []} />
        </div>
    );
}

// ============================================
// Analysis Test
// ============================================
function AnalysisTest() {
    const { latestReport, trends, history, isLoading, isGenerating, error, generate, refresh, loadTrends, loadHistory } = useAnalysis();

    const handleGenerate = async () => {
        const success = await generate('weekly');
        alert(success ? '生成成功!' : '生成失败');
    };

    return (
        <div>
            <h2>📈 Analysis</h2>
            <StatusBadge loading={isLoading || isGenerating} error={error} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ActionButton onClick={handleGenerate} label="生成周报告" />
                <ActionButton onClick={() => loadTrends(30)} label="加载趋势" />
                <ActionButton onClick={loadHistory} label="加载历史" />
                <ActionButton onClick={refresh} label="刷新" />
            </div>
            <p>趋势数据点: {trends?.length || 0} | 历史报告: {history?.length || 0}</p>
            <h3>最新报告:</h3>
            <DataDisplay data={latestReport} />
            <h3>趋势数据 (前3条):</h3>
            <DataDisplay data={trends?.slice(0, 3) || []} />
        </div>
    );
}

// ============================================
// Utility Components
// ============================================

function StatusBadge({ loading, error }: { loading: boolean; error: string | null }) {
    return (
        <div style={{ marginBottom: 16 }}>
            {loading && <span style={{ background: '#3b82f6', padding: '4px 8px', borderRadius: 4 }}>⏳ Loading...</span>}
            {error && <span style={{ background: '#ef4444', padding: '4px 8px', borderRadius: 4 }}>❌ {error}</span>}
            {!loading && !error && <span style={{ background: '#10b981', padding: '4px 8px', borderRadius: 4 }}>✅ Ready</span>}
        </div>
    );
}

function ActionButton({ onClick, label, danger }: { onClick: () => void; label: string; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px',
                background: danger ? '#dc2626' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                marginRight: 8,
                marginBottom: 8,
            }}
        >
            {label}
        </button>
    );
}

function DataDisplay({ data }: { data: unknown }) {
    return (
        <pre style={{
            background: '#1a1a1a',
            padding: 12,
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 300,
            fontSize: 12,
            color: '#10b981',
        }}>
            {JSON.stringify(data, null, 2) || 'null'}
        </pre>
    );
}
