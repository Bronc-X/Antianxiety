'use client';

import { useI18n } from '@/lib/i18n';

export default function Footer() {
    const { language } = useI18n();
    const year = new Date().getFullYear();

    return (
        <footer className="py-24 px-6 md:px-12 bg-[#1A1A1A] text-[#F9F8F6]">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-12">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="font-bold text-2xl tracking-tight">AntiAnxiety<sup className="text-sm">™</sup></span>
                    </div>
                    <p className="text-white/40 max-w-sm leading-relaxed text-sm">
                        {language === 'en'
                            ? 'Reclaiming agency over your biology through data, awareness, and sustainable habits.'
                            : '通过数据、觉察和可持续习惯，重掌对自己生物机能的控制权。'}
                    </p>
                </div>

                <div>
                    <h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6">Platform</h4>
                    <ul className="space-y-4 text-sm text-white/60">
                        <li className="hover:text-white cursor-pointer transition-colors">Assessment</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Calibration</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Methodology</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-6">Legal</h4>
                    <ul className="space-y-4 text-sm text-white/60">
                        <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Research Disclaimer</li>
                    </ul>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto mt-24 flex flex-col md:flex-row justify-between items-center text-xs text-white/20">
                <p>© {year} AntiAnxiety™. All rights reserved.</p>
                <p className="mt-4 md:mt-0 font-mono">EST. 2024</p>
            </div>
        </footer>
    );
}
