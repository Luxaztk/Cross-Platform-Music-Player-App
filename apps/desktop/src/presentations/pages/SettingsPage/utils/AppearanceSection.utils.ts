import { type ThemeType } from '@components';
import { type SettingsSectionProps } from './Settings.utils';

export interface AppearanceSectionProps extends SettingsSectionProps {}

export const getThemes = (t: (key: string) => string): { id: ThemeType; colorVar: string; name: string }[] => [
  { id: 'midnight', colorVar: '--color-primary', name: t('settings.appearance.themeMidnight') },
  { id: 'amoled', colorVar: '--color-primary', name: t('settings.appearance.themeAmoled') },
  { id: 'nord', colorVar: '--color-primary', name: t('settings.appearance.themeNord') },
  { id: 'rose', colorVar: '--color-primary', name: t('settings.appearance.themeRose') },
  { id: 'ocean', colorVar: '--color-primary', name: t('settings.appearance.themeOcean') },
  { id: 'snow', colorVar: '--color-primary', name: t('settings.appearance.themeSnow') },
];
