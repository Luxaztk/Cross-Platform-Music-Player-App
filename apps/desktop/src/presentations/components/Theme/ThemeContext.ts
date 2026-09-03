import { createContext } from 'react';

export type ThemeType = 'midnight' | 'amoled' | 'nord' | 'rose' | 'ocean' | 'snow';

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  appIcon: string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
