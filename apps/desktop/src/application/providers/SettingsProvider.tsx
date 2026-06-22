import React, { useState, useEffect, type ReactNode } from 'react';
import type { AppSettings } from '@constants';
import { SettingsContext } from '../hooks/SettingsContext';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await window.electronAPI.getSettings() as AppSettings;
      setSettings(savedSettings);
    };
    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = {
        general: { ...settings.general, ...(newSettings.general || {}) },
        appearance: { ...settings.appearance, ...(newSettings.appearance || {}) },
        audio: { ...settings.audio, ...(newSettings.audio || {}) },
        downloads: { ...settings.downloads, ...(newSettings.downloads || {}) },
      };

      await window.electronAPI.saveSettings(updated);
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
      await window.electronAPI.saveSettings({});
      const defaults = await window.electronAPI.getSettings() as AppSettings;
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
    return <div className="loading-screen" />;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, selectDirectory, isSaving }}>
      {children}
    </SettingsContext.Provider>
  );
};
