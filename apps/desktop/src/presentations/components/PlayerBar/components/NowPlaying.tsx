import React from 'react';
import { type NowPlayingProps } from '../types';

export const NowPlaying: React.FC<NowPlayingProps> = ({
    isVisible,
    song,
    appIcon,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="now-playing">
            {song?.coverArt ? (
                <div className="cover-art">
                    <img src={song.coverArt} alt={song.title} />
                </div>
            ) : (
                <div className="cover-art-mock">
                    <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
                </div>
            )}
            <div className="song-meta">
                <div className="song-title" title={song?.title}>
                    {song?.title || t('player.notPlaying')}
                </div>
                <div className="song-artist" title={song?.artist}>
                    {song?.artist || '-'}
                </div>
            </div>
        </div>

    );
};
