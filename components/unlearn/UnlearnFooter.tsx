'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

interface FooterLink {
    label: string;
    href: string;
}

interface SocialLink {
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    instagram?: string;
}

interface UnlearnFooterProps {
    socialLinks?: SocialLink;
}

export default function UnlearnFooter({
    socialLinks = {},
}: UnlearnFooterProps) {
    const { language } = useI18n();
    const footerSections: Array<{ title: string; links: FooterLink[] }> = language === 'en'
        ? [
            {
                title: 'Company',
                links: [
                    { label: 'About', href: '/about' },
                    { label: 'Careers', href: '/careers' },
                    { label: 'Press', href: '/press' },
                    { label: 'Contact', href: '/contact' },
                ],
            },
            {
                title: 'Resources',
                links: [
                    { label: 'Blog', href: '/blog' },
                    { label: 'Research', href: '/research' },
                    { label: 'Documentation', href: '/docs' },
                    { label: 'Support', href: '/support' },
                ],
            },
            {
                title: 'Legal',
                links: [
                    { label: 'Privacy', href: '/privacy' },
                    { label: 'Terms', href: '/terms' },
                    { label: 'Security', href: '/security' },
                    { label: 'HIPAA', href: '/hipaa' },
                ],
            },
        ]
        : [
            {
                title: '公司',
                links: [
                    { label: '关于我们', href: '/about' },
                    { label: '加入我们', href: '/careers' },
                    { label: '媒体报道', href: '/press' },
                    { label: '联系我们', href: '/contact' },
                ],
            },
            {
                title: '资源',
                links: [
                    { label: '博客', href: '/blog' },
                    { label: '研究', href: '/research' },
                    { label: '文档', href: '/docs' },
                    { label: '支持', href: '/support' },
                ],
            },
            {
                title: '法律',
                links: [
                    { label: '隐私政策', href: '/privacy' },
                    { label: '服务条款', href: '/terms' },
                    { label: '安全', href: '/security' },
                    { label: 'HIPAA', href: '/hipaa' },
                ],
            },
        ];

    return (
        <footer style={{ backgroundColor: '#0B3D2E' }}>
            <div className="max-w-[1280px] mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="font-bold text-white text-xl tracking-tight">
                                AntiAnxiety<sup className="text-xs">™</sup>
                            </span>
                        </Link>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-6">
                            {language === 'en'
                                ? 'Redefining mental health through the power of AI and personalized care.'
                                : '以 AI 与个性化关怀重新定义心理健康。'}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            {socialLinks.twitter && (
                                <a
                                    href={socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.linkedin && (
                                <a
                                    href={socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            )}
                            {socialLinks.youtube && (
                                <a
                                    href={socialLinks.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-white/20 flex items-center justify-center text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                                {section.title}
                            </h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div
                    className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <p className="text-white/40 text-sm">
                        © {new Date().getFullYear()} AntiAnxiety™. {language === 'en' ? 'All rights reserved.' : '保留所有权利。'}
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                            {language === 'en' ? 'Privacy Policy' : '隐私政策'}
                        </Link>
                        <Link href="/terms" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                            {language === 'en' ? 'Terms of Service' : '服务条款'}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
