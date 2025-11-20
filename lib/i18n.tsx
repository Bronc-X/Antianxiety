'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'zh' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻译字典
const translations: Record<Language, Record<string, string>> = {
  zh: {
    // 导航
    'nav.core': '核心功能',
    'nav.model': '科学模型',
    'nav.authority': '权威洞察',
    'nav.pricing': '升级',
    'nav.login': '登录',
    'nav.assistant': 'AI 助理',
    'nav.early': '获取早期访问权限',
    // 通用
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.close': '关闭',
  },
  en: {
    // 导航
    'nav.core': 'Core Features',
    'nav.model': 'Scientific Model',
    'nav.authority': 'Authority Insights',
    'nav.pricing': 'Upgrade',
    'nav.login': 'Login',
    'nav.assistant': 'AI Assistant',
    'nav.early': 'Get Early Access',
    // 通用
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'zh';
    }
    const savedLang = localStorage.getItem('app_language') as Language | null;
    if (savedLang === 'zh' || savedLang === 'en') {
      return savedLang;
    }
    return 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    // 更新html lang属性
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

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

