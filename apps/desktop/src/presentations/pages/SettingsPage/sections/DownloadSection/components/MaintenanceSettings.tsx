import React from 'react';
import { History, RefreshCcw } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type MaintenanceSettingsProps } from '../types';

export const MaintenanceSettings: React.FC<MaintenanceSettingsProps> = ({
    isVisible,
    isSyncing,
    onSync,
    onShowHistory,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="setting-item">
            <div className="setting-info">
                <h3>{t('settings.downloads.maintenance')}</h3>
                <p>{t('settings.downloads.maintenanceDesc')}</p>
            </div>
            <div className="setting-control maintenance-actions">
                <button
                    type="button"
                    className="history-btn"
                    onClick={() => onShowHistory(true)}
                    title={t('libraryCleanup.viewHistory')}
                >
                    <History size={ICON_SIZES.XSMALL} />
                </button>
                <button
                    type="button"
                    className={`scan-btn ${isSyncing ? 'busy' : ''}`}
                    onClick={onSync}
                    disabled={isSyncing}
                >
                    <RefreshCcw size={ICON_SIZES.XSMALL} className={isSyncing ? 'spinning' : ''} />
                    <span>{isSyncing ? t('libraryCleanup.scanning') : t('libraryCleanup.scanNow')}</span>
                </button>
            </div>
        </div>
    );
};
