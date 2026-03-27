import React, { createContext, useContext, type ReactNode } from 'react';
import './ThemeProvider.scss';

interface ThemeContextType {
  // Can add theme state here if needed in future (e.g. brightness)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
