'use client';

import BrutalistNav from './BrutalistNav';
import BrutalistHero from './BrutalistHero';
import VillainSection from './VillainSection';
import BayesianSection from './BayesianSection';
import PrivacySection from './PrivacySection';
import ScienceTicker from './ScienceTicker';
import BrutalistFooter from './BrutalistFooter';

export default function BrutalistPage() {
    return (
        <div className="brutalist-page">
            <BrutalistNav />
            <BrutalistHero />
            <ScienceTicker />
            <VillainSection />
            <BayesianSection />
            <PrivacySection />
            <BrutalistFooter />
        </div>
    );
}
