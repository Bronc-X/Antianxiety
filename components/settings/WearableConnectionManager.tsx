'use client';

/**
 * Wearable Connection Manager
 * 穿戴设备连接管理组件
 */

import React, { useEffect, useState } from 'react';
import { syncHealthConnectData, syncHealthKitData, type SyncErrorCode } from '@/lib/services/wearables/client-sync';
import { useWearables } from '@/hooks/domain/useWearables';

interface ConnectedDevice {
    provider: string;
    device_name?: string;
    last_sync_at?: string;
    expires_at?: string;
}

interface SyncLog {
    id: string;
    provider: string;
    status: string;
    records_synced: number;
    synced_at: string;
    error_message?: string;
}

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string; guide: string }> = {
    healthkit: {
        name: 'HealthKit',
        icon: '⌚',
        color: '#FF2D55',
        guide: '请在 iOS App 中授权 HealthKit，同步 HRV 与睡眠数据。',
    },
    health_connect: {
        name: 'Health Connect',
        icon: '🏃',
        color: '#4285F4',
        guide: '请在 Android App 中授权 Health Connect，同步健康数据。',
    },
};

export default function WearableConnectionManager() {
    const {
        loadStatus: loadWearableStatus,
        sync: syncWearables,
        disconnect,
        isDisconnecting,
        error: wearablesError,
    } = useWearables();
    const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
    const [recentSyncs, setRecentSyncs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guideProvider, setGuideProvider] = useState<string | null>(null);
    const combinedError = error || wearablesError;

    // 加载连接状态
    useEffect(() => {
        loadStatus();

        // 检查URL参数
        const params = new URLSearchParams(window.location.search);
        const connected = params.get('wearable_connected');
        const wearableError = params.get('wearable_error');

        if (connected) {
            // 显示成功提示
            setError(null);
            loadStatus();
            // 清理URL参数
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (wearableError) {
            setError(decodeURIComponent(wearableError));
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    async function loadStatus() {
        try {
            setLoading(true);
            const data = await loadWearableStatus();
            if (data) {
                setConnectedDevices(data.connectedDevices || []);
                setRecentSyncs(data.recentSyncs || []);
            }
        } catch (err) {
            console.error('Failed to load wearable status:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleConnect(provider: string) {
        setGuideProvider(prev => prev === provider ? null : provider);
    }

    async function handleDisconnect(provider: string) {
        if (!confirm(`确定要断开 ${PROVIDER_INFO[provider]?.name || provider} 连接吗？`)) {
            return;
        }

        try {
            const success = await disconnect(provider);
            if (!success) {
                setError('断开失败，请稍后重试');
                return;
            }
            await loadStatus();
        } catch (err) {
            console.error('Failed to disconnect:', err);
        }
    }

    function getSyncErrorMessage(code?: SyncErrorCode) {
        switch (code) {
            case 'permission':
                return '权限被拒绝，请在系统健康应用中开启访问权限';
            case 'unavailable':
                return '当前设备暂不可用健康数据同步';
            case 'no_data':
                return '未发现可同步的近期健康数据';
            default:
                return '同步失败，请稍后重试';
        }
    }

    async function handleSync(provider?: string) {
        try {
            setSyncingProvider(provider || 'all');
            setError(null);

            if (provider === 'healthkit') {
                const result = await syncHealthKitData();
                if (!result.success) {
                    setError(getSyncErrorMessage(result.error));
                    return;
                }
            } else if (provider === 'health_connect') {
                const result = await syncHealthConnectData();
                if (!result.success) {
                    setError(getSyncErrorMessage(result.error));
                    return;
                }
            } else {
                const synced = await syncWearables({ provider, daysBack: 7 });
                if (!synced) {
                    throw new Error('Sync failed');
                }
            }

            await loadStatus();
        } catch (err) {
            setError('同步失败，请稍后重试');
        } finally {
            setSyncingProvider(null);
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function isConnected(provider: string) {
        return connectedDevices.some(d => d.provider === provider);
    }

    if (loading) {
        return (
            <div className="wearable-manager">
                <div className="loading animate-pulse">加载中...</div>
            </div>
        );
    }

    return (
        <div className="wearable-manager">
            <h3 className="section-title">🔗 穿戴设备连接</h3>
            <p className="section-subtitle">仅支持 HealthKit 与 Health Connect（OS-hub 策略）。</p>

            {combinedError && (
                <div className="error-banner">
                    ⚠️ {combinedError}
                </div>
            )}

            {/* 可用设备列表 */}
            <div className="device-grid">
                {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
                    const connected = isConnected(provider);
                    const device = connectedDevices.find(d => d.provider === provider);

                    return (
                        <div
                            key={provider}
                            className={`device-card ${connected ? 'connected' : ''}`}
                            style={{ '--accent-color': info.color } as React.CSSProperties}
                        >
                            <div className="device-icon">{info.icon}</div>
                            <div className="device-info">
                                <div className="device-name">{info.name}</div>
                                {connected && device?.last_sync_at && (
                                    <div className="last-sync">
                                        上次同步: {formatDate(device.last_sync_at)}
                                    </div>
                                )}
                            </div>
                            <div className="device-actions">
                                {connected ? (
                                    <>
                                        <button
                                            className="btn-sync"
                                            onClick={() => handleSync(provider)}
                                            disabled={syncingProvider !== null}
                                        >
                                            {syncingProvider ? '同步中...' : '同步'}
                                        </button>
                                        <button
                                            className="btn-disconnect"
                                            onClick={() => handleDisconnect(provider)}
                                            disabled={isDisconnecting}
                                        >
                                            断开
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn-connect"
                                        onClick={() => handleConnect(provider)}
                                    >
                                        {guideProvider === provider ? '关闭说明' : '查看说明'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {guideProvider && (
                <div className="device-guide">
                    {PROVIDER_INFO[guideProvider]?.guide}
                </div>
            )}

            {/* 同步历史 */}
            {recentSyncs.length > 0 && (
                <div className="sync-history">
                    <h4>最近同步记录</h4>
                    <div className="sync-list">
                        {recentSyncs.slice(0, 5).map(sync => (
                            <div key={sync.id} className={`sync-item ${sync.status}`}>
                                <span className="sync-provider">
                                    {PROVIDER_INFO[sync.provider]?.icon} {PROVIDER_INFO[sync.provider]?.name}
                                </span>
                                <span className="sync-status">
                                    {sync.status === 'success' ? '✓' : sync.status === 'failed' ? '✗' : '⏳'}
                                    {sync.records_synced > 0 && ` ${sync.records_synced}条`}
                                </span>
                                <span className="sync-time">{formatDate(sync.synced_at)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {combinedError && (
                <div className="error-banner">
                    ⚠️ {combinedError}
                </div>
            )}

            <style jsx>{`
        .wearable-manager {
          padding: 1.5rem;
          background: var(--card-bg, #fff);
          border-radius: 1rem;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .section-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
        }
        
        .error-banner {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .device-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }
        
        .device-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface-bg, #f9fafb);
          border: 2px solid transparent;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }
        
        .device-card.connected {
          border-color: var(--accent-color);
          background: color-mix(in srgb, var(--accent-color) 5%, white);
        }
        
        .device-icon {
          font-size: 2rem;
        }
        
        .device-info {
          flex: 1;
        }
        
        .device-name {
          font-weight: 600;
        }
        
        .last-sync {
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .device-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-connect, .btn-sync, .btn-disconnect {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-connect {
          background: var(--accent-color, #10b981);
          color: white;
        }
        
        .btn-sync {
          background: #e5e7eb;
          color: #374151;
        }
        
        .btn-disconnect {
          background: transparent;
          color: #dc2626;
        }
        
        .btn-connect:hover, .btn-sync:hover {
          opacity: 0.9;
        }
        
        .btn-disconnect:hover {
          background: #fee2e2;
        }

        .device-guide {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          background: #f9fafb;
          color: #374151;
          font-size: 0.875rem;
          border: 1px dashed #e5e7eb;
        }
        
        .sync-history {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .sync-history h4 {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }
        
        .sync-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .sync-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
        }
        
        .sync-item.success {
          color: #059669;
        }
        
        .sync-item.failed {
          color: #dc2626;
        }
        
        .sync-provider {
          flex: 1;
        }
        
        .sync-time {
          color: #9ca3af;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      `}</style>
        </div>
    );
}
