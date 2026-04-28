import React from 'react';
import { useTheme, useLanguage } from '@hooks';
import { ICON_SIZES } from '@constants';
import { Palette, Check } from 'lucide-react';
import { type AppearanceSectionProps, matchesSearch, THEMES } from '../utils';

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ searchQuery }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const showsTheme =
    matchesSearch(t('settings.appearance.theme'), searchQuery) ||
    matchesSearch(t('settings.appearance.themeDesc'), searchQuery) ||
    THEMES.some((tItem) => matchesSearch(t(tItem.nameKey), searchQuery));

  if (searchQuery && !showsTheme) return null;

  const filteredThemes = searchQuery 
    ? THEMES.filter((tItem) => matchesSearch(t(tItem.nameKey), searchQuery)) 
    : THEMES;

  return (
    <div className="settings-section">
      <div className="section-header">
        <Palette size={ICON_SIZES.MEDIUM} />
        <h2>{t('settings.appearance.title')}</h2>
      </div>

      <div className="settings-group">
        <div className="setting-item vertical">
          <div className="setting-info">
            <h3>{t('settings.appearance.theme')}</h3>
            <p>{t('settings.appearance.themeDesc')}</p>
          </div>
          <div className="theme-grid">
            {filteredThemes.map((tItem) => (
              <div
                key={tItem.id}
                className={`theme-card ${theme === tItem.id ? 'active' : ''}`}
                onClick={() => setTheme(tItem.id)}
                data-theme={tItem.id}
              >
                <div className="theme-preview">
                  <div className="mock-header" />
                  <div className="mock-content">
                    <div className="mock-sidebar" />
                    <div className="mock-main">
                      <div className="mock-item" />
                      <div className="mock-item" />
                      <div className="mock-item" />
                    </div>
                  </div>
                </div>
                <div className="theme-name">
                  <span>{t(tItem.nameKey)}</span>
                  {theme === tItem.id && <Check size={ICON_SIZES.TINY} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
