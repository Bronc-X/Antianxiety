'use client';

/**
 * Desktop Profile Presentational Component (The Skin - Desktop)
 */

import { useState } from 'react';
import Image from 'next/image';
import {
    Camera, User, Calendar, Target, Award,
    AlertCircle, RefreshCw, LogOut
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui';
import type { UseProfileReturn } from '@/hooks/domain/useProfile';

interface DesktopProfileProps {
    profile: UseProfileReturn;
    onLogout?: () => void;
}

function ProfileSkeleton() {
    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
            ))}
        </div>
    );
}

function StatCard({ icon, value, label, color }: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl p-4 border">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}

export function DesktopProfile({ profile: hook, onLogout }: DesktopProfileProps) {
    const {
        profile,
        isLoading,
        isSaving,
        isUploading,
        error,
        update,
        uploadPhoto,
        refresh
    } = hook;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        username: profile?.username || '',
    });
    const handleSave = async () => {
        const success = await update(formData);
        if (success) {
            setIsEditing(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadPhoto(file);
        }
    };

    if (isLoading || !profile) return <ProfileSkeleton />;

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refresh}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    {onLogout && (
                        <Button variant="outline" onClick={onLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </Button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Avatar & Name */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50">
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
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                            placeholder="First name"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                            placeholder="Last name"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        placeholder="Username"
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {profile.full_name || profile.first_name || 'User'}
                                    </h2>
                                    <p className="text-gray-500">@{profile.username || 'username'}</p>
                                    <p className="text-sm text-gray-400 mt-1">{profile.email}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit Profile
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    icon={<Calendar className="w-5 h-5 text-emerald-600" />}
                    value={new Date(profile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    label="Member Since"
                    color="bg-emerald-100"
                />
                <StatCard
                    icon={<Target className="w-5 h-5 text-amber-600" />}
                    value={profile.streak_days}
                    label="Day Streak"
                    color="bg-amber-100"
                />
                <StatCard
                    icon={<Award className="w-5 h-5 text-purple-600" />}
                    value={profile.total_logs}
                    label="Total Logs"
                    color="bg-purple-100"
                />
            </div>

            {/* Health Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Health Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Age</span>
                            <p className="font-medium">{profile.age || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Gender</span>
                            <p className="font-medium capitalize">{profile.gender || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Height</span>
                            <p className="font-medium">{profile.height ? `${profile.height} cm` : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Weight</span>
                            <p className="font-medium">{profile.weight ? `${profile.weight} kg` : '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Primary Goal</span>
                            <p className="font-medium capitalize">{profile.primary_goal?.replace(/_/g, ' ') || '-'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Language</span>
                            <p className="font-medium">{profile.language === 'zh' ? '中文' : 'English'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default DesktopProfile;
