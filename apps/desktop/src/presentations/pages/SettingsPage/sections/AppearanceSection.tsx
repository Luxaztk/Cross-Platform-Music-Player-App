import React from 'react';
import { type ThemeType } from '@components';
import { useTheme, useLanguage } from '@hooks';
import { Palette, Check } from 'lucide-react';

const THEMES: { id: ThemeType; color: string; nameKey: string }[] = [
  { id: 'midnight', color: '#1a1a2e', nameKey: 'settings.appearance.themeMidnight' },
  { id: 'amoled', color: '#000000', nameKey: 'settings.appearance.themeAmoled' },
  { id: 'nord', color: '#2e3440', nameKey: 'settings.appearance.themeNord' },
  { id: 'rose', color: '#1e1e2e', nameKey: 'settings.appearance.themeRose' },
  { id: 'ocean', color: '#0f172a', nameKey: 'settings.appearance.themeOcean' },
  { id: 'snow', color: '#f8f9fa', nameKey: 'settings.appearance.themeSnow' },
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
        <Palette size={20} />
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
                style={{ '--color-primary': tItem.color } as any}
              >
                <div className="theme-preview" />
                <div className="theme-name">
                  <span>{t(tItem.nameKey)}</span>
                  {theme === tItem.id && <Check size={14} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
