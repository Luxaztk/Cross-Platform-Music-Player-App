import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type PlaybackControlsProps } from '../types';

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
    isVisible,
    isPlaying,
    isShuffle,
    repeatMode,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onToggleShuffle,
    onToggleRepeat,
    disabled,
    t
}) => {
    if (!isVisible) return null;

    return (
        <>
            <button
                className={`control-btn secondary ${isShuffle ? 'active' : ''}`}
                onClick={onToggleShuffle}
                disabled={disabled}
                title={t('player.shuffle')}
            >
                <Shuffle size={ICON_SIZES.XSMALL} />
            </button>

            <button
                className="control-btn"
                onClick={onPrev}
                disabled={disabled}
                title={t('player.previous')}
            >
                <SkipBack size={ICON_SIZES.MEDIUM} fill={!disabled ? "currentColor" : "none"} />
            </button>

            <button
                className="control-btn play-btn"
                onClick={isPlaying ? onPause : onPlay}
                disabled={disabled}
                title={isPlaying ? t('player.pause') : t('player.play')}
            >
                {isPlaying ? (
                    <Pause size={ICON_SIZES.MEDIUM} fill="currentColor" />
                ) : (
                    <Play size={ICON_SIZES.MEDIUM} fill="currentColor" />
                )}
            </button>

            <button
                className="control-btn"
                onClick={onNext}
                disabled={disabled}
                title={t('player.next')}
            >
                <SkipForward size={ICON_SIZES.MEDIUM} fill={!disabled ? "currentColor" : "none"} />
            </button>

            <button
                className={`control-btn secondary ${repeatMode !== 'OFF' ? 'active' : ''}`}
                onClick={onToggleRepeat}
                disabled={disabled}
                title={t('player.repeat')}
            >
                {repeatMode === 'ONE' ? (
                    <Repeat1 size={ICON_SIZES.XSMALL} />
                ) : (
                    <Repeat size={ICON_SIZES.XSMALL} />
                )}
            </button>
        </>
    );

};
