'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuthProviders } from '@/hooks/domain/useAuthProviders';

/**
 * WeChat QR Code Login Component
 * 
 * Displays a WeChat QR code for users to scan and login.
 * Premium UI matching the app's brutalist design.
 */

interface WeChatQRLoginProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

type LoginState = 'loading' | 'ready' | 'scanning' | 'success' | 'error' | 'expired';

export default function WeChatQRLogin({ onSuccess, onError }: WeChatQRLoginProps) {
    const { loadWeChatQr } = useAuthProviders();
    const [state, setState] = useState<LoginState>('loading');
    const [loginUrl, setLoginUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onErrorRef = useRef(onError);
    const onSuccessRef = useRef(onSuccess);

    useEffect(() => {
        onErrorRef.current = onError;
        onSuccessRef.current = onSuccess;
    }, [onError, onSuccess]);

    useEffect(() => {
        if (state === 'success') {
            onSuccessRef.current?.();
        }
    }, [state]);

    const fetchQRCode = useCallback(async () => {
        setState('loading');
        // setError(null); // Don't clear error here if we want to preserve previous error for specific cases, but usually fine.

        try {
            const data = await loadWeChatQr();

            if (!data?.loginUrl) {
                throw new Error('获取二维码失败');
            }

            setLoginUrl(data.loginUrl);
            setState('ready');

            // QR code expires after 5 minutes
            setTimeout(() => {
                setState((prev) => (prev === 'ready' ? 'expired' : prev));
            }, 5 * 60 * 1000);

        } catch (err) {
            console.error('Failed to fetch WeChat QR:', err);
            const msg = err instanceof Error ? err.message : '网络错误，请重试';
            setError(msg);
            setState('error');
            onErrorRef.current?.(msg);
        }
    }, [loadWeChatQr]); // Stable function from hook

    // Initial fetch on mount
    useEffect(() => {
        fetchQRCode();
    }, [fetchQRCode]);

    const handleRefresh = () => {
        fetchQRCode();
    };

    const openWeChatLogin = () => {
        if (loginUrl) {
            // Open WeChat login in a popup window
            const width = 500;
            const height = 600;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;

            window.open(
                loginUrl,
                'wechat_login',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );

            setState('scanning');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {/* Loading State */}
                {state === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                    >
                        <Loader2 className="w-12 h-12 text-[#1AAD19] animate-spin mb-4" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            正在加载微信登录...
                        </p>
                    </motion.div>
                )}

                {/* Ready State - Show QR Button */}
                {state === 'ready' && (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center"
                    >
                        {/* WeChat Logo */}
                        <div className="w-20 h-20 rounded-2xl bg-[#1AAD19] flex items-center justify-center mb-6 shadow-lg shadow-[#1AAD19]/30">
                            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                            微信扫码登录
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
                            点击下方按钮打开微信扫码页面
                        </p>

                        <button
                            onClick={openWeChatLogin}
                            className="w-full py-4 px-6 rounded-xl bg-[#1AAD19] text-white font-medium text-lg shadow-lg shadow-[#1AAD19]/30 hover:bg-[#0d9f10] transition-all flex items-center justify-center gap-3"
                        >
                            <QrCode className="w-6 h-6" />
                            打开微信扫码
                        </button>

                        <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500 text-center">
                            请使用微信扫描二维码完成登录
                        </p>
                    </motion.div>
                )}

                {/* Scanning State */}
                {state === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <div className="w-16 h-16 rounded-full border-4 border-[#1AAD19]/20 border-t-[#1AAD19] animate-spin mb-6" />
                        <p className="text-neutral-600 dark:text-neutral-300 font-medium mb-2">
                            等待扫码确认...
                        </p>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">
                            请在微信中完成授权
                        </p>
                        <button
                            onClick={() => setState('ready')}
                            className="mt-6 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
                        >
                            重新获取二维码
                        </button>
                    </motion.div>
                )}

                {/* Success State */}
                {state === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#1AAD19]/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10 text-[#1AAD19]" />
                        </div>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                            登录成功
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            正在跳转...
                        </p>
                    </motion.div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                            加载失败
                        </p>
                        <p className="text-sm text-red-500 dark:text-red-400 text-center mb-4">
                            {error}
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            重试
                        </button>
                    </motion.div>
                )}

                {/* Expired State */}
                {state === 'expired' && (
                    <motion.div
                        key="expired"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                            <RefreshCw className="w-10 h-10 text-amber-500" />
                        </div>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                            二维码已过期
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-4">
                            请点击刷新获取新的二维码
                        </p>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1AAD19] text-white font-medium hover:bg-[#0d9f10] transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            刷新二维码
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
