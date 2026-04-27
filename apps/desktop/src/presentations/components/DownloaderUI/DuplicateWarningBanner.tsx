import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import type { DuplicateInfo } from '@hooks';

interface DuplicateWarningBannerProps {
    duplicateInfo: DuplicateInfo;
}

export const DuplicateWarningBanner: React.FC<DuplicateWarningBannerProps> = ({ duplicateInfo }) => {
    const { t } = useLanguage();

    if (!duplicateInfo.warning) return null;

    return (
        <div className="duplicate-warning">
            <AlertTriangle size={ICON_SIZES.XSMALL} />
            <div>
                <strong>{t('downloader.duplicateWarning')}</strong>
                <p>
                    {duplicateInfo.warning.reason === 'URL'
                        ? t('downloader.duplicateSourceFound')
                        : t('downloader.duplicateFound')
                            .replace('{title}', duplicateInfo.warning.title)
                            .replace('{artist}', duplicateInfo.warning.artist)}
                </p>
            </div>
        </div>
    );
};