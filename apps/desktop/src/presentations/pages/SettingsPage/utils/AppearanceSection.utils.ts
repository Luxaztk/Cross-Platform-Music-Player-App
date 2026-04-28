import { type ThemeType } from '@components';
import { type SettingsSectionProps } from './Settings.utils';

export interface AppearanceSectionProps extends SettingsSectionProps {}

export const THEMES: { id: ThemeType; colorVar: string; nameKey: string }[] = [
  { id: 'midnight', colorVar: '--color-primary', nameKey: 'settings.appearance.themeMidnight' },
  { id: 'amoled', colorVar: '--color-primary', nameKey: 'settings.appearance.themeAmoled' },
  { id: 'nord', colorVar: '--color-primary', nameKey: 'settings.appearance.themeNord' },
  { id: 'rose', colorVar: '--color-primary', nameKey: 'settings.appearance.themeRose' },
  { id: 'ocean', colorVar: '--color-primary', nameKey: 'settings.appearance.themeOcean' },
  { id: 'snow', colorVar: '--color-primary', nameKey: 'settings.appearance.themeSnow' },
];
