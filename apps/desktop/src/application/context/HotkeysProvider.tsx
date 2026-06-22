import React, { useState } from 'react';
import { HotkeysContext } from './HotkeysContext';

export const HotkeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <HotkeysContext.Provider value={{
      isHotkeysModalOpen: isOpen,
      openHotkeysModal: () => setIsOpen(true),
      closeHotkeysModal: () => setIsOpen(false),
    }}>
      {children}
    </HotkeysContext.Provider>
  );
};
