'use client';

import { useState } from 'react';
import {
    UnlearnNav,
    DigitalTwinHero,
    GlobalScienceHero,
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
} from '@/components/unlearn';
import PricingPlans from '@/components/PricingPlans';
import { useI18n } from '@/lib/i18n';

export default function UnlearnPage() {
    const { language } = useI18n();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <main className="unlearn-theme font-serif">
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

            {/* Global Science Hero - Data Particles Converging (FIRST) */}
            <GlobalScienceHero />

            {/* Digital Twin Hero - Woman Facing Her Twin */}
            <DigitalTwinHero
                headline={language === 'en'
                    ? "Meet your digital twin. Understand yourself like never before."
                    : "遇见你的数字孪生体，前所未有地了解自己。"}
                subheadline={language === 'en'
                    ? "Your AI-powered health companion learns your unique patterns and guides you toward lasting calm."
                    : "你的人工智能健康伙伴学习你独特的模式，引导你走向持久的平静。"}
                ctaLabel={language === 'en' ? 'Start Your Journey' : '开始你的旅程'}
                ctaHref="/signup"
            />

            {/* Problem & Solution Sections */}
            <ProblemSolution />

            {/* Features Grid */}
            <section id="features" className="scroll-mt-24">
                <UnlearnFeatures />
            </section>

            {/* Max Showcase Section */}
            <MaxShowcase onOpenChat={() => setChatOpen(true)} />

            {/* Woman Portrait Carousel (Moved Down) */}
            <AnimatedHero onGetStarted={() => window.location.href = '/signup'} />

            {/* Digital Twin Dashboard */}
            <section id="dashboard" className="scroll-mt-24">
                <DigitalTwinDashboard />
            </section>

            {/* Participant Data Table */}
            <ParticipantDigitalTwin />

            {/* About Section */}
            <section id="about" className="scroll-mt-24">
                <AboutStory />
            </section>

            {/* Testimonials Carousel */}
            <TestimonialsCarousel />

            {/* Pricing Section */}
            <section id="pricing" className="scroll-mt-24">
                <PricingPlans />
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

            {/* Floating Max Button */}
            <MaxFloatingButton isOpen={chatOpen} onOpenChange={setChatOpen} />
        </main>
    );
}
