'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n, type Language } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setIsOpen(false);
    // Force page refresh to apply translations
    window.location.reload();
  };

  const languageOptions = [
    { code: 'zh' as Language, label: '简体中文', shortLabel: '简' },
    { code: 'zh-TW' as Language, label: '繁體中文', shortLabel: '繁' },
    { code: 'en' as Language, label: 'English', shortLabel: 'EN' },
  ];

  const currentLanguage = languageOptions.find(opt => opt.code === language);
  const displayText = mounted ? (currentLanguage?.shortLabel || 'EN') : 'EN';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1 px-2 py-1 rounded-md hover:bg-[#0B3D2E]/10 dark:hover:bg-white/10 transition-colors text-sm font-medium text-[#0B3D2E] dark:text-white"
        aria-label="Switch language"
        title="Switch language"
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
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && mounted && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                language === option.code
                  ? 'text-[#0B3D2E] dark:text-white font-medium bg-gray-50 dark:bg-gray-800/50'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
              {language === option.code && (
                <span className="ml-2 text-[#0B3D2E] dark:text-white">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
