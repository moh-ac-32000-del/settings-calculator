export type AppLanguage = 'ar' | 'tr' | 'en';
export const LANGUAGE_STORAGE_KEY = 'settings-calculator-language';
export function loadLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ar';
  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value === 'tr' || value === 'en' ? value : 'ar';
}
export function saveLanguage(language: AppLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new Event('settings-calculator-language-change'));
}
