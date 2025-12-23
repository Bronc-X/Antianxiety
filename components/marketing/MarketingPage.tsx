'use client';

import { Suspense, lazy } from 'react';
import HeroSection from './HeroSection';
import ComparisonSection from './ComparisonSection';
import RetreatSection from './RetreatSection';
import ScienceProof from './ScienceProof';
import MethodologySection from './MethodologySection';
import Footer from './Footer';
import ScrollSection from './ScrollSection';
import { Loader2 } from 'lucide-react';
import MarketingNav from '../MarketingNav'; // Import the nav

const FeatureBento = lazy(() => import('./FeatureBento'));

function LoadingPlaceholder() {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#9CAF88] animate-spin" />
        </div>
    );
}

export default function MarketingPage({ onStart }: { onStart?: () => void }) {
    // Mock user/profile for visual completeness in nav, 
    // or we can let MarketingNav handle its own state if it fetches internally.
    // The GlobalNav fetched data, but MarketingNav accepts props.
    // For the purpose of this page which is likely public, we can pass null or minimal data.

    return (
        <div className="bg-[#FAF6EF] dark:bg-[#1A1A1A] text-[#1A1A1A] dark:text-[#F9F8F6] min-h-screen selection:bg-[#D4AF37]/20 relative">
            {/* MarketingNav removed as requested */}

            <HeroSection onStart={onStart} />

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
