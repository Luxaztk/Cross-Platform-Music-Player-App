import React from 'react';
import { CustomDropdown } from '@components';
import { BITRATE_OPTIONS, getSyncIntervalOptions } from '../constants';
import { type QualitySettingsProps, type BaseSectionProps } from '../types';

export const QualitySettings: React.FC<QualitySettingsProps> = ({
    isVisible,
    bitrate,
    onBitrateChange,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="setting-item">
            <div className="setting-info">
                <h3>{t('settings.downloads.quality')}</h3>
                <p>{t('settings.downloads.qualityDesc')}</p>
            </div>
            <div className="setting-control">
                <CustomDropdown
                    value={bitrate}
                    onChange={onBitrateChange}
                    options={BITRATE_OPTIONS}
                    title={t('settings.downloads.qualitySelect')}
                />
            </div>
        </div>
    );
};

interface BackgroundSyncSettingsProps extends BaseSectionProps {
    value: number;
    onChange: (val: any) => void;
    isSaving: boolean;
    t: (key: string, options?: any) => string;
}

export const BackgroundSyncSettings: React.FC<BackgroundSyncSettingsProps> = ({
    isVisible,
    value,
    onChange,
    isSaving,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="setting-item">
            <div className="setting-info">
                <h3>{t('settings.downloads.backgroundSync')}</h3>
                <p>{t('settings.downloads.backgroundSyncDesc')}</p>
            </div>
            <div className="setting-control">
                <CustomDropdown
                    value={value}
                    onChange={onChange}
                    options={getSyncIntervalOptions(t)}
                    title={t('settings.downloads.backgroundSync')}
                    disabled={isSaving}
                />
            </div>
        </div>
    );
};
