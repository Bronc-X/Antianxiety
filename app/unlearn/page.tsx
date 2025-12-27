import {
    UnlearnNav,
    DigitalTwinHero,
    UnlearnFeatures,
    DigitalTwinDashboard,
    ParticipantDigitalTwin,
    UnlearnCTA,
    UnlearnFooter,
} from '@/components/unlearn';

export const metadata = {
    title: 'Antianxiety | Redefine Your Relationship With Anxiety',
    description:
        'The world\'s first AI health coach that understands your unique biology and guides you toward lasting calm.',
};

export default function UnlearnPage() {
    return (
        <main className="unlearn-theme">
            {/* Navigation */}
            <UnlearnNav
                links={[
                    { label: 'Features', href: '#features' },
                    { label: 'Science', href: '#science' },
                    { label: 'Pricing', href: '/pricing' },
                    { label: 'About', href: '/about' },
                ]}
                ctaLabel="Get Started"
                ctaHref="/signup"
            />

            {/* Digital Twin Hero Section - Split portrait */}
            <DigitalTwinHero
                headline="Simulate outcomes for every participant at the beginning of your journey."
                subheadline="Your AI-powered digital twin learns your unique patterns and predicts what works best for you."
                ctaLabel="Start Your Journey"
                ctaHref="/signup"
            />

            {/* Features Grid */}
            <UnlearnFeatures />

            {/* Digital Twin Dashboard */}
            <DigitalTwinDashboard />

            {/* Participant Data Table */}
            <ParticipantDigitalTwin />

            {/* Science Section - Light variant */}
            <section
                id="science"
                className="py-24"
                style={{ backgroundColor: '#F5F3EF', color: '#1F212A' }}
            >
                <div className="max-w-[1280px] mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p
                                className="text-sm uppercase tracking-widest font-medium mb-4"
                                style={{ color: '#AA8FFF' }}
                            >
                                The Science
                            </p>
                            <h2
                                className="font-bold leading-[1.1] tracking-[-0.02em] mb-6"
                                style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                            >
                                Backed by clinical research
                            </h2>
                            <p className="text-lg text-[#1F212A]/70 leading-relaxed mb-8">
                                Our methods are built on peer-reviewed research and clinical-grade assessment tools.
                                We use validated instruments like the PHQ-9, GAD-7, and proprietary algorithms
                                developed with leading mental health researchers.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="px-5 py-3 bg-white rounded-lg border border-[#1F212A]/10">
                                    <div className="text-2xl font-bold" style={{ color: '#AA8FFF' }}>98%</div>
                                    <div className="text-sm text-[#1F212A]/60">User satisfaction</div>
                                </div>
                                <div className="px-5 py-3 bg-white rounded-lg border border-[#1F212A]/10">
                                    <div className="text-2xl font-bold" style={{ color: '#AA8FFF' }}>47%</div>
                                    <div className="text-sm text-[#1F212A]/60">Anxiety reduction</div>
                                </div>
                                <div className="px-5 py-3 bg-white rounded-lg border border-[#1F212A]/10">
                                    <div className="text-2xl font-bold" style={{ color: '#AA8FFF' }}>12</div>
                                    <div className="text-sm text-[#1F212A]/60">Days avg. to results</div>
                                </div>
                            </div>
                        </div>
                        <div
                            className="aspect-square bg-gradient-to-br from-[#AA8FFF]/20 to-[#1A081C]/10 rounded-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials / Social Proof */}
            <section
                className="py-24"
                style={{ backgroundColor: '#1A081C', color: '#FFFFFF' }}
            >
                <div className="max-w-[1280px] mx-auto px-6 text-center">
                    <p
                        className="text-sm uppercase tracking-widest font-medium mb-4"
                        style={{ color: '#AA8FFF' }}
                    >
                        Testimonials
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-12 max-w-2xl mx-auto"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        Trusted by thousands to manage their mental health
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                quote: "Finally, an app that actually understands what I'm going through. Max feels like a real coach, not just a bot.",
                                author: 'Sarah K.',
                                role: 'Marketing Director',
                            },
                            {
                                quote: "The daily calibration is a game-changer. I've learned so much about my patterns and triggers.",
                                author: 'Michael T.',
                                role: 'Software Engineer',
                            },
                            {
                                quote: "I was skeptical, but after 2 weeks my anxiety levels dropped significantly. The data doesn't lie.",
                                author: 'Emily R.',
                                role: 'Healthcare Professional',
                            },
                        ].map((testimonial, i) => (
                            <div
                                key={i}
                                className="p-6 rounded-xl text-left"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <p className="text-white/80 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                                <div>
                                    <div className="font-semibold text-white">{testimonial.author}</div>
                                    <div className="text-sm text-white/50">{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
        </main>
    );
}
