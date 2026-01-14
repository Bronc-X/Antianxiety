'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BrutalistThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    const options = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'Auto' },
    ];

    return (
        <div className="flex items-center gap-1 p-1 border border-current/20 bg-current/5">
            {options.map(({ value, icon: Icon, label }) => {
                const isActive = theme === value;
                return (
                    <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`p-2 transition-all ${isActive
                                ? 'bg-[var(--signal-green)] text-black'
                                : 'hover:bg-current/10'
                            }`}
                        title={label}
                        aria-label={`Switch to ${label} theme`}
                    >
                        <Icon className="w-4 h-4" />
                    </button>
                );
            })}
        </div>
    );
}
