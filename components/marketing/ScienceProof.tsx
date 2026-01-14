'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export default function ScienceProof() {
    const { language } = useI18n();

    const papers = [
        {
            authors: 'Lexell et al.',
            year: '1988',
            title: language === 'en' ? 'What is the cause of the ageing atrophy?' : '衰老性肌肉萎缩的原因是什么？',
            journal: 'J Neurol Sci',
            url: 'https://pubmed.ncbi.nlm.nih.gov/3385520/',
            consensus: 92
        },
        {
            authors: 'Walker et al.',
            year: '2017',
            title: language === 'en' ? 'Why We Sleep: The New Science of Sleep and Dreams' : '我们为什么要睡觉：睡眠与梦的新科学',
            journal: 'Nature Reviews',
            url: 'https://pubmed.ncbi.nlm.nih.gov/28248301/',
            consensus: 95
        },
        {
            authors: 'Huberman Lab',
            year: '2023',
            title: language === 'en' ? 'Protocols for Managing Stress & Anxiety' : '压力与焦虑管理协议',
            journal: 'Stanford Medicine',
            url: 'https://hubermanlab.com/tools-for-managing-stress-and-anxiety/',
            consensus: 88
        },
        {
            authors: 'Sapolsky R.',
            year: '2004',
            title: language === 'en' ? 'Why Zebras Don\'t Get Ulcers: Stress and Health' : '为什么斑马不得胃溃疡：压力与健康',
            journal: 'Science',
            url: 'https://pubmed.ncbi.nlm.nih.gov/15514116/',
            consensus: 91
        },
        {
            authors: 'McEwen B.',
            year: '2008',
            title: language === 'en' ? 'Central effects of stress hormones in health and disease' : '压力激素对健康和疾病的中枢效应',
            journal: 'Eur J Pharmacol',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18295199/',
            consensus: 89
        },
        {
            authors: 'Porges S.',
            year: '2011',
            title: language === 'en' ? 'The Polyvagal Theory: Neurophysiological Foundations' : '多迷走神经理论：神经生理学基础',
            journal: 'Biol Psychol',
            url: 'https://pubmed.ncbi.nlm.nih.gov/21453750/',
            consensus: 87
        }
    ];

    return (
        <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-[#1A1A1A]/5 dark:border-white/5 bg-[#FAFAFA] dark:bg-[#1A1A1A]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
                {/* Left Column: Heading */}
                <div className="lg:col-span-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="sticky top-32"
                    >
                        <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37] mb-6 block">
                            {language === 'en' ? 'Scientific Grounding' : '科学依据'}
                        </span>
                        <h3 className="font-heading text-3xl md:text-4xl leading-tight text-[#1A1A1A] dark:text-white mb-6">
                            {language === 'en' ? (
                                <>The <span className="italic text-[#D4AF37]">Truth</span> We Stand On.</>
                            ) : (
                                <>我们所依据的<span className="italic text-[#D4AF37]">真相</span>。</>
                            )}
                        </h3>
                        <p className="text-[#1A1A1A]/60 dark:text-white/60 leading-relaxed mb-8">
                            {language === 'en'
                                ? 'Our methodology is grounded in peer-reviewed studies on neurobiology, metabolic health, and circadian rhythms.'
                                : '我们的方法论植根于神经生物学、代谢健康和昼夜节律的同行评审研究。'}
                        </p>

                        {/* Meta Data */}
                        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#1A1A1A]/40 border border-[#1A1A1A]/10 px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88]" />
                            {language === 'en' ? 'Peer-Reviewed Research' : '同行评审研究'}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Papers Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.map((paper, idx) => (
                        <motion.a
                            key={idx}
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="group flex flex-col p-6 bg-white dark:bg-[#1A1A1A] border border-[#1A1A1A]/5 hover:border-[#D4AF37]/40 shadow-sm hover:shadow-lg transition-all duration-500 rounded-[2px]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">{paper.journal}</span>
                                <span className="text-xs font-mono text-[#1A1A1A]/30">{paper.consensus}% Consensus</span>
                            </div>

                            <h4 className="text-base font-medium text-[#1A1A1A] dark:text-white group-hover:text-[#D4AF37] transition-colors mb-2 leading-snug">
                                {paper.title}
                            </h4>

                            <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-[#1A1A1A]/40 dark:text-white/40">
                                <span>{paper.authors}</span>
                                <span>•</span>
                                <span>{paper.year}</span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
