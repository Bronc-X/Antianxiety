'use client';

import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TestLanguageSwitcherPage() {
  const { t, language } = useI18n();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B3D2E] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0B3D2E] dark:text-white">
            Language Switcher Test
          </h1>
          <LanguageSwitcher />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Language:</p>
            <p className="text-xl font-semibold text-[#0B3D2E] dark:text-white">{language}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h2 className="text-lg font-semibold mb-4 text-[#0B3D2E] dark:text-white">
              Sample Translations
            </h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">nav.login</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('nav.login')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">nav.signup</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('nav.signup')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">common.save</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('common.save')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">common.cancel</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('common.cancel')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">settings.title</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('settings.title')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">plans.title</p>
                  <p className="text-[#0B3D2E] dark:text-white">{t('plans.title')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">landing.hello</p>
                <p className="text-[#0B3D2E] dark:text-white">{t('landing.hello')}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">login.welcome</p>
                <p className="text-[#0B3D2E] dark:text-white">{t('login.welcome')}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold mb-2 text-[#0B3D2E] dark:text-white">
              Instructions
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li>Click the language switcher above to change languages</li>
              <li>简体中文 (Simplified Chinese) - Original translations</li>
              <li>繁體中文 (Traditional Chinese) - New Traditional Chinese translations</li>
              <li>English - English translations</li>
              <li>The page will reload after switching to apply changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
