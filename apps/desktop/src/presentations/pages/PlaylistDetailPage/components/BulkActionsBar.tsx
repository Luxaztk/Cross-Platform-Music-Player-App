import React from 'react';
import ReactDOM from 'react-dom';
import { X, Trash, ListPlus } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type BulkActionsBarProps } from '../types';

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    isLibrary,
    onBulkDelete,
    onBulkAddToQueue,
    onCancel,
    t
}) => {
    if (selectedCount === 0) return null;

    return ReactDOM.createPortal(
        <div className="bulk-actions-wrapper">
            <div className="bulk-actions-bar">
                <div className="selection-info">
                    <span className="count">{selectedCount}</span>
                    <span className="text">{t('playlist.songsSelected')}</span>
                </div>
                <div className="bulk-btns">
                    {!isLibrary && (
                        <button type="button" className="bulk-btn delete" onClick={() => onBulkDelete('playlist')}>
                            <X size={ICON_SIZES.XSMALL} />
                            {t('playlist.removeFromPlaylist')}
                        </button>
                    )}
                    {isLibrary && (
                        <button type="button" className="bulk-btn delete" onClick={() => onBulkDelete('library')}>
                            <Trash size={ICON_SIZES.XSMALL} />
                            {t('playlist.deleteFromLibrary')}
                        </button>
                    )}
                    <div className="bulk-divider" />
                    <button type="button" className="bulk-btn secondary" onClick={onBulkAddToQueue}>
                        <ListPlus size={ICON_SIZES.XSMALL} />
                        {t('playlist.addToQueue')}
                    </button>
                    <div className="bulk-divider" />
                    <button type="button" className="bulk-btn close" onClick={onCancel}>
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
