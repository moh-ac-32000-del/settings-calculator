import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadLanguage, saveLanguage, type AppLanguage } from './language-store';
import { formatLocalizedDate, formatLocalizedTime, isRTL, translate, type TranslationKey } from './i18n';

type I18nContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: TranslationKey) => string;
  setLanguage: (language: AppLanguage) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => loadLanguage());

  useEffect(() => {
    const apply = (next: AppLanguage) => {
      document.documentElement.lang = next;
      document.documentElement.dir = isRTL(next) ? 'rtl' : 'ltr';
      document.documentElement.dataset.language = next;
      setLanguageState(next);
    };
    apply(loadLanguage());

    const onLanguageChange = () => apply(loadLanguage());
    window.addEventListener('settings-calculator-language-change', onLanguageChange);
    return () => window.removeEventListener('settings-calculator-language-change', onLanguageChange);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    isRTL: isRTL(language),
    direction: isRTL(language) ? 'rtl' : 'ltr',
    t: (key) => translate(key, language),
    setLanguage: (next) => {
      saveLanguage(next);
      setLanguageState(next);
      document.documentElement.lang = next;
      document.documentElement.dir = isRTL(next) ? 'rtl' : 'ltr';
      document.documentElement.dataset.language = next;
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside LanguageProvider');
  return value;
}

export { formatLocalizedDate, formatLocalizedTime };
