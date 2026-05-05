import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type SongListHeaderProps } from '../types';

export const SongListHeader: React.FC<SongListHeaderProps> = ({
    isSticky,
    isSelectedAll,
    onToggleSelectAll,
    t
}) => {
    return (
        <div className={`list-header ${isSticky ? 'is-sticky' : ''}`} style={{ position: 'sticky', top: 0 }}>
            <div className="col-idx">
                <button className="checkbox-header-btn" onClick={onToggleSelectAll}>
                    {isSelectedAll ? (
                        <CheckSquare size={ICON_SIZES.XSMALL} className="text-primary" />
                    ) : (
                        <Square size={ICON_SIZES.XSMALL} />
                    )}
                </button>
            </div>
            <div className="col-title">{t('playlist.title')}</div>
            <div className="col-album">{t('playlist.album')}</div>
            <div className="col-duration">{t('playlist.duration')}</div>
            <div className="col-more"></div>
        </div>
    );
};
