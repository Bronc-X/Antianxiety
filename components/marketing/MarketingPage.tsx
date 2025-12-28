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
        <div className="bg-[#FAF6EF] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F9F8F6] min-h-screen selection:bg-[#D4AF37]/20 relative">
            {/* Sticky Nav Bar with CTA */}
            <nav className="sticky top-0 z-50 bg-[#FAF6EF]/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#1A1A1A]/10 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex h-14 items-center justify-between">
                        {/* Logo - Left */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-sm font-bold tracking-tight text-[#1A1A1A] dark:text-white">
                                AntiAnxiety<sup className="text-[8px]">™</sup>
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

