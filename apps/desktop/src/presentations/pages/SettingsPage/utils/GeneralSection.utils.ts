import { type SettingsSectionProps } from './Settings.utils';

export interface GeneralSectionProps extends SettingsSectionProps {}

/**
 * Supported language options for the application.
 */
export const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];
