/**
 * Available audio bitrate options.
 */
export const BITRATE_OPTIONS = [
    { value: '128', label: '128kbps (Standard)' },
    { value: '192', label: '192kbps (Medium)' },
    { value: '256', label: '256kbps (High)' },
    { value: '320', label: '320kbps (Best)' },
];

/**
 * Mapping function for background sync interval options with localized labels.
 */
export const getSyncIntervalOptions = (t: (key: string, options?: Record<string, unknown> | string) => string) => [
    { value: 0, label: t('settings.downloads.syncInterval.never') },
    { value: 30, label: t('settings.downloads.syncInterval.min30') },
    { value: 60, label: t('settings.downloads.syncInterval.hour1') },
    { value: 120, label: t('settings.downloads.syncInterval.hour2') },
    { value: 360, label: t('settings.downloads.syncInterval.hour6') },
    { value: 1440, label: t('settings.downloads.syncInterval.day1') },
];
