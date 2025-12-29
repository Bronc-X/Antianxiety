'use client';

import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

function SettingItem({ label, value, onClick, color }: { label: string; value?: string; onClick?: () => void; color?: string }) {
    return (
        <button
            onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light });
                onClick?.();
            }}
            className="w-full p-5 flex items-center justify-between border-b border-[#111111] hover:bg-[#0A0A0A] transition-colors group"
        >
            <span
                className="text-sm font-mono uppercase tracking-widest text-[#CCCCCC] group-hover:text-white transition-colors"
                style={{ color: color }}
            >
                {label}
            </span>
            <div className="flex items-center gap-2">
                {value && <span className="text-[10px] font-mono text-[#555555] tracking-widest">{value}</span>}
                <ChevronRight className="w-3 h-3 text-[#333333]" />
            </div>
        </button>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="px-5 py-2 bg-[#050505] border-y border-[#111111]">
            <span className="text-[9px] font-mono font-bold text-[#444444] tracking-widest uppercase">
                {title}
            </span>
        </div>
    );
}

export default function DarkSettings() {
    const { language } = useI18n();
    const [notifs, setNotifs] = useState(true);

    return (
        <div className="min-h-screen bg-black pt-12 pb-20">
            <div className="px-5 pb-6 border-b border-[#222222]">
                <h1 className="text-3xl font-sans font-bold tracking-tighter text-white">SYSTEM</h1>
                <p className="text-[10px] font-mono text-[#555555] mt-1 tracking-widest">CONFIG_V_1.0.4</p>
            </div>

            <SectionHeader title="USER PROFILE" />
            <SettingItem label="IDENTITY" value="BRONCIN_X" />
            <SettingItem label="BIO-METRICS" value="SYNCED" color="#00FF94" />

            <SectionHeader title="NOTIFICATIONS" />
            <button
                onClick={() => setNotifs(!notifs)}
                className="w-full p-5 flex items-center justify-between border-b border-[#111111] hover:bg-[#0A0A0A]"
            >
                <span className="text-sm font-mono uppercase tracking-widest text-[#CCCCCC]">PUSH ALERTS</span>
                <div className={`w-8 h-4 border transition-colors relative ${notifs ? 'border-[#00FF94] bg-[#00FF94]10' : 'border-[#333333]'}`}>
                    <div
                        className={`absolute top-0.5 bottom-0.5 w-3 bg-current transition-all ${notifs ? 'right-0.5 bg-[#00FF94]' : 'left-0.5 bg-[#333333]'}`}
                    />
                </div>
            </button>
            <SettingItem label="FREQUENCY" value="REAL-TIME" />

            <SectionHeader title="DEVICE" />
            <SettingItem label="WEARABLES" value="OURA_GEN3" color="#007AFF" />
            <SettingItem label="STORAGE" value="LOCAL_ONLY" />

            <SectionHeader title="DANGER ZONE" />
            <SettingItem label="RESET SYSTEM" color="#FF3B30" />
            <SettingItem label="LOGOUT" color="#FF3B30" />

            <div className="p-8 flex justify-center">
                <p className="text-[8px] font-mono text-[#333333] tracking-[0.2em] text-center">
                    COPYRIGHT 2024 ANTIANXIETY INC.<br />
                    ALL SYSTEMS NOMINAL
                </p>
            </div>
        </div>
    );
}
