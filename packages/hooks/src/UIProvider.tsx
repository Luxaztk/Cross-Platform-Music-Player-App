import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
  isLyricsOpen: boolean;
  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const toggleLyrics = () => setIsLyricsOpen(prev => !prev);
  const setLyricsOpen = (open: boolean) => setIsLyricsOpen(open);

  return (
    <UIContext.Provider value={{ isLyricsOpen, toggleLyrics, setLyricsOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
