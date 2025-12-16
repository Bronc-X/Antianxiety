import { cnToTw } from '@/lib/zh-convert';
import { translations, type Language } from '@/lib/i18n-dict';

export type { Language } from '@/lib/i18n-dict';

export const LANGUAGE_STORAGE_KEY = 'app_language';
export const LANGUAGE_COOKIE_KEY = 'app_language';

export function isLanguage(value: unknown): value is Language {
  return value === 'zh' || value === 'zh-TW' || value === 'en';
}

export function isEnglish(language: Language): boolean {
  return language === 'en';
}

export function isChinese(language: Language): boolean {
  return language === 'zh' || language === 'zh-TW';
}

export function toHtmlLang(language: Language): string {
  if (language === 'en') return 'en';
  if (language === 'zh-TW') return 'zh-Hant';
  return 'zh-Hans';
}

export function translateKey(language: Language, key: string): string {
  if (language === 'en') {
    return translations.en?.[key] ?? translations.zh?.[key] ?? key;
  }

  if (language === 'zh') {
    return translations.zh?.[key] ?? key;
  }

  const direct = translations['zh-TW']?.[key];
  if (direct) return direct;

  const zh = translations.zh?.[key];
  if (zh) return cnToTw(zh);

  return key;
}

export function createTranslator(language: Language) {
  return (key: string) => translateKey(language, key);
}

type InlineTranslations = {
  zh: string;
  en: string;
  'zh-TW'?: string;
};

export function tr(language: Language, text: InlineTranslations): string {
  if (language === 'en') return text.en;
  if (language === 'zh') return text.zh;
  return text['zh-TW'] ?? cnToTw(text.zh);
}

export function maybeCnToTw(language: Language, input: string): string {
  return language === 'zh-TW' ? cnToTw(input) : input;
}
