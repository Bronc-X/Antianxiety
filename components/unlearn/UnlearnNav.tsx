'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavLink {
    label: string;
    href: string;
}

interface UnlearnNavProps {
    links?: NavLink[];
    ctaLabel?: string;
    ctaHref?: string;
}

const defaultLinks: NavLink[] = [
    { label: 'Product', href: '#product' },
    { label: 'Science', href: '#science' },
    { label: 'About', href: '#about' },
    { label: 'News', href: '#news' },
];

export default function UnlearnNav({
    links = defaultLinks,
    ctaLabel = 'Get Started',
    ctaHref = '/signup',
}: UnlearnNavProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className={`
          fixed top-4 left-1/2 -translate-x-1/2 z-50
          flex items-center justify-between gap-8
          px-6 py-3
          bg-[#FAF6EF]/95 backdrop-blur-md
          border border-[#1A1A1A]/10
          transition-all duration-300
          ${isScrolled ? 'shadow-[0_8px_40px_rgba(0,0,0,0.1)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}
        `}
                style={{ width: 'min(90vw, 900px)' }}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-[#0B3D2E] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="font-semibold text-[#1A1A1A] hidden sm:block">
                        Antianxiety
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#0B3D2E] transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#0B3D2E] transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href={ctaHref}
                        className="
              flex items-center gap-2
              px-4 py-2.5
              bg-[#0B3D2E] text-white
              text-sm font-medium
              hover:bg-[#0a3427]
              transition-all duration-300
              hover:-translate-y-0.5
              hover:shadow-[0_4px_20px_rgba(11,61,46,0.3)]
            "
                    >
                        {ctaLabel}
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-[#1A1A1A]"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="
              fixed top-20 left-4 right-4 z-40
              bg-[#FAF6EF]/95 backdrop-blur-md
              border border-[#1A1A1A]/10
              p-6
              md:hidden
            "
                    >
                        <div className="flex flex-col gap-4">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-[#1A1A1A] py-2"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="border-[#1A1A1A]/10 my-2" />
                            <Link
                                href="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-lg font-medium text-[#1A1A1A]/70 py-2"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
