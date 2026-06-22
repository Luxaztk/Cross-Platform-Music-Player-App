import { createContext, useContext } from 'react';

export interface HotkeysContextType {
  isHotkeysModalOpen: boolean;
  openHotkeysModal: () => void;
  closeHotkeysModal: () => void;
}

export const HotkeysContext = createContext<HotkeysContextType | null>(null);

export const useHotkeysModal = () => {
  const context = useContext(HotkeysContext);
  if (!context) throw new Error('useHotkeysModal must be used within HotkeysProvider');
  return context;
};
