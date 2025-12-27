'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Twitter, Linkedin, Youtube, Github, Instagram } from 'lucide-react';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

interface UnlearnFooterProps {
    columns?: FooterColumn[];
    socialLinks?: {
        twitter?: string;
        linkedin?: string;
        youtube?: string;
        github?: string;
        instagram?: string;
    };
}

const defaultColumns: FooterColumn[] = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Security', href: '/security' },
            { label: 'Integrations', href: '/integrations' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Careers', href: '/careers' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Documentation', href: '/docs' },
            { label: 'Help Center', href: '/help' },
            { label: 'Community', href: '/community' },
            { label: 'Research', href: '/research' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Cookie Policy', href: '/cookies' },
        ],
    },
];

export default function UnlearnFooter({
    columns = defaultColumns,
    socialLinks = {},
}: UnlearnFooterProps) {
    const socialIcons = [
        { icon: Twitter, href: socialLinks.twitter, label: 'Twitter' },
        { icon: Linkedin, href: socialLinks.linkedin, label: 'LinkedIn' },
        { icon: Youtube, href: socialLinks.youtube, label: 'YouTube' },
        { icon: Github, href: socialLinks.github, label: 'GitHub' },
        { icon: Instagram, href: socialLinks.instagram, label: 'Instagram' },
    ].filter((s) => s.href);

    return (
        <footer
            className="relative"
            style={{ backgroundColor: '#1A081C', color: '#FFFFFF' }}
        >
            {/* Top Border Gradient */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(170,143,255,0.3), transparent)',
                }}
            />

            <div className="max-w-[1280px] mx-auto px-6 py-16">
                {/* Main Footer Grid */}
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#AA8FFF] rounded flex items-center justify-center">
                                <span className="text-[#1A081C] font-bold text-lg">A</span>
                            </div>
                            <span className="text-xl font-semibold">Antianxiety</span>
                        </Link>
                        <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
                            The world's first AI health coach designed to help you understand and manage anxiety through personalized, science-backed guidance.
                        </p>

                        {/* Social Links */}
                        {socialIcons.length > 0 && (
                            <div className="flex items-center gap-4">
                                {socialIcons.map(({ icon: Icon, href, label }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-[#AA8FFF] hover:bg-white/10 transition-all"
                                        aria-label={label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link Columns */}
                    {columns.map((column) => (
                        <div key={column.title}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
                                {column.title}
                            </h3>
                            <ul className="space-y-3">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/70 hover:text-[#AA8FFF] transition-colors"
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
                    <p className="text-sm text-white/50">
                        © {new Date().getFullYear()} Antianxiety. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-white/50">
                        <Link href="/privacy" className="hover:text-white/80 transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-white/80 transition-colors">
                            Terms
                        </Link>
                        <Link href="/cookies" className="hover:text-white/80 transition-colors">
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
