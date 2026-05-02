import React from 'react';
import { type ProgressBarProps } from '../types';

export const ProgressBar: React.FC<ProgressBarProps> = ({
    isVisible,
    progress,
    duration,
    percent,
    onSeekStart,
    onSeekChange,
    onSeekEnd,
    formatTime,
    disabled
}) => {
    if (!isVisible) return null;

    return (
        <div className="playback-bar">
            <span className="time">{formatTime(progress)}</span>
            <input
                type="range"
                min="0"
                max={duration || 100}
                value={progress}
                onPointerDown={onSeekStart}
                onChange={(e) => onSeekChange(parseFloat(e.target.value))}
                onPointerUp={(e) => onSeekEnd(parseFloat((e.target as HTMLInputElement).value))}
                className="styled-range progress-range"
                placeholder="Player"
                style={{ '--range-progress': `${percent}%` } as React.CSSProperties}
                disabled={disabled}
            />
            <span className="time">{formatTime(duration)}</span>
        </div>
    );

};
