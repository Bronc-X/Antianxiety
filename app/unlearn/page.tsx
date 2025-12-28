'use client';

import { useState } from 'react';
import {
    UnlearnNav,
    DigitalTwinHero,
    LogoTicker,
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
} from '@/components/unlearn';
import { useI18n } from '@/lib/i18n';

export default function UnlearnPage() {
    const { language } = useI18n();
    const [chatOpen, setChatOpen] = useState(false);

    return (
        <main className="unlearn-theme font-serif">
            {/* Navigation */}
            <UnlearnNav
                links={language === 'en' ? [
                    { label: 'Features', href: '#features' },
                    { label: 'Science', href: '#science' },
                    { label: 'About', href: '#about' },
                    { label: 'Pricing', href: '/pricing' },
                ] : [
                    { label: '功能', href: '#features' },
                    { label: '科学', href: '#science' },
                    { label: '关于', href: '#about' },
                    { label: '定价', href: '/pricing' },
                ]}
                ctaLabel={language === 'en' ? 'Get Started' : '开始使用'}
                ctaHref="/signup"
            />

            {/* Original Digital Twin Hero - Woman Facing Her Twin (RESTORED) */}
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

            {/* Scientific Trust - Logo Ticker */}
            <LogoTicker />

            {/* Problem & Solution Sections */}
            <ProblemSolution />

            {/* Max Showcase Section */}
            <MaxShowcase onOpenChat={() => setChatOpen(true)} />

            {/* Features Grid */}
            <section id="features">
                <UnlearnFeatures />
            </section>

            {/* Woman Portrait Carousel (Moved Down) */}
            <AnimatedHero onGetStarted={() => window.location.href = '/signup'} />

            {/* Digital Twin Dashboard */}
            <DigitalTwinDashboard />

            {/* Participant Data Table */}
            <ParticipantDigitalTwin />

            {/* About Section */}
            <section id="about">
                <AboutStory />
            </section>

            {/* Science Section */}
            <section
                id="science"
                className="py-24"
                style={{ backgroundColor: '#0B3D2E', color: '#FFFFFF' }}
            >
                <div className="max-w-[1280px] mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
                                {language === 'en' ? 'The Science' : '科学背景'}
                            </p>
                            <h2
                                className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-6 font-serif"
                                style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
                            >
                                {language === 'en' ? 'Backed by clinical research' : '临床研究支持'}
                            </h2>
                            <p className="text-lg text-white/60 leading-relaxed mb-8 font-serif">
                                {language === 'en'
                                    ? 'Our methods are built on peer-reviewed research and clinical-grade assessment tools. We use validated instruments like the PHQ-9, GAD-7, and proprietary algorithms developed with leading mental health researchers.'
                                    : '我们的方法建立在同行评审研究和临床级评估工具之上。我们使用经过验证的量表，如抑郁症状问卷、广泛性焦虑量表，以及与顶尖心理健康研究人员共同开发的专有算法。'}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {(language === 'en' ? [
                                    { value: '98%', label: 'User satisfaction' },
                                    { value: '47%', label: 'Anxiety reduction' },
                                    { value: '12', label: 'Days avg. to results' },
                                ] : [
                                    { value: '98%', label: '用户满意度' },
                                    { value: '47%', label: '焦虑减少' },
                                    { value: '12', label: '天平均见效' },
                                ]).map((stat, i) => (
                                    <div key={i} className="px-5 py-3 bg-white/5 border border-white/10">
                                        <div className="text-2xl font-bold text-[#D4AF37] font-serif">{stat.value}</div>
                                        <div className="text-sm text-white/60 font-serif">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div
                            className="aspect-square bg-gradient-to-br from-[#D4AF37]/10 to-[#0B3D2E]/50"
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section
                className="py-24"
                style={{ backgroundColor: '#FAF6EF', color: '#1A1A1A' }}
            >
                <div className="max-w-[1280px] mx-auto px-6 text-center">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
                        {language === 'en' ? 'Testimonials' : '用户评价'}
                    </p>
                    <h2
                        className="text-[#1A1A1A] font-bold leading-[1.1] tracking-[-0.02em] mb-12 max-w-2xl mx-auto font-serif"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        {language === 'en' ? 'Trusted by thousands to manage their mental health' : '数千人信赖的心理健康管理工具'}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {(language === 'en' ? [
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
                        ] : [
                            {
                                quote: '终于有一款应用真正理解我正在经历的事情。Max 感觉像一个真正的教练，而不仅仅是一个机器人。',
                                author: '小王',
                                role: '市场总监',
                            },
                            {
                                quote: '每日校准改变了一切。我对自己的模式和触发因素有了更深入的了解。',
                                author: '李先生',
                                role: '软件工程师',
                            },
                            {
                                quote: '起初我持怀疑态度，但两周后我的焦虑水平明显下降。数据不会说谎。',
                                author: '张女士',
                                role: '医疗专业人员',
                            },
                        ]).map((testimonial, i) => (
                            <div
                                key={i}
                                className="p-6 text-left"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid rgba(26,26,26,0.1)',
                                }}
                            >
                                <p className="text-[#1A1A1A]/70 mb-6 leading-relaxed font-serif">&ldquo;{testimonial.quote}&rdquo;</p>
                                <div>
                                    <div className="font-semibold text-[#1A1A1A] font-serif">{testimonial.author}</div>
                                    <div className="text-sm text-[#1A1A1A]/50 font-serif">{testimonial.role}</div>
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

            {/* Floating Max Button */}
            <MaxFloatingButton isOpen={chatOpen} onOpenChange={setChatOpen} />
        </main>
    );
}
