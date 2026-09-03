import React, { useState, useEffect, type ReactNode } from 'react';
import type { IStorageAdapter } from '@music/core';
import app_icon_ios_dark from '@music/brand/logos/app_icon_ios_dark.png';
import app_icon_ios_light from '@music/brand/logos/app_icon_ios_light.png';
import { ThemeContext, type ThemeType } from './ThemeContext';
import './ThemeProvider.scss';

export const ThemeProvider: React.FC<{ children: ReactNode; storage?: IStorageAdapter }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('melovista-theme') as ThemeType;
      if (savedTheme) return savedTheme;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      return prefersLight ? 'nord' : 'midnight';
    }
    return 'midnight';
  });

  // Update body attribute and persist
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('melovista-theme', theme);

    // Sync theme to electron-store so Main Process knows the active theme for the next launch
    if (typeof window !== 'undefined' && window.electronAPI?.saveSettings) {
      window.electronAPI.saveSettings({ appearance: { theme } }).catch(() => {});
    }
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
