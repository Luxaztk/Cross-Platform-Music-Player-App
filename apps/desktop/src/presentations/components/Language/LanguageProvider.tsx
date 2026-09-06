import React, { useState, type ReactNode } from 'react';
import { desktopTranslations as translations, type Language } from '@music/i18n';
import { LanguageContext } from './LanguageContext';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (keyPath: string, options?: Record<string, unknown> | string): string => {
    const keys = keyPath.split('.');
    let result: unknown = translations[language];

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        result = undefined;
        break;
      }
    }

    // Fallback to Vietnamese dictionary if missing in current language
    if (typeof result !== 'string' && language !== 'vi') {
      let fallbackResult: unknown = translations['vi'];
      for (const key of keys) {
        if (fallbackResult && typeof fallbackResult === 'object' && key in fallbackResult) {
          fallbackResult = (fallbackResult as Record<string, unknown>)[key];
        } else {
          fallbackResult = undefined;
          break;
        }
      }
      if (typeof fallbackResult === 'string') {
        result = fallbackResult;
      }
    }

    if (typeof result !== 'string') {
      if (typeof options === 'string') return options;
      if (options && typeof options === 'object' && typeof options.defaultValue === 'string') {
        return options.defaultValue;
      }
      return keyPath; // Fallback to key if not found
    }

    // Replace variables if provided
    if (options && typeof options === 'object') {
      let templated = result;
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'defaultValue') {
          const strVal = String(value);
          templated = templated.split(`{{${key}}}`).join(strVal).split(`{${key}}`).join(strVal);
        }
      });
      return templated;
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};