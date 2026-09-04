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
        if (typeof options === 'string') return options;
        if (options && typeof options === 'object' && typeof options.defaultValue === 'string') {
          return options.defaultValue;
        }
        return keyPath; // Fallback to key if not found
      }
    }

    if (typeof result !== 'string') {
      if (typeof options === 'string') return options;
      if (options && typeof options === 'object' && typeof options.defaultValue === 'string') {
        return options.defaultValue;
      }
      return keyPath;
    }

    let variables: Record<string, unknown> | undefined;
    if (options && typeof options === 'object') {
      variables = options;
    }

    // Replace variables if provided
    if (variables) {
      let templated = result;
      Object.entries(variables).forEach(([key, value]) => {
        templated = templated.replace(`{${key}}`, String(value));
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