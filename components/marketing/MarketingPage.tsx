'use client';

import { Suspense, lazy } from 'react';
import HeroSection from './HeroSection';
import ComparisonSection from './ComparisonSection';
import RetreatSection from './RetreatSection';
import ScienceProof from './ScienceProof';
import MethodologySection from './MethodologySection';
import AboutSection from './AboutSection';
import Footer from './Footer';
import ScrollSection from './ScrollSection';
import { Loader2, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '../LanguageSwitcher';

import { TechGrid } from './TechDecorations';
import ThreeBackground from './ThreeBackground';

// ... imports remain the same

import LogoTicker from './LogoTicker';

const FeatureBento = lazy(() => import('./FeatureBento'));

function LoadingPlaceholder() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin" />
        </div>
    );
}

export default function MarketingPage({ onStart }: { onStart?: () => void }) {
    const { language } = useI18n();

    return (
        <div className="bg-[#FAF6EF] dark:bg-[#0F1115] text-[#1A1A1A] dark:text-[#F9F8F6] min-h-screen selection:bg-[#D4AF37]/20 relative overflow-x-hidden">
            {/* 3D WebGL Background (Digital Cortex) */}
            <ThreeBackground />

            {/* Global Fixed Tech Grid */}
            <TechGrid />

            {/* Sticky HUD Nav Bar */}
            <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl bg-[#FAF6EF]/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border border-[#1A1A1A]/5 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 max-w-7xl mx-auto transition-all duration-300">
                <div className="px-4 sm:px-6">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo - Left */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-bold tracking-tight text-[#1A1A1A] dark:text-white font-mono uppercase">
                                AntiAnxiety<sup className="text-[8px] text-[#D4AF37]">BETA</sup>
                            </span>
                        </div>

                        {/* CTA Button - Center, 30% width, gold gradient, serif italic */}
                        <button
                            onClick={onStart}
                            className="group relative overflow-hidden bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-white px-4 py-2.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 
                                w-[30%] min-w-[140px] max-w-[220px]
                                shadow-[0_4px_15px_-3px_rgba(212,175,55,0.4)]
                                hover:shadow-[0_8px_25px_-5px_rgba(212,175,55,0.5)] hover:scale-[1.02]
                                active:scale-95
                                touch-action-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[#B8962D] to-[#9CAF88] transform scale-x-0 group-hover:scale-x-100 group-active:scale-x-100 transition-transform duration-300 origin-left z-0" />
                            <span className="relative z-10 text-sm sm:text-base font-serif italic tracking-wide text-white drop-shadow-sm">
                                {language === 'en' ? 'Join Beta' : '加入内测'}
                            </span>
                            <ArrowRight className="w-4 h-4 relative z-10 text-white transition-transform group-hover:translate-x-1 group-active:translate-x-1.5" />
                        </button>

                        {/* Language Switcher - Right */}
                        <div className="flex-shrink-0">
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            <HeroSection onStart={onStart} />

            {/* Scientific Trust Indicator - Infinite Ticker */}
            <LogoTicker />

            {/* Narrative Flow: Problem (Comparison) -> Solution Approach (Retreat) -> Features -> Proof */}

            <ScrollSection>
                <ComparisonSection />
            </ScrollSection>

            <ScrollSection>
                <RetreatSection />
            </ScrollSection>

            <ScrollSection>
                <MethodologySection />
            </ScrollSection>

            <ScrollSection>
                <AboutSection />
            </ScrollSection>

            <ScrollSection>
                <Suspense fallback={<LoadingPlaceholder />}>
                    <FeatureBento />
                </Suspense>
            </ScrollSection>

            <ScrollSection>
                <ScienceProof />
            </ScrollSection>

            <Footer />
        </div>
    );
}

