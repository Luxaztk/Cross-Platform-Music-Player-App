import React from 'react';
import { useSettings, useLanguage } from '@hooks';
import { RotateCcw, Languages } from 'lucide-react';

interface GeneralSectionProps {
  searchQuery?: string;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ searchQuery }) => {
  const { t, setLanguage } = useLanguage();
  const { settings, resetSettings, isSaving } = useSettings();

  const handleReset = () => {
    if (window.confirm(t('settings.general.resetConfirm'))) {
      resetSettings();
    }
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const showsLanguage =
    matchesSearch(t('settings.general.language')) || matchesSearch(t('settings.general.languageDesc'));
  const showsReset = matchesSearch(t('settings.general.reset')) || matchesSearch(t('settings.general.resetDesc'));

  if (searchQuery && !showsLanguage && !showsReset) return null;

  return (
    <div className="settings-section">
      <div className="section-header">
        <Languages size={20} />
        <h2>{t('settings.general.title')}</h2>
      </div>

      <div className="settings-group">
        {showsLanguage && (
          <div className="setting-item">
            <div className="setting-info">
              <h3>{t('settings.general.language')}</h3>
              <p>{t('settings.general.languageDesc')}</p>
            </div>
            <div className="setting-control">
              <select value={settings.general.language} onChange={(e) => setLanguage(e.target.value as any)} title={t('settings.general.languageSelect')}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        )}

        {showsReset && (
          <div className="setting-item danger-zone">
            <div className="setting-info">
              <h3>{t('settings.general.reset')}</h3>
              <p>{t('settings.general.resetDesc')}</p>
            </div>
            <div className="setting-control">
              <button className="reset-btn" onClick={handleReset} disabled={isSaving}>
                <RotateCcw size={16} />
                <span>{t('settings.general.resetBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
