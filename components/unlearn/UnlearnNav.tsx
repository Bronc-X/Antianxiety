'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, User, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { createClientSupabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

interface NavLink {
    label: string;
    href: string;
}

interface UnlearnNavProps {
    links?: NavLink[];
    ctaLabel?: string;
    ctaHref?: string;
    isAppNav?: boolean; // 是否是应用内导航（已登录状态）
}

export default function UnlearnNav({
    links,
    ctaLabel = 'Get Started',
    ctaHref = '/signup',
    isAppNav = false,
}: UnlearnNavProps) {
    const { language, t } = useI18n();
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(isAppNav);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const loginLabel = language === 'en' ? 'Sign In' : '登录';
    const logoutLabel = t('userMenu.logout');
    const fallbackLinks: NavLink[] = language === 'en'
        ? [
            { label: 'Product', href: '#product' },
            { label: 'Max', href: '#max' },
            { label: 'Science', href: '#science' },
            { label: 'About', href: '#about' },
            { label: 'News', href: '#news' },
        ]
        : [
            { label: '产品', href: '#product' },
            { label: 'Max', href: '#max' },
            { label: '科学', href: '#science' },
            { label: '关于', href: '#about' },
            { label: '资讯', href: '#news' },
        ];
    const resolvedLinks = links && links.length > 0 ? links : fallbackLinks;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 检查登录状态并获取用户信息
    useEffect(() => {
        const supabase = createClientSupabaseClient();

        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(true);
                // 获取用户头像和名称
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('avatar_url, display_name, full_name')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setUserAvatar(profile.avatar_url);
                    setUserName(profile.display_name || profile.full_name || session.user.email?.split('@')[0] || null);
                } else {
                    // 使用 user metadata 作为备选
                    setUserAvatar(session.user.user_metadata?.avatar_url || null);
                    setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null);
                }
            } else {
                setIsLoggedIn(false);
            }
        };

        fetchUserData();
    }, [isAppNav]);

    const handleLogout = async () => {
        const supabase = createClientSupabaseClient();
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setShowUserMenu(false);
        router.push('/');
        router.refresh();
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className={`
          fixed top-2 left-1/2 -translate-x-1/2 z-50
          flex items-center justify-between gap-8
          px-6 py-2.5
          bg-[#FAF6EF]/95 backdrop-blur-md
          border border-[#1A1A1A]/10
          transition-all duration-300
          ${isScrolled ? 'shadow-[0_8px_40px_rgba(0,0,0,0.1)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}
        `}
                style={{ width: 'min(90vw, 900px)' }}
            >
                {/* Logo */}
                <Logo
                    variant="dark"
                    href={isLoggedIn ? '/unlearn/app' : '/unlearn'}
                />

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6">
                    {resolvedLinks.map((link) => (
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
                    <div className="hidden md:flex items-center">
                        <LanguageSwitcher />
                    </div>

                    {isLoggedIn ? (
                        /* 已登录状态 - 显示用户菜单 */
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#0B3D2E] transition-colors"
                            >
                                <User className="w-5 h-5" />
                            </button>
                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#1A1A1A]/10 shadow-lg rounded-lg overflow-hidden">
                                    {/* 用户头像区域 - 只在有头像时显示 */}
                                    {userAvatar && (
                                        <div className="px-4 py-4 border-b border-[#1A1A1A]/10 bg-[#FAF6EF] flex justify-center">
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#0B3D2E]/20">
                                                <Image
                                                    src={userAvatar}
                                                    alt={userName || 'User'}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <Link
                                        href="/unlearn/app/settings"
                                        className="block px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FAF6EF] transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        {t('userMenu.settings')}
                                    </Link>

                                    <Link
                                        href="/onboarding/upgrade?from=menu"
                                        className="block px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#FAF6EF] transition-colors"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        {t('userMenu.upgrade')}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {logoutLabel}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 未登录状态 - 显示登录按钮 */
                        <Link
                            href="/login"
                            className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#0B3D2E] transition-colors"
                        >
                            {loginLabel}
                        </Link>
                    )}

                    {/* CTA 按钮 - 只在未登录且有明确 CTA 时显示 */}
                    {!isLoggedIn && ctaHref && (
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
                    )}

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
                            {resolvedLinks.map((link) => (
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
                            {isLoggedIn ? (
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-lg font-medium text-red-600 py-2 text-left flex items-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {logoutLabel}
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-[#1A1A1A]/70 py-2"
                                >
                                    {loginLabel}
                                </Link>
                            )}
                            <div className="pt-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
                                <span className="text-sm text-[#1A1A1A]/50">
                                    {language === 'en' ? 'Language' : '语言'}
                                </span>
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
