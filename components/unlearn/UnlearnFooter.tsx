'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Youtube } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Logo from './Logo';
import TermPopover from './TermPopover';

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
    className?: string;
    logoHref?: string;
    theme?: 'dark' | 'light';
}

export default function UnlearnFooter({
    socialLinks = {},
    className = "",
    logoHref = "/unlearn",
    theme = 'dark',
}: UnlearnFooterProps) {
    const { language } = useI18n();

    const textColor = theme === 'light' ? 'text-[#0B3D2E]/60' : 'text-white/60';
    const hoverColor = theme === 'light' ? 'hover:text-[#0B3D2E]' : 'hover:text-white';
    const headingColor = theme === 'light' ? 'text-[#0B3D2E]' : 'text-white';

    const footerSections: Array<{ title: string; links: FooterLink[] }> = language === 'en'
        ? [
            {
                title: 'Company',
                links: [
                    { label: 'About', href: '/about' },
                    { label: 'Careers', href: '/careers' },
                    { label: 'Special Thanks', href: '/thanks' },
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
                    { label: '特别鸣谢', href: '/thanks' },
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

    const footerBg = theme === 'light' ? 'transparent' : '#0B3D2E';

    return (
        <footer className={`relative z-10 ${className}`} style={{ backgroundColor: className.includes('bg-') ? undefined : footerBg }}>
            <div className="max-w-[1280px] mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <div className="mb-4">
                            <Logo variant="light" size="lg" href={logoHref} />
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-6">
                            {language === 'en'
                                ? 'Redefining mental health through the power of AI and personalized care.'
                                : '以 AI 与个性化关怀重新定义心理健康。'}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Twitter, href: socialLinks.twitter },
                                { icon: Linkedin, href: socialLinks.linkedin },
                                { icon: Youtube, href: socialLinks.youtube }
                            ].map((social, i) => social.href && (
                                <a
                                    key={i}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-10 h-10 border ${theme === 'light' ? 'border-[#0B3D2E]/20' : 'border-white/20'} flex items-center justify-center ${textColor} ${hoverColor} hover:border-[#D4AF37] transition-colors`}
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    {footerSections.map((section, idx) => (
                        <div key={idx} className="col-span-1">
                            <h4 className={`${headingColor} font-bold mb-6`}>{section.title}</h4>
                            <ul className="space-y-4">
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx} className="relative group">
                                        {link.href === '/thanks' ? (
                                            <div className="text-sm inline-block">
                                                <TermPopover
                                                    term={link.label}
                                                    title="特别鸣谢 (Special Thanks)"
                                                    description={
                                                        <div className="flex flex-col items-center gap-3 pt-2">
                                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm shrink-0">
                                                                <img
                                                                    src="/images/ni-baobao.jpg"
                                                                    alt="Ni Baobao"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <span className="font-serif italic text-lg font-bold text-[#0B3D2E]">妮宝宝</span>
                                                                <p className="text-xs text-[#0B3D2E]/60 mt-1">首席精神支持官 (Chief Support Officer)</p>
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className={`${textColor} ${hoverColor} text-sm transition-colors cursor-pointer block`}
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className={`pt-8 border-t ${theme === 'light' ? 'border-[#0B3D2E]/10' : 'border-white/10'} flex flex-col md:flex-row justify-between items-center gap-4`}>
                    <p className={`${textColor} text-sm`}>
                        © 2024 Antianxiety Inc.
                    </p>
                    <div className="flex gap-8">
                        <span className={`${textColor} ${hoverColor} text-sm transition-colors cursor-pointer`} onClick={(e) => e.preventDefault()}>
                            {language === 'en' ? 'Privacy' : '隐私政策'}
                        </span>
                        <span className={`${textColor} ${hoverColor} text-sm transition-colors cursor-pointer`} onClick={(e) => e.preventDefault()}>
                            {language === 'en' ? 'Terms' : '服务条款'}
                        </span>
                        <span className={`${textColor} ${hoverColor} text-sm transition-colors cursor-pointer`} onClick={(e) => e.preventDefault()}>
                            {language === 'en' ? 'Security' : '安全'}
                        </span>
                        <span className={`${textColor} ${hoverColor} text-sm transition-colors cursor-pointer`} onClick={(e) => e.preventDefault()}>
                            {language === 'en' ? 'HIPAA' : 'HIPAA'}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
