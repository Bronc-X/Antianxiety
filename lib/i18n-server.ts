import { cookies } from 'next/headers';
import { createTranslator, isLanguage, LANGUAGE_COOKIE_KEY, type Language } from '@/lib/i18n-core';

export async function getServerLanguage(defaultLanguage: Language = 'zh'): Promise<Language> {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  if (isLanguage(cookieLanguage)) return cookieLanguage;
  return defaultLanguage;
}

export async function getServerT(defaultLanguage: Language = 'zh') {
  return createTranslator(await getServerLanguage(defaultLanguage));
}
