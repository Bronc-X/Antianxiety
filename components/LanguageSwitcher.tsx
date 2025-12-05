'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    // Force page refresh to apply translations
    window.location.reload();
  };

  const label = mounted 
    ? (language === 'zh' ? 'Switch to English' : '切换到中文')
    : 'Language';

  const displayText = mounted ? (language === 'zh' ? 'EN' : '中') : 'EN';

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center gap-1 px-2 py-1 rounded-md hover:bg-[#0B3D2E]/10 transition-colors text-sm font-medium text-[#0B3D2E]"
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span suppressHydrationWarning>{displayText}</span>
    </button>
  );
}
