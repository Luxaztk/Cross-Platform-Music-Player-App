import { createContext } from 'react';
import type { AppSettings } from '@constants';

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: any) => Promise<void>;
  resetSettings: () => Promise<void>;
  selectDirectory: (title?: string) => Promise<string | null>;
  isSaving: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
