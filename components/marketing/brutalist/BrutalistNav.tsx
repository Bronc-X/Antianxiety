'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Menu, X, LogOut, User } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import BrutalistThemeSwitcher from './BrutalistThemeSwitcher';

interface NavLink {
    href: string;
    label: string;
    requiresAuth?: boolean;
}

const navLinks: NavLink[] = [
    { href: '/brutalist/dashboard', label: 'Dashboard', requiresAuth: true },
    { href: '/brutalist/max', label: 'Max', requiresAuth: true },
    { href: '/brutalist/calibration', label: 'Calibrate', requiresAuth: true },
    { href: '/brutalist/plans', label: 'Plans', requiresAuth: true },
    { href: '/brutalist/feed', label: 'Radio', requiresAuth: true },
];

export default function BrutalistNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClientComponentClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/brutalist');
    };

    const filteredLinks = navLinks.filter(link => !link.requiresAuth || user);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--brutalist-bg)]/95 backdrop-blur-sm border-b border-[var(--brutalist-border)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <a href="/brutalist" className="text-xl font-bold tracking-tighter">
                            Anti-Anxiety
                        </a>
                    </motion.div>

                    {/* Desktop Nav */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="hidden md:flex items-center gap-6"
                    >
                        {/* Nav Links */}
                        {filteredLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium hover:text-[var(--signal-green)] transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}

                        <div className="w-px h-6 bg-[var(--brutalist-border)]" />

                        {/* Theme Switcher */}
                        <BrutalistThemeSwitcher />

                        {/* Auth Section */}
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-3">
                                    <div className="brutalist-badge hover:bg-[var(--signal-green)]/10 cursor-pointer transition-colors">
                                        <User className="w-3 h-3" />
                                        <a href="/brutalist/profile"><span className="hidden lg:inline">{user.email?.split('@')[0]}</span></a>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 hover:text-[var(--signal-green)] transition-colors"
                                        title="Log out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <a href="/brutalist/signup" className="brutalist-cta text-xs py-2 px-4">
                                    Sign Up
                                </a>
                            )
                        )}

                        {/* Privacy Badge */}
                        <div className="brutalist-badge hidden lg:flex">
                            <Lock className="w-3 h-3" />
                            <span>Local</span>
                        </div>
                    </motion.div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-x-0 top-[73px] z-40 bg-[var(--brutalist-bg)] border-b border-[var(--brutalist-border)] md:hidden"
                    >
                        <div className="px-6 py-6 space-y-4">
                            {filteredLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="block text-lg font-medium hover:text-[var(--signal-green)] transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}

                            <div className="pt-4 border-t border-[var(--brutalist-border)] flex items-center justify-between">
                                <BrutalistThemeSwitcher />
                                {!loading && !user && (
                                    <a href="/brutalist/signup" className="brutalist-cta text-xs py-2 px-4">
                                        Sign Up
                                    </a>
                                )}
                                {user && (
                                    <button
                                        onClick={handleLogout}
                                        className="brutalist-cta text-xs py-2 px-4"
                                    >
                                        Log Out
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
