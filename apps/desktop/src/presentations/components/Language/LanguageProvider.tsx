import React, { createContext, useState, type ReactNode } from 'react';
import { translations, type Language } from '@constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, variables?: Record<string, any>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (keyPath: string, variables?: Record<string, any>): string => {
    const keys = keyPath.split('.');
    let result: any = translations[language];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return keyPath; // Fallback to key if not found
      }
    }

    if (typeof result !== 'string') return keyPath;

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