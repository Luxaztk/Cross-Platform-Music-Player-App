import { type SettingsSectionProps } from './Settings.utils';

export interface AudioSectionProps extends SettingsSectionProps {}

export const PEAK_METER_MIN_DB = -60;
export const PEAK_METER_MAX_DB = 0;
export const PEAK_METER_CLIPPING_THRESHOLD = 98; // Percentage
