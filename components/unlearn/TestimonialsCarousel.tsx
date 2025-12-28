'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface Testimonial {
    quote: string;
    author: string;
    role: string;
}

export default function TestimonialsCarousel() {
    const { language } = useI18n();

    const testimonials: Testimonial[] = language === 'en' ? [
        {
            quote: "Finally, an app that actually understands what I'm going through. Max feels like a real coach.",
            author: 'S.K.',
            role: 'Marketing Director',
        },
        {
            quote: "The daily calibration is a game-changer. I've learned so much about my patterns.",
            author: 'M.T.',
            role: 'Software Engineer',
        },
        {
            quote: "After 2 weeks my anxiety levels dropped significantly. The data doesn't lie.",
            author: 'E.R.',
            role: 'Healthcare Professional',
        },
        {
            quote: "This is the first app that actually adapts to my recovery needs.",
            author: 'J.L.',
            role: 'CrossFit Coach',
        },
        {
            quote: "Max helps me understand when to push and when to rest. Game changer for founders.",
            author: 'A.C.',
            role: 'Tech Founder',
        },
        {
            quote: "No fluff, just data-driven insights that actually work.",
            author: 'D.W.',
            role: 'AI Researcher',
        },
        {
            quote: "This app finally gets the mind-body connection.",
            author: 'L.M.',
            role: 'Independent Designer',
        },
        {
            quote: "The clinical approach is refreshing. I recommend this to my patients.",
            author: 'Dr. H.Z.',
            role: 'Clinical Psychologist',
        },
        {
            quote: "Max taught me that rest is part of the process, not the enemy.",
            author: 'K.P.',
            role: 'Indie Developer',
        },
    ] : [
        {
            quote: '终于有一款应用真正理解我。Max 感觉像一个真正的教练。',
            author: 'S.K.',
            role: '市场总监',
        },
        {
            quote: '每日校准改变了一切。我对自己的模式有了更深入的了解。',
            author: 'M.T.',
            role: '软件工程师',
        },
        {
            quote: '两周后我的焦虑水平明显下降。数据不会说谎。',
            author: 'E.R.',
            role: '医疗从业者',
        },
        {
            quote: '这是第一款真正能适应我恢复需求的 App。',
            author: 'J.L.',
            role: 'CrossFit 教练',
        },
        {
            quote: 'Max 帮我理解什么时候该冲，什么时候该休息。',
            author: 'A.C.',
            role: '科技公司创始人',
        },
        {
            quote: '没有鸡汤，只有真正有效的数据洞察。',
            author: 'D.W.',
            role: 'AI 研究员',
        },
        {
            quote: '这款 App 终于理解了身心连接的重要性。',
            author: 'L.M.',
            role: '独立设计师',
        },
        {
            quote: '临床级的方法让人耳目一新。我会推荐给患者。',
            author: 'H.Z. 医生',
            role: '临床心理学家',
        },
        {
            quote: 'Max 教会我，休息是过程的一部分，而不是敌人。',
            author: 'K.P.',
            role: '独立开发者',
        },
    ];

    return (
        <section className="py-16 overflow-hidden" style={{ backgroundColor: '#FAF6EF' }}>
            <div className="max-w-[1280px] mx-auto px-6 mb-8">
                <div className="text-center">
                    <p className="text-sm uppercase tracking-widest font-medium mb-4 text-[#D4AF37] font-serif">
                        {language === 'en' ? 'Testimonials' : '用户评价'}
                    </p>
                    <h2
                        className="font-bold leading-[1.1] tracking-[-0.02em] max-w-2xl mx-auto font-serif text-[#0B3D2E]"
                        style={{ 
                            fontSize: 'clamp(28px, 4vw, 40px)', 
                            color: '#0B3D2E',
                            WebkitTextFillColor: '#0B3D2E'
                        }}
                    >
                        {language === 'en' ? 'Trusted by thousands' : '数千人信赖的心理健康管理工具'}
                    </h2>
                </div>
            </div>

            {/* Scrolling Testimonials */}
            <div className="relative">
                {/* Gradient Masks */}
                <div className="absolute top-0 left-0 w-32 md:w-64 h-full bg-gradient-to-r from-[#FAF6EF] to-transparent z-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 md:w-64 h-full bg-gradient-to-l from-[#FAF6EF] to-transparent z-10 pointer-events-none" />

                {/* Row 1 - Left to Right */}
                <div className="flex overflow-hidden mb-4">
                    <motion.div
                        className="flex gap-4 whitespace-nowrap"
                        animate={{ x: [0, '-50%'] }}
                        transition={{
                            repeat: Infinity,
                            ease: 'linear',
                            duration: 60,
                        }}
                    >
                        {[...testimonials, ...testimonials].map((t, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-[350px] p-6 bg-white border border-[#1A1A1A]/10"
                            >
                                <p className="text-[#1A1A1A]/70 leading-relaxed font-serif text-sm mb-4 whitespace-normal">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#0B3D2E] flex items-center justify-center text-white text-xs font-bold">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[#1A1A1A] font-serif text-sm">{t.author}</div>
                                        <div className="text-xs text-[#D4AF37] font-serif">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Row 2 - Right to Left */}
                <div className="flex overflow-hidden">
                    <motion.div
                        className="flex gap-4 whitespace-nowrap"
                        animate={{ x: ['-50%', 0] }}
                        transition={{
                            repeat: Infinity,
                            ease: 'linear',
                            duration: 70,
                        }}
                    >
                        {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-[350px] p-6 bg-white border border-[#1A1A1A]/10"
                            >
                                <p className="text-[#1A1A1A]/70 leading-relaxed font-serif text-sm mb-4 whitespace-normal">
                                    &ldquo;{t.quote}&rdquo;
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center text-[#0B3D2E] text-xs font-bold">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[#1A1A1A] font-serif text-sm">{t.author}</div>
                                        <div className="text-xs text-[#0B3D2E]/60 font-serif">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
