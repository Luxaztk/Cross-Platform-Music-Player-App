import React, { useState, useEffect, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type AppSettings } from '@constants';
import { SettingsContext } from '../hooks/SettingsContext';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const savedSettings = (await window.electronAPI.getSettings()) as AppSettings;
        if (isMounted && savedSettings) {
          setSettings(savedSettings);
        }
      } catch (err) {
        console.error('[Settings] Failed to load settings:', err);
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated: AppSettings = {
        general: { ...settings.general, ...(newSettings.general || {}) },
        appearance: { ...settings.appearance, ...(newSettings.appearance || {}) },
        audio: { ...settings.audio, ...(newSettings.audio || {}) },
        downloads: { ...settings.downloads, ...(newSettings.downloads || {}) },
        server: { ...(settings.server || DEFAULT_SETTINGS.server), ...(newSettings.server || {}) },
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
      const defaults = (await window.electronAPI.getSettings()) as AppSettings;
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, selectDirectory, isSaving }}>
      {children}
    </SettingsContext.Provider>
  );
};
