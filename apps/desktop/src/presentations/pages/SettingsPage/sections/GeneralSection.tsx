import React from 'react';
import { useSettings, useLanguage } from '@hooks';
import { ICON_SIZES } from '@constants';
import { RotateCcw, Languages } from 'lucide-react';
import { CustomDropdown } from '@components';
import { LANGUAGE_OPTIONS, type GeneralSectionProps, matchesSearch } from '../utils';

export const GeneralSection: React.FC<GeneralSectionProps> = ({ searchQuery }) => {
  const { t, setLanguage } = useLanguage();
  const { settings, updateSettings, resetSettings, isSaving } = useSettings();

  const handleReset = () => {
    if (window.confirm(t('settings.general.resetConfirm'))) {
      resetSettings();
    }
  };

  const showsLanguage =
    matchesSearch(t('settings.general.language'), searchQuery) || 
    matchesSearch(t('settings.general.languageDesc'), searchQuery);
    
  const showsReset = 
    matchesSearch(t('settings.general.reset'), searchQuery) || 
    matchesSearch(t('settings.general.resetDesc'), searchQuery);

  if (searchQuery && !showsLanguage && !showsReset) return null;

  return (
    <div className="settings-section">
      <div className="section-header">
        <Languages size={ICON_SIZES.MEDIUM} />
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
              <CustomDropdown
                value={settings.general.language}
                onChange={(val) => {
                  setLanguage(val as any);
                  updateSettings({ general: { language: val } });
                }}
                options={LANGUAGE_OPTIONS}
                title={t('settings.general.languageSelect')}
              />
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
              <button type="button" className="reset-btn" onClick={handleReset} disabled={isSaving}>
                <RotateCcw size={ICON_SIZES.XSMALL} />
                <span>{t('settings.general.resetBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
