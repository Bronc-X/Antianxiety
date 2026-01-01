'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import BrutalistNav from './BrutalistNav';
import { User, Lock, Watch, Activity, Check, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/domain/useAuth';
import { useProfile } from '@/hooks/domain/useProfile';

export default function BrutalistProfile() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const { user, isLoading: authLoading, error: authError, updatePassword } = useAuth();
    const { profile, isLoading: profileLoading, error: profileError, update } = useProfile();
    const isLoading = authLoading || profileLoading;

    // Form States
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Wearable Mock States
    const [ouraConnected, setOuraConnected] = useState(false);
    const [fitbitConnected, setFitbitConnected] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/brutalist/signup');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setNickname((profile as any).nickname || '');
        }
    }, [profile]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const success = await update({
                full_name: fullName,
                nickname: nickname,
            });

            if (!success) {
                setMessage({ type: 'error', text: profileError || 'Failed to update profile' });
                return;
            }
            setMessage({ type: 'success', text: 'Profile updated successfully' });

            // Update password if provided
            if (password) {
                const updated = await updatePassword(password);
                if (!updated) {
                    setMessage({ type: 'error', text: authError || 'Failed to update password' });
                    return;
                }
                setMessage({ type: 'success', text: 'Profile and password updated successfully' });
                setPassword('');
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const toggleWearable = (type: 'oura' | 'fitbit') => {
        if (type === 'oura') setOuraConnected(!ouraConnected);
        if (type === 'fitbit') setFitbitConnected(!fitbitConnected);
        // In real app, this would redirect to OAuth flow
    };

    if (isLoading) return <div className="min-h-screen bg-[var(--brutalist-bg)] animate-pulse" />;

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />
            <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="brutalist-h2 mb-4">Settings</h1>
                    <p className="border-l-2 border-[var(--signal-green)] pl-4 text-[var(--brutalist-muted)] font-mono text-sm max-w-xl">
                        manage your digital twin parameters and integrations. verify your identity.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column: Profile & Security */}
                    <div className="space-y-12">
                        {/* Profile Section */}
                        <section>
                            <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-[var(--brutalist-border)]">
                                <User className="w-4 h-4" /> Identity Protocol
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--brutalist-border)] py-2 focus:border-[var(--signal-green)] outline-none font-mono"
                                        placeholder="ENTER NAME"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">Nickname (For Max)</label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="w-full bg-transparent border-b border-[var(--brutalist-border)] py-2 focus:border-[var(--signal-green)] outline-none font-mono"
                                        placeholder="ENTER NICKNAME"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">Email Address</label>
                                    <div className="font-mono text-sm text-[var(--brutalist-muted)] py-2 border-b border-dashed border-[var(--brutalist-border)]">
                                        {user?.email}
                                        <span className="ml-2 text-[10px] bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] px-1">VERIFIED</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Security Section */}
                        <section>
                            <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-[var(--brutalist-border)]">
                                <Lock className="w-4 h-4" /> Security Layer
                            </h3>
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[var(--brutalist-muted)] mb-2">New Password (Optional)</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-b border-[var(--brutalist-border)] py-2 focus:border-[var(--signal-green)] outline-none font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                        </section>

                        <div className="pt-4">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="brutalist-cta brutalist-cta-filled w-full justify-center"
                            >
                                {saving ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 mt-4 text-sm font-mono border ${message.type === 'success' ? 'border-[var(--signal-green)] text-[var(--signal-green)]' : 'border-red-500 text-red-500'}`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Integrations & Privacy */}
                    <div className="space-y-12">
                        {/* Integrations Section */}
                        <section>
                            <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-[var(--brutalist-border)]">
                                <Activity className="w-4 h-4" /> Bio-Metric Sources
                            </h3>
                            <div className="space-y-4">
                                {/* Oura Card */}
                                <div className={`border p-6 transition-all ${ouraConnected ? 'border-[var(--signal-green)] bg-[var(--signal-green)]/5' : 'border-[var(--brutalist-border)] hover:border-[var(--brutalist-muted)]'}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif">Ō</div>
                                            <span className="font-bold">Oura Ring</span>
                                        </div>
                                        {ouraConnected && <Check className="w-5 h-5 text-[var(--signal-green)]" />}
                                    </div>
                                    <p className="text-xs text-[var(--brutalist-muted)] mb-6 leading-relaxed">
                                        Syncs Sleep, Readiness, and Activity scores. High fidelity recovery tracking.
                                    </p>
                                    <button
                                        onClick={() => toggleWearable('oura')}
                                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${ouraConnected
                                            ? 'border-[var(--signal-green)] text-[var(--signal-green)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                                            : 'border-[var(--brutalist-fg)] bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] hover:bg-transparent hover:text-[var(--brutalist-fg)]'}`}
                                    >
                                        {ouraConnected ? 'Disconnect' : 'Connect Protocol'}
                                    </button>
                                </div>

                                {/* Fitbit Card */}
                                <div className={`border p-6 transition-all ${fitbitConnected ? 'border-[var(--signal-green)] bg-[var(--signal-green)]/5' : 'border-[var(--brutalist-border)] hover:border-[var(--brutalist-muted)]'}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Watch className="w-6 h-6" />
                                            <span className="font-bold">Fitbit</span>
                                        </div>
                                        {fitbitConnected && <Check className="w-5 h-5 text-[var(--signal-green)]" />}
                                    </div>
                                    <p className="text-xs text-[var(--brutalist-muted)] mb-6 leading-relaxed">
                                        Syncs HRV, Sleep, and Steps. Broad device compatibility.
                                    </p>
                                    <button
                                        onClick={() => toggleWearable('fitbit')}
                                        className={`w-full py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${fitbitConnected
                                            ? 'border-[var(--signal-green)] text-[var(--signal-green)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                                            : 'border-[var(--brutalist-fg)] bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] hover:bg-transparent hover:text-[var(--brutalist-fg)]'}`}
                                    >
                                        {fitbitConnected ? 'Disconnect' : 'Connect Protocol'}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Data Privacy Section */}
                        <section>
                            <h3 className="flex items-center gap-2 font-bold uppercase tracking-widest text-sm mb-6 pb-2 border-b border-[var(--brutalist-border)]">
                                <Shield className="w-4 h-4" /> Data Sovereignty
                            </h3>
                            <div className="p-4 border border-[var(--brutalist-border)] bg-[var(--brutalist-muted)]/5">
                                <p className="text-[10px] font-mono leading-relaxed mb-4">
                                    YOUR DATA IS ENCRYPTED AT REST AND IN TRANSIT. WE DO NOT SELL BIO-METRIC DATA TO THIRD PARTIES. YOU RETAIN FULL OWNERSHIP.
                                </p>
                                <button className="text-xs font-bold underline decoration-[var(--signal-green)] hover:text-[var(--signal-green)]">
                                    EXPORT ALL DATA (JSON)
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
                {(profileError || authError) && (
                    <div className="mt-8 text-center text-xs text-red-400">{profileError || authError}</div>
                )}
            </main>
        </div>
    );
}
