import React from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { type LyricsHeaderProps } from '../types';

export const LyricsHeader: React.FC<LyricsHeaderProps> = ({
    hasLyrics,
    showSearch,
    showHint,
    offset,
    onSearch,
    onAdjustOffset,
    onSetOffset,
    onResetOffset,
    t
}) => {
    return (
        <div className="lyrics-header">
            <div className="header-left">
                {hasLyrics && !showSearch && (
                    <button 
                        className={`change-lyrics-btn ${showHint ? 'hint-active' : ''}`} 
                        onClick={onSearch} 
                        title={t('lyrics.changeLyrics')}
                    >
                        <RotateCcw size={16} />
                    </button>
                )}
            </div>

            {hasLyrics && !showSearch && (
                <div className="sync-toolbar">
                    <div className="sync-buttons">
                        <button onClick={() => onAdjustOffset(-5)} title={`${t('lyrics.adjustBackward')} 5s`}><ChevronsLeft size={14} /></button>
                        <button onClick={() => onAdjustOffset(-1)} title={`${t('lyrics.adjustBackward')} 1s`}><ChevronLeft size={14} /></button>
                        <button className="reset-btn" onClick={onResetOffset} title={t('lyrics.resetOffset')}><RotateCcw size={12} /></button>
                        <button onClick={() => onAdjustOffset(1)} title={`${t('lyrics.adjustForward')} 1s`}><ChevronRight size={14} /></button>
                        <button onClick={() => onAdjustOffset(5)} title={`${t('lyrics.adjustForward')} 5s`}><ChevronsRight size={14} /></button>
                    </div>
                    <div className="sync-input">
                        <input 
                            type="number" 
                            step="0.1"
                            value={Math.round((offset || 0) * 10) / 10}
                            onChange={(e) => onSetOffset(parseFloat(e.target.value) || 0)}
                        />

                        <span>s</span>
                    </div>
                </div>
            )}
        </div>
    );
};
