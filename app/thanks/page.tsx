'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ThanksPage() {
    const { language } = useI18n();

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0B3D2E] to-[#1a5c47] flex flex-col items-center justify-center px-6">
            {/* Back Link */}
            <Link
                href="/unlearn/app"
                className="fixed top-6 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{language === 'en' ? 'Back' : '返回'}</span>
            </Link>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
            >
                {/* Heart Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-8"
                >
                    <Heart className="w-12 h-12 text-[#D4AF37] mx-auto fill-[#D4AF37]" />
                </motion.div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
                    {language === 'en' ? 'Special Thanks' : '特别鸣谢'}
                </h1>
                <p className="text-white/60 mb-12 max-w-md mx-auto">
                    {language === 'en'
                        ? 'To those who made this possible'
                        : '感谢所有让这一切成为可能的人'}
                </p>

                {/* Avatar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                >
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20">
                        <Image
                            src="/images/nibaobao.jpg"
                            alt="妮宝宝"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>

                {/* Name - Serif Font */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-4xl md:text-5xl font-bold text-[#D4AF37] font-serif tracking-wide"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                    妮宝宝
                </motion.h2>

                {/* Subtle decoration */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100px' }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-6"
                />
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-8 text-white/30 text-sm">
                © {new Date().getFullYear()} AntiAnxiety™
            </div>
        </div>
    );
}
