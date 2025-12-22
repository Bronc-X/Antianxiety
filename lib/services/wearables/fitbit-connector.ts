/**
 * Fitbit API Connector
 * Fitbit Web API集成
 * 
 * API文档: https://dev.fitbit.com/build/reference/web-api/
 */

import type {
    WearableConnector,
    WearableProvider,
    HealthDataType,
    NormalizedHealthData,
    TokenExchangeResult,
    FitbitSleepData,
    FitbitHRVData,
} from '@/types/wearable';
import { normalizeFitbitSleep, normalizeFitbitHRV } from './data-normalizer';

const FITBIT_API_BASE = 'https://api.fitbit.com';
const FITBIT_AUTH_BASE = 'https://www.fitbit.com/oauth2';

export class FitbitConnector implements WearableConnector {
    provider: WearableProvider = 'fitbit';

    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.FITBIT_CLIENT_ID || '';
        this.clientSecret = process.env.FITBIT_CLIENT_SECRET || '';
        this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/callback/fitbit`;

        if (!this.clientId || !this.clientSecret) {
            console.warn('Fitbit API credentials not configured');
        }
    }

    // ============================================================================
    // OAuth流程
    // ============================================================================

    getAuthUrl(state?: string): string {
        const scopes = ['sleep', 'heartrate', 'activity', 'profile'].join(' ');
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: scopes,
            redirect_uri: this.redirectUri,
        });

        if (state) {
            params.set('state', state);
        }

        return `${FITBIT_AUTH_BASE}/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string): Promise<TokenExchangeResult> {
        const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.redirectUri,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Fitbit token exchange failed: ${error}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope?.split(' '),
            tokenType: data.token_type,
        };
    }

    async refreshToken(refreshToken: string): Promise<TokenExchangeResult> {
        const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Fitbit token refresh failed: ${error}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
            scope: data.scope?.split(' '),
        };
    }

    // ============================================================================
    // 数据获取
    // ============================================================================

    async fetchData(
        accessToken: string,
        startDate: Date,
        endDate: Date,
        dataTypes: HealthDataType[] = ['sleep', 'hrv']
    ): Promise<NormalizedHealthData[]> {
        const results: NormalizedHealthData[] = [];

        const fetchPromises: Promise<void>[] = [];

        if (dataTypes.includes('sleep')) {
            fetchPromises.push(
                this.fetchSleepData(accessToken, startDate, endDate)
                    .then(data => results.push(...data))
                    .catch(err => console.error('Fitbit sleep fetch error:', err))
            );
        }

        if (dataTypes.includes('hrv')) {
            fetchPromises.push(
                this.fetchHRVData(accessToken, startDate, endDate)
                    .then(data => results.push(...data))
                    .catch(err => console.error('Fitbit HRV fetch error:', err))
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
        const startStr = this.formatDate(startDate);
        const endStr = this.formatDate(endDate);

        const response = await this.apiRequest(
            accessToken,
            `/1.2/user/-/sleep/date/${startStr}/${endStr}.json`
        );

        const sleepLogs: FitbitSleepData[] = response.sleep || [];

        return sleepLogs.map(normalizeFitbitSleep);
    }

    private async fetchHRVData(
        accessToken: string,
        startDate: Date,
        endDate: Date
    ): Promise<NormalizedHealthData[]> {
        const startStr = this.formatDate(startDate);
        const endStr = this.formatDate(endDate);

        const response = await this.apiRequest(
            accessToken,
            `/1/user/-/hrv/date/${startStr}/${endStr}.json`
        );

        const hrvData: FitbitHRVData[] = response.hrv || [];

        return hrvData.map(normalizeFitbitHRV);
    }

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            await this.apiRequest(accessToken, '/1/user/-/profile.json');
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================================
    // 辅助方法
    // ============================================================================

    private async apiRequest(accessToken: string, endpoint: string): Promise<unknown> {
        const response = await fetch(`${FITBIT_API_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('FITBIT_TOKEN_EXPIRED');
            }
            throw new Error(`Fitbit API error: ${response.status}`);
        }

        return response.json();
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

// 导出单例
export const fitbitConnector = new FitbitConnector();
