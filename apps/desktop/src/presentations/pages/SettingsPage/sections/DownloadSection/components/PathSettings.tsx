import React from 'react';
import { FolderOpen } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type PathSettingsProps } from '../types';

export const PathSettings: React.FC<PathSettingsProps> = ({
    isVisible,
    settings,
    isSaving,
    onSelectPath,
    t
}) => {
    if (!isVisible) return null;

    return (
        <>
            {/* Download Path */}
            <div className="setting-item">
                <div className="setting-info">
                    <h3>{t('settings.downloads.path')}</h3>
                    <p className="current-path-display" title={settings.downloads.downloadPath}>
                        {settings.downloads.downloadPath || t('settings.downloads.notSet')}
                    </p>
                </div>
                <div className="setting-control">
                    <button type="button" className="browse-btn" onClick={onSelectPath} disabled={isSaving}>
                        <FolderOpen size={ICON_SIZES.XSMALL} />
                        <span>{t('settings.downloads.browse')}</span>
                    </button>
                </div>
            </div>


        </>
    );
};
