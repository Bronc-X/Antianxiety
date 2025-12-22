'use client';

/**
 * Wearable Connection Manager
 * 穿戴设备连接管理组件
 */

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string }> = {
    fitbit: {
        name: 'Fitbit',
        icon: '⌚',
        color: '#00B0B9',
    },
    oura: {
        name: 'Oura Ring',
        icon: '💍',
        color: '#1A1A2E',
    },
    healthkit: {
        name: 'Apple Watch',
        icon: '⌚',
        color: '#FF2D55',
    },
    health_connect: {
        name: 'Health Connect',
        icon: '🏃',
        color: '#4285F4',
    },
};

export default function WearableConnectionManager() {
    const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
    const [recentSyncs, setRecentSyncs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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
            const response = await fetch('/api/wearables/sync');

            if (response.ok) {
                const data = await response.json();
                setConnectedDevices(data.connectedDevices || []);
                setRecentSyncs(data.recentSyncs || []);
            }
        } catch (err) {
            console.error('Failed to load wearable status:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleConnect(provider: string) {
        window.location.href = `/api/wearables/connect/${provider}`;
    }

    async function handleDisconnect(provider: string) {
        if (!confirm(`确定要断开 ${PROVIDER_INFO[provider]?.name || provider} 连接吗？`)) {
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('wearable_tokens')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', provider);

            loadStatus();
        } catch (err) {
            console.error('Failed to disconnect:', err);
        }
    }

    async function handleSync(provider?: string) {
        try {
            setSyncing(true);
            setError(null);

            const response = await fetch('/api/wearables/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, daysBack: 7 }),
            });

            if (!response.ok) {
                throw new Error('Sync failed');
            }

            await loadStatus();
        } catch (err) {
            setError('同步失败，请稍后重试');
        } finally {
            setSyncing(false);
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
                <div className="loading">加载中...</div>
            </div>
        );
    }

    return (
        <div className="wearable-manager">
            <h3 className="section-title">🔗 穿戴设备连接</h3>

            {error && (
                <div className="error-banner">
                    ⚠️ {error}
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
                                            disabled={syncing}
                                        >
                                            {syncing ? '同步中...' : '同步'}
                                        </button>
                                        <button
                                            className="btn-disconnect"
                                            onClick={() => handleDisconnect(provider)}
                                        >
                                            断开
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn-connect"
                                        onClick={() => handleConnect(provider)}
                                    >
                                        连接
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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
