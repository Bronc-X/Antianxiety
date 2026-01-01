"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    X,
    Check,
    Camera,
    User,
    Mail,
    MapPin,
    Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewProfileEditProps {
    onClose: () => void;
}

export const ViewProfileEdit = ({ onClose }: ViewProfileEditProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
        }, 1500);
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
                    disabled={isLoading}
                >
                    {isLoading ? "Saving..." : "Done"}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer mb-3">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-stone-800 shadow-xl">
                            <img src="https://i.pravatar.cc/150?u=admin" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Avatar" />
                        </div>
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <button className="text-emerald-600 font-semibold text-sm">Change Photo</button>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Display Name</label>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <User size={20} className="text-stone-400" />
                            <input type="text" defaultValue="Dr. Broncin" className="flex-1 bg-transparent outline-none font-medium text-emerald-950 dark:text-white" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Bio</label>
                        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 focus-within:border-emerald-500 transition-all">
                            <textarea rows={3} defaultValue="Focusing on mindfulness and circadian health." className="w-full bg-transparent outline-none font-medium text-emerald-950 dark:text-white resize-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider ml-1">Location</label>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10">
                            <MapPin size={20} className="text-stone-400" />
                            <input type="text" defaultValue="Shanghai, China" className="flex-1 bg-transparent outline-none font-medium text-emerald-950 dark:text-white" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-200 dark:border-white/5">
                        <h3 className="text-sm font-bold text-stone-800 dark:text-white mb-4">Private Information</h3>
                        <div className="flex items-center gap-3 p-4 bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 opacity-70">
                            <Mail size={20} className="text-stone-400" />
                            <input type="text" defaultValue="user@example.com" disabled className="flex-1 bg-transparent outline-none font-medium text-stone-500" />
                        </div>
                        <p className="text-xs text-stone-400 mt-2 ml-1">Email cannot be changed manually. Contact support.</p>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};
