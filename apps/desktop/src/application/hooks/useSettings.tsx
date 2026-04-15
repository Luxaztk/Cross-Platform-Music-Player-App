import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppSettings } from '../../../electron/constants/SettingsConstants';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: any) => Promise<void>;
  resetSettings: () => Promise<void>;
  selectDirectory: (title?: string) => Promise<string | null>;
  isSaving: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await window.electronAPI.getSettings();
      setSettings(savedSettings);
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: any) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // Reconstruct nested structure with deep merge
      const updated = {
        general: { ...settings.general, ...(newSettings.general || {}) },
        appearance: { ...settings.appearance, ...(newSettings.appearance || {}) },
        audio: { ...settings.audio, ...(newSettings.audio || {}) },
        downloads: { ...settings.downloads, ...(newSettings.downloads || {}) },
      };

      await window.electronAPI.saveSettings(newSettings);
      setSettings(updated as AppSettings);
    } catch (err) {
      console.error('[Settings] Failed to save settings:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const resetSettings = async () => {
    setIsSaving(true);
    try {
      // Passing empty object or specific reset flag if backend supports it
      // Based on MainStorageAdapter logic, saveSettings({}) will merge with defaults
      // But to be sure, we can pass a "reset" command or just all defaults.
      // For now, we rely on the backend validation logic.
      await window.electronAPI.saveSettings({});
      const defaults = await window.electronAPI.getSettings();
      setSettings(defaults);
    } catch (err) {
      console.error('[Settings] Failed to reset settings:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const selectDirectory = async (title?: string) => {
    return await window.electronAPI.selectDirectory(title);
  };

  if (!settings) {
    return <div className="loading-screen">Loading Settings...</div>;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, selectDirectory, isSaving }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};