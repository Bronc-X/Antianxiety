# Traditional Chinese (繁體中文) Support

## Overview

Traditional Chinese language support has been added to the application. Users can now switch between:
- **简体中文** (Simplified Chinese) - `zh`
- **繁體中文** (Traditional Chinese) - `zh-TW`
- **English** - `en`

## Implementation Details

### Files Modified

1. **`lib/i18n.tsx`**
   - Added `zh-TW` language type
   - Added Traditional Chinese translations for critical UI elements
   - Implemented fallback mechanism: if a `zh-TW` translation is missing, it falls back to `zh` (Simplified Chinese)

2. **`components/LanguageSwitcher.tsx`**
   - Upgraded from toggle button to dropdown menu
   - Now supports three languages instead of two
   - Shows checkmark for currently selected language
   - Displays language names in their native scripts

### Current Translation Status

✅ **Completed Sections:**
- Navigation (nav.*)
- Common UI elements (common.*)
- Login page (login.*)
- Signup page (signup.*)
- Landing page basics (landing.*)
- Essential settings (settings.title, settings.center, etc.)
- Essential pages (plans, analysis, assistant, bayesian)
- User menu (userMenu.*)

⚠️ **Partial/Fallback Sections:**
- All other translation keys fall back to Simplified Chinese
- This ensures the app works correctly even with incomplete translations

## Testing

A test page has been created at `/test-language-switcher` to verify:
- Language switching functionality
- Translation display for all three languages
- Fallback mechanism for missing translations

## Completing the Full Translation

To complete the Traditional Chinese translation, you have two options:

### Option 1: Manual Translation

Edit `lib/i18n.tsx` and add all missing translations to the `'zh-TW'` section. Follow the pattern of existing translations.

### Option 2: Automated Conversion (Recommended)

A script has been created at `scripts/convert-to-traditional.js` that can help convert Simplified Chinese to Traditional Chinese automatically.

**To use the script:**

```bash
node scripts/convert-to-traditional.js
```

This will:
1. Extract all Simplified Chinese translations
2. Convert them to Traditional Chinese using character mapping
3. Save the output to `scripts/zh-tw-translations.txt`

**Note:** Automated conversion may not be 100% accurate for all contexts. Manual review is recommended, especially for:
- Technical terms
- Brand names
- Context-specific phrases
- Hong Kong vs Taiwan terminology differences

### Character Mapping

The conversion script uses a comprehensive Simplified-to-Traditional character mapping. Common conversions include:

- 简 → 簡 (simple)
- 体 → 體 (body)
- 设 → 設 (set)
- 录 → 錄 (record)
- 验 → 驗 (verify)
- And 500+ more mappings...

## Fallback Mechanism

The `t()` translation function includes intelligent fallback:

```typescript
const t = useCallback((key: string): string => {
  // Try current language
  let translation = translations[language]?.[key];
  
  // Fallback to Simplified Chinese for Traditional Chinese
  if (!translation && language === 'zh-TW') {
    translation = translations.zh?.[key];
  }
  
  return translation || key;
}, [language]);
```

This ensures:
1. No broken UI if a translation is missing
2. Simplified Chinese serves as a readable fallback for Traditional Chinese users
3. Gradual translation completion is possible without breaking the app

## User Experience

### Language Switcher UI

The language switcher appears as a button with:
- Globe icon
- Current language code (简/繁/EN)
- Dropdown arrow

When clicked, it shows a dropdown menu with:
- 简体中文 (Simplified Chinese)
- 繁體中文 (Traditional Chinese)
- English

The currently selected language is highlighted and shows a checkmark (✓).

### Language Persistence

The selected language is:
- Stored in `localStorage` as `app_language`
- Applied to the HTML `lang` attribute
- Persisted across page reloads and sessions

## Future Improvements

1. **Complete Translation Coverage**
   - Add all remaining Traditional Chinese translations
   - Review automated conversions for accuracy

2. **Regional Variants**
   - Consider Hong Kong (zh-HK) vs Taiwan (zh-TW) terminology differences
   - Add region-specific translations if needed

3. **Translation Management**
   - Consider using a translation management system (e.g., i18next, Crowdin)
   - Enable community contributions for translations

4. **Performance**
   - Consider code-splitting translations to reduce bundle size
   - Lazy-load translation dictionaries

## Contributing

To add or improve Traditional Chinese translations:

1. Edit `lib/i18n.tsx`
2. Find the `'zh-TW'` section
3. Add or update translation keys
4. Test using `/test-language-switcher`
5. Submit a pull request

## References

- [Traditional vs Simplified Chinese](https://en.wikipedia.org/wiki/Traditional_Chinese_characters)
- [Language codes (BCP 47)](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)
- [React i18n best practices](https://react.i18next.com/)
