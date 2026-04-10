import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import app_icon_ios_dark from '@music/brand/logos/app_icon_ios_dark.png';
import app_icon_ios_light from '@music/brand/logos/app_icon_ios_light.png';
import { useSettings } from '../../../application/hooks/useSettings';
import './ThemeProvider.scss';

export type ThemeType = 'midnight' | 'amoled' | 'nord' | 'rose' | 'ocean' | 'snow';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  appIcon: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const theme = (settings.appearance.theme as ThemeType) || 'midnight';

  // Update body attribute
  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    updateSettings({ appearance: { theme: newTheme } });
  };

  const appIcon = theme === 'snow' ? app_icon_ios_light : app_icon_ios_dark;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, appIcon }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
