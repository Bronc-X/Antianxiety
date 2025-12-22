'use client';

import { Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

const UnifiedDailyCalibration = lazy(() => import('@/components/UnifiedDailyCalibration'));

function LoadingSpinner() {
    return (
        <div className="h-[500px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
    );
}

export default function DailyCalibrationPage() {
    const router = useRouter();
    const { language, t } = useI18n();
    const isZh = language !== 'en';
    const supabase = createClientComponentClient();

    const [userId, setUserId] = useState<string | undefined>();
    const [userName, setUserName] = useState<string | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, username')
                    .eq('id', user.id)
                    .single();
                setUserName(profile?.first_name || profile?.username);
            }
            setLoading(false);
        }
        loadUser();
    }, [supabase]);

    const handleComplete = () => {
        // Navigate back to home after completion
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FEFCF8] to-[#F8F4ED] dark:from-[#1A1A1A] dark:to-[#0D0D0D]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#FEFCF8]/80 dark:bg-[#1A1A1A]/80 backdrop-blur-lg border-b border-[#E7E1D6]/30">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <motion.button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-[#E7E1D6]/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A1A] dark:text-white" />
                    </motion.button>
                    <div>
                        <h1 className="font-heading text-xl text-[#1A1A1A] dark:text-white">
                            {isZh ? '每日校准' : 'Daily Calibration'}
                        </h1>
                        <p className="text-xs text-[#6B6B6B] dark:text-[#A0A0A0]">
                            {isZh ? '记录今日身心状态' : 'Track your daily wellness'}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {loading ? (
                        <LoadingSpinner />
                    ) : userId ? (
                        <Suspense fallback={<LoadingSpinner />}>
                            <UnifiedDailyCalibration
                                userId={userId}
                                userName={userName}
                                onComplete={handleComplete}
                            />
                        </Suspense>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-[#6B6B6B]">{isZh ? '请先登录' : 'Please log in first'}</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
