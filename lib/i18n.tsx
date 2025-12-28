'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { type Language } from '@/lib/i18n-dict';
import {
  createTranslator,
  isLanguage,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  toHtmlLang,
} from '@/lib/i18n-core';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function readLanguageCookie(): Language | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE_KEY}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLanguage(value) ? value : null;
}

function writeLanguageCookie(language: Language) {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${encodeURIComponent(language)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  
  // Check navigator.language first (e.g., "zh-CN", "en-US")
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
  
  // If starts with 'zh', return Chinese
  if (browserLang.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  
  // Default to English for all other languages
  return 'en';
}

function normalizeClientLanguage(): Language {
  // 1. Check cookie first (user's explicit choice)
  const cookieLanguage = readLanguageCookie();
  if (cookieLanguage) return cookieLanguage;
  
  // 2. Check localStorage (previous session)
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(stored)) return stored;
  
  // 3. Detect from browser language
  return getBrowserLanguage();
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    writeLanguageCookie(lang);
    document.documentElement.lang = toHtmlLang(lang);
  }, []);

  useEffect(() => {
    // Check URL query parameter first (for development testing)
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (isLanguage(langParam)) {
      setLanguage(langParam);
      return;
    }

    const initialLanguage = normalizeClientLanguage();
    setLanguage(initialLanguage);
  }, [setLanguage]);

  const t = useMemo(() => createTranslator(language), [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { tr } from '@/lib/i18n-core';
export type { Language } from '@/lib/i18n-dict';

