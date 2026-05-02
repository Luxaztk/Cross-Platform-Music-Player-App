import React from 'react';
import { Anchor } from 'lucide-react';
import { LYRIC_OFFSET } from '@music/hooks';
import { type LyricsContentProps } from '../types';

export const LyricsContent: React.FC<LyricsContentProps> = ({
    lyricLines,
    currentLineIndex,
    progress,
    onLineClick,
    onSyncNow,
    activeLineRef,
    t
}) => {
    return (
        <div className="lyrics-content">
            {lyricLines.map((line, index) => (
                <div
                    key={index}
                    ref={index === currentLineIndex ? activeLineRef : null}
                    className={`lyric-line-wrapper ${index === currentLineIndex ? 'active' : ''} ${index < currentLineIndex ? 'passed' : ''}`}
                >
                    <div className="lyric-line" onClick={() => onLineClick(line.time)}>
                        {line.text}
                    </div>
                    <button 
                        className="sync-now-btn" 
                        onClick={() => onSyncNow(progress - line.time - LYRIC_OFFSET)}
                        title={t('lyrics.syncNow')}
                    >
                        <Anchor size={12} />
                    </button>
                </div>
            ))}
        </div>
    );
};
