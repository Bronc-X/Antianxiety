'use client';

/**
 * Mobile Profile Presentational Component (The Skin - Mobile)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Camera, User, Calendar, Target, Award, ChevronRight,
    WifiOff, AlertCircle, LogOut, Edit3
} from 'lucide-react';
import { useHaptics, ImpactStyle } from '@/hooks/useHaptics';
import type { UseProfileReturn } from '@/hooks/domain/useProfile';

interface MobileProfileProps {
    profile: UseProfileReturn;
    onLogout?: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
    return (
        <div className="flex-1 bg-white rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
                {icon}
            </div>
            <p className="text-lg font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    );
}

function ProfileRow({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full flex items-center justify-between px-4 py-3.5"
        >
            <span className="text-gray-500">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-gray-900">{value}</span>
                {onClick && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
        </motion.button>
    );
}

export function MobileProfile({ profile: hook, onLogout }: MobileProfileProps) {
    const {
        profile,
        isLoading,
        isSaving,
        isUploading,
        isOffline,
        error,
        update,
        uploadPhoto
    } = hook;

    const { impact, notification } = useHaptics();
    const [showEditSheet, setShowEditSheet] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
    });

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await impact(ImpactStyle.Medium);
            await uploadPhoto(file);
        }
    };

    const handleEdit = async () => {
        await impact(ImpactStyle.Light);
        setFormData({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            username: profile?.username || '',
        });
        setShowEditSheet(true);
    };

    const handleSave = async () => {
        await impact(ImpactStyle.Medium);
        const success = await update(formData);
        if (success) {
            await notification('success');
            setShowEditSheet(false);
        }
    };

    if (isLoading || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 space-y-4">
                <div className="bg-gray-200 h-32 rounded-2xl animate-pulse" />
                <div className="bg-gray-200 h-24 rounded-2xl animate-pulse" />
                <div className="bg-gray-200 h-48 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Offline Banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2"
                    >
                        <WifiOff className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Offline mode</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-4"
            >
                {/* Avatar Section */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        fill
                                        sizes="96px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {profile.full_name || profile.first_name || 'User'}
                        </h2>
                        <p className="text-gray-500">@{profile.username || 'username'}</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEdit}
                            className="mt-4 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Profile
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div variants={itemVariants} className="flex gap-3">
                    <StatBadge
                        icon={<Calendar className="w-5 h-5 text-emerald-600" />}
                        value={new Date(profile.member_since).toLocaleDateString('en-US', { month: 'short' })}
                        label="Joined"
                    />
                    <StatBadge
                        icon={<Target className="w-5 h-5 text-amber-600" />}
                        value={profile.streak_days}
                        label="Streak"
                    />
                    <StatBadge
                        icon={<Award className="w-5 h-5 text-purple-600" />}
                        value={profile.total_logs}
                        label="Logs"
                    />
                </motion.div>

                {/* Details */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
                    <ProfileRow label="Email" value={profile.email} />
                    <ProfileRow label="Age" value={profile.age?.toString() || '-'} />
                    <ProfileRow label="Gender" value={profile.gender || '-'} />
                    <ProfileRow label="Primary Goal" value={profile.primary_goal?.replace(/_/g, ' ') || '-'} />
                    <ProfileRow label="Language" value={profile.language === 'zh' ? '中文' : 'English'} />
                </motion.div>

                {/* Logout */}
                {onLogout && (
                    <motion.button
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                            await impact(ImpactStyle.Medium);
                            onLogout();
                        }}
                        className="w-full py-4 bg-red-50 rounded-2xl text-red-600 font-medium flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </motion.button>
                )}
            </motion.div>

            {/* Edit Sheet */}
            <AnimatePresence>
                {showEditSheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditSheet(false)}
                            className="fixed inset-0 bg-black/40 z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10"
                        >
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-semibold mb-6">Edit Profile</h3>

                            <div className="space-y-4 mb-6">
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    placeholder="First name"
                                    className="w-full px-4 py-3 bg-gray-100 rounded-xl"
                                />
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    placeholder="Last name"
                                    className="w-full px-4 py-3 bg-gray-100 rounded-xl"
                                />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="Username"
                                    className="w-full px-4 py-3 bg-gray-100 rounded-xl"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-medium"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MobileProfile;
