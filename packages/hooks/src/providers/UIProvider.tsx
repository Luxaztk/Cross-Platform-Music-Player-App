import React, { useState, type ReactNode } from 'react';
import { UIContext } from '../UIContext';






export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const toggleLyrics = () => setIsLyricsOpen(prev => !prev);
  const setLyricsOpen = (open: boolean) => setIsLyricsOpen(open);

  return (
    <UIContext.Provider value={{ isLyricsOpen, toggleLyrics, setLyricsOpen }}>
      {children}
    </UIContext.Provider>
  );
};

