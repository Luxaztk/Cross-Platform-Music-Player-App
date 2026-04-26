import React from 'react';
import { type ThemeType } from '@components';
import { useTheme, useLanguage } from '@hooks';
import { ICON_SIZES } from '@constants';
import { Palette, Check } from 'lucide-react';

const THEMES: { id: ThemeType; colorVar: string; nameKey: string }[] = [
  { id: 'midnight', colorVar: '--color-primary', nameKey: 'settings.appearance.themeMidnight' },
  { id: 'amoled', colorVar: '--color-primary', nameKey: 'settings.appearance.themeAmoled' },
  { id: 'nord', colorVar: '--color-primary', nameKey: 'settings.appearance.themeNord' },
  { id: 'rose', colorVar: '--color-primary', nameKey: 'settings.appearance.themeRose' },
  { id: 'ocean', colorVar: '--color-primary', nameKey: 'settings.appearance.themeOcean' },
  { id: 'snow', colorVar: '--color-primary', nameKey: 'settings.appearance.themeSnow' },
];

interface AppearanceSectionProps {
  searchQuery?: string;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({ searchQuery }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const showsTheme =
    matchesSearch(t('settings.appearance.theme')) ||
    matchesSearch(t('settings.appearance.themeDesc')) ||
    THEMES.some((tItem) => matchesSearch(t(tItem.nameKey)));

  if (searchQuery && !showsTheme) return null;

  const filteredThemes = searchQuery ? THEMES.filter((tItem) => matchesSearch(t(tItem.nameKey))) : THEMES;

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
