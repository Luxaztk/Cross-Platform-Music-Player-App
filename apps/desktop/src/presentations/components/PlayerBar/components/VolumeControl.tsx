import React from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type VolumeControlProps } from '../types';

export const VolumeControl: React.FC<VolumeControlProps> = ({
    isVisible,
    volume,
    percent,
    onVolumeChange,
    onToggleMute
}) => {
    if (!isVisible) return null;

    const VolumeIcon = () => {
        if (volume === 0) return <VolumeX size={ICON_SIZES.SMALL} />;
        if (volume < 0.3) return <Volume size={ICON_SIZES.SMALL} />;
        if (volume < 0.7) return <Volume1 size={ICON_SIZES.SMALL} />;
        return <Volume2 size={ICON_SIZES.SMALL} />;
    };

    return (
        <div className="volume-control">
            <button className="control-btn volume-btn" onClick={onToggleMute}>
                <VolumeIcon />
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="styled-range volume-range"
                placeholder="Volume"
                style={{ '--range-progress': `${percent}%` } as React.CSSProperties}
            />
        </div>
    );
};
