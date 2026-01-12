/**
 * Wearable Device Integration Types
 * 智能穿戴设备集成类型定义
 */

// ============================================================================
// 核心类型
// ============================================================================

export type WearableProvider = 'fitbit' | 'oura' | 'health_connect' | 'healthkit';

export type HealthDataType =
    | 'sleep'
    | 'sleep_score'
    | 'deep_sleep_minutes'
    | 'rem_sleep_minutes'
    | 'light_sleep_minutes'
    | 'hrv'
    | 'resting_heart_rate'
    | 'activity'
    | 'steps'
    | 'active_calories'
    | 'heart_rate'
    | 'stress'
    | 'readiness'
    | 'spo2'
    | 'temperature';

export type DataQuality = 'excellent' | 'good' | 'fair' | 'poor';

export type SyncStatus = 'started' | 'success' | 'failed' | 'partial';

// ============================================================================
// 数据库模型（对应Supabase表结构）
// ============================================================================

export interface WearableToken {
    id: string;
    user_id: string;
    provider: WearableProvider;
    access_token: string;
    refresh_token?: string;
    expires_at?: string; // ISO datetime
    scope?: string[];
    device_name?: string;
    last_sync_at?: string;
    created_at: string;
    updated_at: string;
}

export interface WearableSyncLog {
    id: string;
    user_id: string;
    provider: WearableProvider;
    sync_type: 'full' | 'incremental';
    status: SyncStatus;
    records_synced: number;
    data_types?: HealthDataType[];
    date_range_start?: string;
    date_range_end?: string;
    error_message?: string;
    duration_ms?: number;
    synced_at: string;
}

export interface UserHealthData {
    id: string;
    user_id: string;
    source: WearableProvider | 'manual';
    data_type: HealthDataType;
    recorded_at: string;
    value?: number;
    score?: number;
    quality?: DataQuality;
    metadata?: Record<string, unknown>;
    raw_data?: Record<string, unknown>;
    created_at: string;
}

// ============================================================================
// 归一化数据接口（用于连接器）
// ============================================================================

export interface NormalizedHealthData {
    source: WearableProvider;
    dataType: HealthDataType;
    recordedAt: Date;
    value?: number;
    score?: number;
    quality?: DataQuality;
    metadata?: Record<string, unknown>;
    rawData?: Record<string, unknown>;
}

// ============================================================================
// 连接器接口
// ============================================================================

export interface WearableConnector {
    provider: WearableProvider;

    /** 获取OAuth授权URL */
    getAuthUrl(state?: string, redirectUri?: string): string;

    /** 用授权码换取令牌 */
    exchangeCode(code: string, redirectUri?: string): Promise<TokenExchangeResult>;

    /** 刷新访问令牌 */
    refreshToken(refreshToken: string): Promise<TokenExchangeResult>;

    /** 获取健康数据 */
    fetchData(
        accessToken: string,
        startDate: Date,
        endDate: Date,
        dataTypes?: HealthDataType[]
    ): Promise<NormalizedHealthData[]>;

    /** 验证令牌是否有效 */
    validateToken?(accessToken: string): Promise<boolean>;
}

export interface TokenExchangeResult {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number; // seconds
    scope?: string[];
    tokenType?: string;
}

// ============================================================================
// API响应类型
// ============================================================================

export interface WearableConnectionStatus {
    provider: WearableProvider;
    connected: boolean;
    deviceName?: string;
    lastSyncAt?: string;
    expiresAt?: string;
}

export interface SyncResult {
    success: boolean;
    provider: WearableProvider;
    recordsSynced: number;
    dataTypes: HealthDataType[];
    errors?: string[];
    durationMs: number;
}

// ============================================================================
// 特定设备原始数据类型（用于类型安全的归一化）
// ============================================================================

// Fitbit 类型
export interface FitbitSleepData {
    dateOfSleep: string;
    duration: number; // milliseconds
    efficiency: number;
    minutesAsleep: number;
    minutesAwake: number;
    startTime: string;
    endTime: string;
    levels: {
        summary: {
            deep: { count: number; minutes: number };
            light: { count: number; minutes: number };
            rem: { count: number; minutes: number };
            wake: { count: number; minutes: number };
        };
    };
}

export interface FitbitHRVData {
    dateTime: string;
    value: {
        dailyRmssd: number;
        deepRmssd: number;
    };
}

// Oura 类型
export interface OuraSleepData {
    id: string;
    day: string;
    score: number;
    contributors: {
        deep_sleep: number;
        efficiency: number;
        latency: number;
        rem_sleep: number;
        restfulness: number;
        timing: number;
        total_sleep: number;
    };
    total_sleep_duration: number; // seconds
    rem_sleep_duration: number;
    deep_sleep_duration: number;
    light_sleep_duration: number;
}

export interface OuraReadinessData {
    id: string;
    day: string;
    score: number;
    contributors: {
        activity_balance: number;
        body_temperature: number;
        hrv_balance: number;
        previous_day_activity: number;
        previous_night: number;
        recovery_index: number;
        resting_heart_rate: number;
        sleep_balance: number;
    };
}

// ============================================================================
// 贝叶斯证据集成类型
// ============================================================================

export interface WearableEvidence {
    type: 'wearable';
    source: `${WearableProvider}:${HealthDataType}`;
    weight: number; // 0.1 - 0.9
    value: number;
    timestamp: Date;
    confidence: number; // 数据置信度
}

export interface WearableEvidenceConfig {
    dataType: HealthDataType;
    baseWeight: number;
    thresholds: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
    };
    anxietyImpact: 'positive' | 'negative' | 'neutral';
}
