/**
 * Oura Ring API Connector
 * Oura V2 API集成
 * 
 * API文档: https://cloud.ouraring.com/docs/api
 */

import type {
    WearableConnector,
    WearableProvider,
    HealthDataType,
    NormalizedHealthData,
    TokenExchangeResult,
    OuraSleepData,
    OuraReadinessData,
} from '@/types/wearable';
import { normalizeOuraSleep, normalizeOuraReadiness } from './data-normalizer';

const OURA_API_BASE = 'https://api.ouraring.com/v2';
const OURA_AUTH_BASE = 'https://cloud.ouraring.com/oauth';

export class OuraConnector implements WearableConnector {
    provider: WearableProvider = 'oura';

    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.OURA_CLIENT_ID || '';
        this.clientSecret = process.env.OURA_CLIENT_SECRET || '';
        this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/callback/oura`;

        if (!this.clientId || !this.clientSecret) {
            console.warn('Oura API credentials not configured');
        }
    }

    // ============================================================================
    // OAuth流程
    // ============================================================================

    getAuthUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: 'daily sleep readiness',
            redirect_uri: this.redirectUri,
        });

        if (state) {
            params.set('state', state);
        }

        return `${OURA_AUTH_BASE}/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<TokenExchangeResult> {
        const response = await fetch(`${OURA_AUTH_BASE}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Oura token exchange failed: ${error}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type,
        };
    }

    async refreshToken(refreshToken: string): Promise<TokenExchangeResult> {
        const response = await fetch(`${OURA_AUTH_BASE}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Oura token refresh failed: ${error}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    }

    // ============================================================================
    // 数据获取
    // ============================================================================

    async fetchData(
        accessToken: string,
        startDate: Date,
        endDate: Date,
        dataTypes: HealthDataType[] = ['sleep', 'readiness']
    ): Promise<NormalizedHealthData[]> {
        const results: NormalizedHealthData[] = [];

        const fetchPromises: Promise<void>[] = [];

        if (dataTypes.includes('sleep')) {
            fetchPromises.push(
                this.fetchSleepData(accessToken, startDate, endDate)
                    .then(data => results.push(...data))
                    .catch(err => console.error('Oura sleep fetch error:', err))
            );
        }

        if (dataTypes.includes('readiness')) {
            fetchPromises.push(
                this.fetchReadinessData(accessToken, startDate, endDate)
                    .then(data => results.push(...data))
                    .catch(err => console.error('Oura readiness fetch error:', err))
            );
        }

        await Promise.all(fetchPromises);

        return results;
    }

    private async fetchSleepData(
        accessToken: string,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const response = await this.apiRequest(
            accessToken,
            `/usercollection/daily_sleep?start_date=${this.formatDate(startDate)}&end_date=${this.formatDate(endDate)}`
        );

        const sleepData: OuraSleepData[] = response.data || [];

        return sleepData.map(normalizeOuraSleep);
    }

    private async fetchReadinessData(
        accessToken: string,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const response = await this.apiRequest(
            accessToken,
            `/usercollection/daily_readiness?start_date=${this.formatDate(startDate)}&end_date=${this.formatDate(endDate)}`
        );

        const readinessData: OuraReadinessData[] = response.data || [];

        return readinessData.map(normalizeOuraReadiness);
    }

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            await this.apiRequest(accessToken, '/usercollection/personal_info');
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================================
    // 辅助方法
    // ============================================================================

    private async apiRequest(accessToken: string, endpoint: string): Promise<{ data: unknown[] }> {
        const response = await fetch(`${OURA_API_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('OURA_TOKEN_EXPIRED');
            }
            throw new Error(`Oura API error: ${response.status}`);
        }

        return response.json();
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

// 导出单例
export const ouraConnector = new OuraConnector();
