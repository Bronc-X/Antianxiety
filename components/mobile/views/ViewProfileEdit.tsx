"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    Camera,
    User,
    Mail,
    MapPin
} from "lucide-react";
import Image from "next/image";
import { useProfile } from "@/hooks/domain/useProfile";
import { useProfileSync } from "@/hooks/useProfileSync";
import { cn } from "@/lib/utils";

interface ViewProfileEditProps {
    onClose: () => void;
}

export const ViewProfileEdit = ({ onClose }: ViewProfileEditProps) => {
    const { profile, update, uploadPhoto, isSaving, isUploading, error } = useProfile();
    const { syncProfile } = useProfileSync();
    const [actionError, setActionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const displayNameRef = useRef<HTMLInputElement | null>(null);
    const bioRef = useRef<HTMLTextAreaElement | null>(null);
    const locationRef = useRef<HTMLInputElement | null>(null);
    const profileKey = profile?.id ?? "guest";

    const handleSave = async () => {
        setActionError(null);
        const displayNameValue = displayNameRef.current?.value ?? "";
        const bioValue = bioRef.current?.value ?? "";
        const locationValue = locationRef.current?.value ?? "";
        const trimmedName = displayNameValue.trim();
        if (!trimmedName) {
            setActionError("姓名不能为空");
            return;
        }

        const success = await update({
            full_name: trimmedName,
            location: locationValue.trim() || null,
            goal_focus_notes: bioValue.trim() || null,
        });

        if (!success) {
            setActionError("保存失败，请稍后重试");
            return;
        }

        void syncProfile();
        onClose();
    };

    const handleChangePhoto = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setActionError(null);

        const url = await uploadPhoto(file);
        if (!url) {
            setActionError("头像上传失败，请稍后重试");
        }

        event.target.value = "";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-[#EAE9E5] dark:bg-[#050505] flex flex-col"
        >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-200 dark:border-white/5 bg-[#EAE9E5] dark:bg-[#050505] sticky top-0 z-10">
                <button
                    onClick={onClose}
                    className="text-stone-500 font-medium hover:text-stone-800"
                >
                    Cancel
                </button>
                <h2 className="font-bold text-base text-emerald-950 dark:text-white">Edit Profile</h2>
                <button
                    onClick={handleSave}
                    className="text-emerald-600 font-bold hover:text-emerald-700 disabled:opacity-50"
                    disabled={isSaving || isUploading}
                >
                    {isSaving ? "Saving..." : "Done"}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {(actionError || error) && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError || error}
                    </div>
                )}

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <button
                        type="button"
                        onClick={handleChangePhoto}
                        className={cn(
                            "relative group cursor-pointer mb-3",
                            isUploading && "pointer-events-none opacity-70"
                        )}
                    >
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-stone-800 shadow-xl">
                            <Image
                                src={profile?.avatar_url || "https://i.pravatar.cc/150?u=admin"}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                alt="Avatar"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelected}
                    />
                    <button
                        type="button"
                        onClick={handleChangePhoto}
                        className="text-emerald-600 font-semibold text-sm disabled:opacity-60"
                        disabled={isUploading}
                    >
                        {isUploading ? "Uploading..." : "Change Photo"}
                    </button>
                </div>

                {/* Form Fields */}
                <div key={profileKey} className="space-y-6">

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Display Name</label>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <User size={20} className="text-stone-400" />
                            <input
                                ref={displayNameRef}
                                type="text"
                                defaultValue={profile?.full_name || profile?.nickname || ""}
                                className="flex-1 bg-transparent outline-none font-medium text-emerald-950 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Bio</label>
                        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 focus-within:border-emerald-500 transition-all">
                            <textarea
                                ref={bioRef}
                                rows={3}
                                defaultValue={profile?.goal_focus_notes || ""}
                                className="w-full bg-transparent outline-none font-medium text-emerald-950 dark:text-white resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Location</label>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10">
                            <MapPin size={20} className="text-stone-400" />
                            <input
                                ref={locationRef}
                                type="text"
                                defaultValue={profile?.location || ""}
                                className="flex-1 bg-transparent outline-none font-medium text-emerald-950 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-200 dark:border-white/5">
                        <h3 className="text-sm font-bold text-stone-800 dark:text-white mb-4">Private Information</h3>
                        <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 opacity-70">
                            <Mail size={20} className="text-stone-400" />
                            <input
                                type="text"
                                value={profile?.email || ""}
                                disabled
                                className="flex-1 bg-transparent outline-none font-medium text-stone-500"
                            />
                        </div>
                        <p className="text-xs text-stone-400 mt-2 ml-1">Email cannot be changed manually. Contact support.</p>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};
