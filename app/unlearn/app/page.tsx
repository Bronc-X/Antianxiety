'use client';

import {
  PremiumUnlearnHero,
  UnlearnFeatures,
  UnlearnCTA,
  UnlearnFooter,
  LogoTicker,
  ProblemSolution,
  AboutStory,
  MaxShowcase
} from '@/components/unlearn';
import MarketingNav from '@/components/MarketingNav';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';

/**
 * Unlearn Marketing Page
 * Location: /unlearn/app
 */
export default function MarketingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6EF]">
      <MarketingNav user={user} profile={profile} />

      <main>
        <PremiumUnlearnHero
          title="Unlearn Your Anxiety"
          subtitle="A neuroscience-driven platform designed to deconstruct anxiety patterns through biological data and AI guidance."
          ctaText="Dive Into the Truth"
          ctaLink="/unlearn/signup"
        />

        <LogoTicker />

        <ProblemSolution />

        <UnlearnFeatures />

        <MaxShowcase />

        <AboutStory />

        <UnlearnCTA />
      </main>

      <UnlearnFooter
        socialLinks={{
          twitter: 'https://twitter.com/antianxiety',
          linkedin: 'https://linkedin.com/company/antianxiety',
          youtube: 'https://youtube.com/@antianxiety',
        }}
      />
    </div>
  );
}
