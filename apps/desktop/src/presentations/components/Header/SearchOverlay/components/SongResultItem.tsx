import React from 'react';
import { MoreVertical, Play, PlaySquare, ListPlus } from 'lucide-react';
import { type Song } from '@music/types';

interface SongResultItemProps {
    song: Song;
    globalIdx: number;
    selectedIndex: number;
    activeMenuId: string | null;
    menuPlacement: 'top' | 'bottom';
    appIcon: string;
    onSelect: (song: Song) => void;
    onMoreClick: (e: React.MouseEvent, songId: string) => void;
    onPlayNow: (song: Song) => void;
    onPlayNext: (song: Song) => void;
    onAddToQueue: (song: Song) => void;
    onCloseMenu: () => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export const SongResultItem: React.FC<SongResultItemProps> = ({
    song,
    globalIdx,
    selectedIndex,
    activeMenuId,
    menuPlacement,
    appIcon,
    onSelect,
    onMoreClick,
    onPlayNow,
    onPlayNext,
    onAddToQueue,
    onCloseMenu,
    t
}) => {
    const isActive = selectedIndex === globalIdx;
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (activeMenuId !== song.id) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) onCloseMenu();
        };

        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId, onCloseMenu, song.id]);

    const artistParts = React.useMemo(() => {
        const rawArtist = song.artist || '';
        return rawArtist.split(/(\s(?:ft\.?|x|&|and)\s|,\s?)/i);
    }, [song.artist]);

    return (
        <div
            className={`search-item song ${isActive ? 'active' : ''}`}

            onClick={() => onSelect(song)}
        >
            <div className="song-info">
                {song.coverArt ? (
                    <img src={song.coverArt} alt="" className="song-thumb" />
                ) : (
                    <div className="song-thumb-placeholder">
                        <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
                    </div>
                )}
                <div className="song-meta">
                    <span className="song-title">{song.title}</span>
                    <div className="song-artist">
                        {artistParts.map((part, i) => {
                            const isSeparator = /(\s(?:ft\.?|x|&|and)\s|,\s?)/i.test(part);
                            return (
                                <span key={i} className={isSeparator ? 'artist-separator' : 'artist-name'}>
                                    {part}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>


            <div className="item-actions">
                <button
                    className={`more-btn ${activeMenuId === song.id ? 'active' : ''}`}
                    title={t('common.more') || 'More options'}
                    onClick={(e) => onMoreClick(e, song.id)}
                >
                    <MoreVertical size={16} />
                </button>

                {activeMenuId === song.id && (
                    <div
                        className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`}
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="menu-item"
                            onClick={() => onPlayNow(song)}
                        >
                            <Play size={16} />
                            {t('playlist.playNow')}
                        </button>
                        <button
                            className="menu-item"
                            onClick={() => onPlayNext(song)}
                        >
                            <PlaySquare size={16} />
                            {t('playlist.playNext')}
                        </button>
                        <button
                            className="menu-item"
                            onClick={() => onAddToQueue(song)}
                        >
                            <ListPlus size={16} />
                            {t('playlist.addToQueue')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
