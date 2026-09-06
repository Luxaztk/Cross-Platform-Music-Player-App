import React from 'react';
import { type NowPlayingProps } from '../types';

export const NowPlaying: React.FC<NowPlayingProps> = ({
    isVisible,
    song,
    currentChapter,
    appIcon,
    onOpenChapters,
    t
}) => {
    if (!isVisible) return null;

    const hasChapters = (song?.chapters && song.chapters.length > 0) || !!currentChapter;

    return (
        <div className="now-playing">
            {song?.coverArt ? (
                <div className="cover-art">
                    <img src={song.coverArt} alt={song.title || ''} referrerPolicy="no-referrer" />
                </div>
            ) : (
                <div className="cover-art-mock">
                    <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
                </div>
            )}
            <div className="song-meta">
                <div className="song-title" title={song?.title} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {song?.title || t('player.notPlaying')}
                    </span>
                    {song?.sourceType === 'stream' && (
                        <span
                            className="badge-streaming-indicator"
                            style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--color-primary, #10b981)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                letterSpacing: '0.5px',
                                lineHeight: '12px',
                                flexShrink: 0,
                            }}
                        >
                            STREAM
                        </span>
                    )}
                </div>
                <div className="song-artist" title={song?.artist}>
                    {song?.artist || '-'}
                </div>
                {hasChapters && (
                    <button
                        type="button"
                        className="chapter-badge-btn"
                        onClick={onOpenChapters}
                        title={currentChapter ? `${t('chapters.editTitle')} - ${currentChapter.title}` : t('chapters.editTitle')}
                    >
                        <span className="chapter-badge-icon">📌</span>
                        <span className="chapter-badge-text">
                            {currentChapter ? currentChapter.title : `${song?.chapters?.length || 0} ${t('chapters.badgeTitle')}`}
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

