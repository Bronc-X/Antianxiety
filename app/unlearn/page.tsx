'use client';

import { useState } from 'react';
import {
    UnlearnNav,
    ProblemSolution,
    AnimatedHero,
    UnlearnFeatures,
    DigitalTwinDashboard,
    ParticipantDigitalTwin,
    AboutStory,
    MaxShowcase,
    UnlearnCTA,
    UnlearnFooter,
    MaxFloatingButton,
    TestimonialsCarousel,
    ScrollToTop,
} from '@/components/unlearn';
import PremiumUnlearnHero from '@/components/unlearn/PremiumUnlearnHero';
import PremiumSectionWrapper from '@/components/unlearn/PremiumSectionWrapper';
import PricingPlans from '@/components/PricingPlans';
import ProactiveInquiryManager from '@/components/max/ProactiveInquiryManager';
import { useI18n } from '@/lib/i18n';

export default function UnlearnPage() {
    const { language } = useI18n();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <main className="unlearn-theme font-serif relative overflow-hidden">
            {/* Global Background Effects for Premium Feel */}
            <div className="fixed inset-0 z-[-1] bg-background pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-noise opacity-[0.2] pointer-events-none mix-blend-multiply" />

            {/* Navigation - Fixed at top */}
            <UnlearnNav
                links={language === 'en' ? [
                    { label: 'Features', href: '#features' },
                    { label: 'Max', href: '#max' },
                    { label: 'Science', href: '#dashboard' },
                    { label: 'About', href: '#about' },
                    { label: 'Pricing', href: '#pricing' },
                ] : [
                    { label: '功能', href: '#features' },
                    { label: 'Max', href: '#max' },
                    { label: '科学', href: '#dashboard' },
                    { label: '关于', href: '#about' },
                    { label: '定价', href: '#pricing' },
                ]}
                ctaLabel={language === 'en' ? 'Get Started' : '开始使用'}
                ctaHref="/signup"
            />

            {/* Premium Hero Section (Replaces GlobalScienceHero & DigitalTwinHero) */}
            <PremiumUnlearnHero />

            {/* Problem & Solution Sections */}
            <PremiumSectionWrapper delay={0.2}>
                <ProblemSolution />
            </PremiumSectionWrapper>

            {/* Features Grid */}
            <section id="features" className="scroll-mt-24">
                <PremiumSectionWrapper>
                    <UnlearnFeatures />
                </PremiumSectionWrapper>
            </section>

            {/* Max Showcase Section */}
            <PremiumSectionWrapper>
                <MaxShowcase onOpenChat={() => setChatOpen(true)} />
            </PremiumSectionWrapper>

            {/* Woman Portrait Carousel */}
            <PremiumSectionWrapper>
                <AnimatedHero onGetStarted={() => window.location.href = '/signup'} />
            </PremiumSectionWrapper>

            {/* Digital Twin Dashboard */}
            <section id="dashboard" className="scroll-mt-24">
                <PremiumSectionWrapper>
                    <DigitalTwinDashboard />
                </PremiumSectionWrapper>
            </section>

            {/* Participant Data Table */}
            <PremiumSectionWrapper>
                <ParticipantDigitalTwin />
            </PremiumSectionWrapper>

            {/* About Section */}
            <section id="about" className="scroll-mt-24">
                <PremiumSectionWrapper>
                    <AboutStory />
                </PremiumSectionWrapper>
            </section>

            {/* Testimonials Carousel */}
            <PremiumSectionWrapper>
                <TestimonialsCarousel />
            </PremiumSectionWrapper>

            {/* Pricing Section */}
            <section id="pricing" className="scroll-mt-24">
                <PremiumSectionWrapper>
                    <PricingPlans />
                </PremiumSectionWrapper>
            </section>

            {/* CTA Section */}
            <UnlearnCTA />

            {/* Footer */}
            <UnlearnFooter
                socialLinks={{
                    twitter: 'https://twitter.com/antianxiety',
                    linkedin: 'https://linkedin.com/company/antianxiety',
                    youtube: 'https://youtube.com/@antianxiety',
                }}
            />

            <MaxFloatingButton isOpen={chatOpen} onOpenChange={setChatOpen} />
            <ProactiveInquiryManager />

            <ScrollToTop />
        </main>
    );
}
