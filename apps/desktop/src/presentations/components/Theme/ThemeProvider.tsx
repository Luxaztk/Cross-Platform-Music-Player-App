import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { IStorageAdapter } from '@music/core';
import app_icon_ios_dark from '@music/brand/logos/app_icon_ios_dark.png';
import app_icon_ios_light from '@music/brand/logos/app_icon_ios_light.png';
import './ThemeProvider.scss';

export type ThemeType = 'midnight' | 'amoled' | 'nord' | 'rose' | 'ocean' | 'snow';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  appIcon: string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode; storage?: IStorageAdapter }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('midnight');

  // Initial load and sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('melovista-theme') as ThemeType;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // First run: detect OS preference
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      setThemeState(prefersLight ? 'nord' : 'midnight');
    }
  }, []);

  // Update body attribute and persist
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('melovista-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const appIcon = theme === 'snow' ? app_icon_ios_light : app_icon_ios_dark;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, appIcon }}>
      {children}
    </ThemeContext.Provider>
  );
};
