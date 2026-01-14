'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';
import {
    FeedbackLoop,
    WearableConnect,
    HRVDashboard,
    PlanDashboard,
    ScienceFeed,
    DailyCalibration,
    UnlearnFooter,
    MaxFloatingButton,
    ParticipantDigitalTwin,
} from '@/components/unlearn';
import ProactiveInquiryManager from '@/components/max/ProactiveInquiryManager';
import SpotlightTour from '@/components/SpotlightTour';

export default function AppDashboard() {
    const { language } = useI18n();
    const [showCalibration, setShowCalibration] = useState(false);
    const [showMax, setShowMax] = useState(false);
    const [showTour, setShowTour] = useState(() => {
        // Show tour only if user hasn't seen it
        if (typeof window !== 'undefined') {
            return !localStorage.getItem('hasSeenTour');
        }
        return false;
    });
    const [weather, setWeather] = useState<{
        temperature: number;
        high?: number;
        low?: number;
        weatherCode: number;
    } | null>(null);
    const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle');
    const [city, setCity] = useState<string | null>(null);

    const getWeatherLabel = (code: number) => {
        if (language === 'en') {
            if (code === 0) return 'Clear';
            if (code <= 3) return 'Partly Cloudy';
            if (code <= 49) return 'Fog';
            if (code <= 59) return 'Light Rain';
            if (code <= 69) return 'Rain';
            if (code <= 79) return 'Heavy Rain';
            if (code <= 84) return 'Storm';
            return 'Cloudy';
        }
        if (code === 0) return '晴';
        if (code <= 3) return '少云';
        if (code <= 49) return '有雾';
        if (code <= 59) return '小雨';
        if (code <= 69) return '中雨';
        if (code <= 79) return '大雨';
        if (code <= 84) return '雷暴';
        return '多云';
    };

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (language === 'en') {
            if (hour < 12) return 'Good morning';
            if (hour < 18) return 'Good afternoon';
            return 'Good evening';
        } else {
            if (hour < 12) return '早上好';
            if (hour < 18) return '下午好';
            return '晚上好';
        }
    };

    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setWeatherStatus('denied');
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        const fetchWeather = async (latitude: number, longitude: number) => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`,
                    {
                        signal: controller.signal,
                        cache: 'no-store',
                    }
                );

                if (!response.ok) {
                    throw new Error('Weather request failed');
                }

                const data = await response.json();
                const current = data?.current;
                const daily = data?.daily;

                if (!current) {
                    throw new Error('Missing weather data');
                }

                const high = Array.isArray(daily?.temperature_2m_max) ? daily.temperature_2m_max[0] : null;
                const low = Array.isArray(daily?.temperature_2m_min) ? daily.temperature_2m_min[0] : null;
                const weatherCode = typeof current.weather_code === 'number'
                    ? current.weather_code
                    : Array.isArray(daily?.weather_code)
                        ? daily.weather_code[0]
                        : 0;

                if (cancelled) {
                    return;
                }

                setWeather({
                    temperature: Math.round(current.temperature_2m),
                    high: typeof high === 'number' ? Math.round(high) : undefined,
                    low: typeof low === 'number' ? Math.round(low) : undefined,
                    weatherCode,
                });
                setWeatherStatus('ready');

                try {
                    const geoResponse = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=${language === 'en' ? 'en' : 'zh'}&format=json`,
                        {
                            signal: controller.signal,
                            cache: 'no-store',
                        }
                    );

                    if (!geoResponse.ok) {
                        return;
                    }

                    const geoData = await geoResponse.json();
                    const result = Array.isArray(geoData?.results) ? geoData.results[0] : null;
                    const nameParts = [result?.name, result?.admin1].filter(Boolean);
                    const cityName = nameParts.join(' ');

                    if (!cancelled) {
                        setCity(cityName || null);
                    }
                } catch {
                    if (!cancelled) {
                        setCity(null);
                    }
                }
            } catch {
                if (!cancelled) {
                    setWeatherStatus('error');
                }
            }
        };

        setWeatherStatus('loading');
        setCity(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            },
            () => {
                if (!cancelled) {
                    setWeatherStatus('denied');
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 6000,
                maximumAge: 10 * 60 * 1000,
            }
        );

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [language]);

    const cityLabel = city || (language === 'en' ? 'Local' : '\u5f53\u5730');

    return (
        <main className="unlearn-theme font-serif">
            {/* Welcome Header */}
            <section className="pt-24 pb-12 px-6" style={{ backgroundColor: '#0B3D2E' }}>
                <div className="max-w-[1200px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-white text-3xl md:text-4xl font-bold font-serif">
                                    {getGreeting()}
                                </h1>
                                {weatherStatus !== 'idle' && (
                                    <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold font-serif text-white/90 backdrop-blur-sm">
                                        {weatherStatus === 'loading' && (
                                            <span>{language === 'en' ? 'Locating...' : '定位中...'}</span>
                                        )}
                                        {weatherStatus === 'denied' && (
                                            <span>{language === 'en' ? 'Location off' : '定位关闭'}</span>
                                        )}
                                        {weatherStatus === 'error' && (
                                            <span>{language === 'en' ? 'Weather unavailable' : '天气不可用'}</span>
                                        )}
                                        {weatherStatus === 'ready' && weather && (
                                            <>
                                                <span className="text-white/80">{cityLabel}</span>
                                                <span className="text-white/50">|</span>
                                                <span>{getWeatherLabel(weather.weatherCode)}</span>
                                                <span className="text-white/80">{weather.temperature}C</span>
                                                {typeof weather.high === 'number' && typeof weather.low === 'number' && (
                                                    <span className="text-white/60">
                                                        {weather.high}/{weather.low}C
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-white/60 font-serif">
                                {language === 'en'
                                    ? "Here's what your digital twin learned about you"
                                    : '这是你的数字孪生对你的最新洞察'}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCalibration(!showCalibration)}
                            data-tour-id="tour-calibration"
                            className="flex items-center gap-2 px-5 py-3 bg-[#D4AF37] text-[#0B3D2E] font-semibold font-serif hover:bg-[#E5C158] transition-colors"
                        >
                            <Sparkles className="w-5 h-5" />
                            {language === 'en' ? 'Daily Calibration' : '每日校准'}
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Daily Calibration (toggleable) */}
            {showCalibration && <DailyCalibration />}

            {/* AI Proactive Inquiry (Floating) */}
            <ProactiveInquiryManager />

            {/* Participant Digital Twin (Added back) */}
            <div data-tour-id="tour-digital-twin">
                <ParticipantDigitalTwin />
            </div>

            {/* HRV Dashboard */}
            <div data-tour-id="tour-hrv">
                <HRVDashboard />
            </div>

            {/* Wearable Connections */}
            <div data-tour-id="tour-wearable">
                <WearableConnect />
            </div>

            {/* Plans Dashboard */}
            <PlanDashboard />

            {/* AI Learning Feedback */}
            <FeedbackLoop />

            {/* Science Feed */}
            <ScienceFeed />

            {/* Footer */}
            <UnlearnFooter
                socialLinks={{
                    twitter: 'https://twitter.com/antianxiety',
                    linkedin: 'https://linkedin.com/company/antianxiety',
                    youtube: 'https://youtube.com/@antianxiety',
                }}
            />

            {/* Max AI Chat */}
            <div data-tour-id="tour-max-chat">
                <MaxFloatingButton isOpen={showMax} onOpenChange={setShowMax} />
            </div>

            {/* Spotlight Tour for first-time users */}
            {showTour && (
                <SpotlightTour
                    onComplete={() => {
                        localStorage.setItem('hasSeenTour', 'true');
                        setShowTour(false);
                    }}
                    onSkip={() => {
                        localStorage.setItem('hasSeenTour', 'true');
                        setShowTour(false);
                    }}
                />
            )}
        </main>
    );
}
