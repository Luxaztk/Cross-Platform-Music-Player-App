import React, { createContext, useContext, type ReactNode } from 'react';
import { translations, type Language } from './translations';
import { useSettings } from '../../../application/hooks/useSettings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string, variables?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const language = (settings.general.language as Language) || 'vi';

  const setLanguage = (lang: Language) => {
    updateSettings({ general: { language: lang, notifications: settings.general.notifications } });
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

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
