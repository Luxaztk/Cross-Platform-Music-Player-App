import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type AutoImportSettingsProps } from '../types';

export const AutoImportSettings: React.FC<AutoImportSettingsProps> = ({
    isVisible,
    paths,
    onAdd,
    onRemove,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="setting-item vertical auto-import-settings">
            <div className="setting-info">
                <div className="with-badge">
                    <h3>{t('settings.downloads.autoImport')}</h3>
                </div>
                <p>{t('settings.downloads.autoImportDesc')}</p>
            </div>
            <div className="import-paths-list">
                {paths.map((path: string) => (
                    <div key={path} className="import-path-item">
                        <span title={path}>{path}</span>
                        <button type="button" onClick={() => onRemove(path)} title={t('settings.downloads.removeFolder')}>
                            <Trash2 size={ICON_SIZES.TINY} />
                        </button>
                    </div>
                ))}
                <button type="button" className="add-path-btn" onClick={onAdd} title={t('settings.downloads.addFolder')}>
                    <Plus size={ICON_SIZES.XSMALL} />
                    <span>{t('settings.downloads.addFolder')}</span>
                </button>
            </div>
        </div>
    );
};
