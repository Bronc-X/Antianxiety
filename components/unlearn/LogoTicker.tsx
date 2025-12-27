'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

export default function LogoTicker() {
    const { language } = useI18n();

    const logos = [
        // Nature - Serif, bold, lowercase n
        <div key="nature" className="flex items-center justify-center min-w-[120px]">
            <span className="font-serif font-black text-3xl tracking-tight hover:text-[#D4AF37] transition-colors text-white" style={{ fontFamily: 'Georgia, serif' }}>nature</span>
        </div>,

        // Science - Serif, Uppercase/Title
        <div key="science" className="flex items-center justify-center min-w-[120px]">
            <span className="font-serif font-bold text-3xl tracking-tighter uppercase relative top-1 hover:text-[#D4AF37] transition-colors text-white" style={{ fontFamily: 'Times New Roman, serif' }}>Science</span>
        </div>,

        // The Lancet
        <div key="lancet" className="flex items-center justify-center min-w-[120px]">
            <span className="font-serif italic font-bold text-2xl tracking-normal hover:text-[#D4AF37] transition-colors text-white" style={{ fontFamily: 'Georgia, serif' }}>THE LANCET</span>
        </div>,

        // Stanford Medicine
        <div key="stanford" className="flex items-center justify-center gap-1 min-w-[150px] group/item">
            <span className="font-serif text-xl uppercase tracking-widest border-b border-white/30 pb-0.5 group-hover/item:text-[#D4AF37] group-hover/item:border-[#D4AF37] transition-colors text-white">Stanford</span>
            <span className="font-sans text-[10px] uppercase tracking-wider self-end mb-1 font-bold group-hover/item:text-[#D4AF37] transition-colors text-white/70">Medicine</span>
        </div>,

        // Cell - Square graphic
        <div key="cell" className="flex items-center justify-center gap-2 min-w-[100px]">
            <div className="w-6 h-6 bg-white hover:bg-[#D4AF37] transition-colors" />
            <span className="font-sans font-black text-3xl tracking-tighter uppercase leading-none hover:text-[#D4AF37] transition-colors text-white">Cell</span>
        </div>,

        // JAMA
        <div key="jama" className="flex items-center justify-center min-w-[100px]">
            <span className="font-serif font-black text-3xl tracking-wide hover:text-[#D4AF37] transition-colors text-white" style={{ fontFamily: 'Times New Roman, serif' }}>JAMA</span>
        </div>,

        // PubMed - Sans
        <div key="pubmed" className="flex items-center justify-center min-w-[120px]">
            <span className="font-sans font-bold text-3xl tracking-tighter text-white/80 hover:text-[#D4AF37] transition-colors">PubMed</span>
            <span className="self-start text-[10px] text-white/40 ml-0.5 mt-1">®</span>
        </div>,

        // Semantic Scholar - Icon restored
        <div key="semantic" className="flex items-center justify-center gap-2 min-w-[180px] group/item">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current text-white group-hover/item:text-[#D4AF37] transition-colors">
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1 5 2.5L12 16l-7-3.5L10 10l2 1zm0 5.5l-6-3-2 1 8 4 8-4-2-1-6 3z" />
            </svg>
            <span className="font-sans font-bold text-xl tracking-tight ml-1 group-hover/item:text-[#D4AF37] transition-colors text-white">Semantic Scholar</span>
        </div>,

        // Reddit - Icon + Text
        <div key="reddit" className="flex items-center justify-center gap-2 min-w-[140px] group/item">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current text-white group-hover/item:text-[#D4AF37] transition-colors">
                <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM17 12C17 10.8954 16.1046 10 15 10C14.2882 10 13.6663 10.3704 13.3105 10.9325C12.4276 10.6133 11.5724 10.6133 10.6895 10.9325C10.3337 10.3704 9.71184 10 9 10C7.89543 10 7 10.8954 7 12C7 12.8306 7.50659 13.5416 8.21981 13.8437C8.20666 13.8949 8.2 13.9471 8.2 14C8.2 16.2091 10.0211 18 12.2673 18C14.5136 18 16.3347 16.2091 16.3347 14C16.3347 13.9471 16.328 13.8949 16.3149 13.8437C17.0281 13.5416 17.5347 12.8306 17.5347 12Z" />
            </svg>
            <span className="font-sans font-bold text-2xl tracking-tighter group-hover/item:text-[#D4AF37] transition-colors text-white">reddit</span>
        </div>,

        // X (Twitter) - Icon
        <div key="x" className="flex items-center justify-center min-w-[80px]">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current text-white hover:text-[#D4AF37] transition-colors">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
        </div>
    ];

    return (
        <section className="py-8 overflow-hidden relative" style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[1400px] mx-auto px-6 mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 text-center">
                    {language === 'en' ? 'Backed by research from' : '基于以下顶级期刊的研究成果'}
                </p>
            </div>

            <div className="relative flex overflow-x-hidden group">
                {/* Gradient Masks */}
                <div className="absolute top-0 left-0 w-32 md:w-64 h-full bg-gradient-to-r from-[#0B3D2E] to-transparent z-10" />
                <div className="absolute top-0 right-0 w-32 md:w-64 h-full bg-gradient-to-l from-[#0B3D2E] to-transparent z-10" />

                {/* Infinite Loop */}
                <motion.div
                    className="flex gap-20 md:gap-32 whitespace-nowrap items-center w-max"
                    animate={{ x: "-25%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30
                    }}
                >
                    {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
                        <div key={i} className="transform hover:scale-110 transition-transform duration-300">
                            {logo}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
