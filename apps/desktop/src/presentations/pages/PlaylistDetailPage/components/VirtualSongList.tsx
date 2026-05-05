import React from 'react';
import { Loader2 } from 'lucide-react';
import { SongRow } from './SongRow';
import { type VirtualSongListProps } from '../types';

export const VirtualSongList: React.FC<VirtualSongListProps> = ({
    isDebouncing,
    filteredSongs,
    visibleSongs,
    startIndex,
    totalHeight,
    paddingOffset,
    selectedIds,
    currentSongId,
    activeMenuId,
    playlists,
    currentPlaylistId,
    appIcon,
    onToggleSelect,
    onPlay,
    onPlayNext,
    onAddToQueue,
    onAddToPlaylist,
    onEdit,
    onDelete,
    onToggleFilter,
    onToggleMenu,
    t
}) => {
    return (
        <div className="virtual-list-viewport" style={{ height: totalHeight, position: 'relative' }}>
            <div className="virtual-list-content" style={{ transform: `translateY(${paddingOffset}px)` }}>
                {isDebouncing ? (
                    <div className="searching-state-inline">
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                ) : filteredSongs.length === 0 ? (
                    <p className="no-songs">{t('playlist.noSongs')}</p>
                ) : (
                    visibleSongs.map((song, i) => (
                        <SongRow
                            key={song.id}
                            song={song}
                            index={startIndex + i}
                            isSelected={selectedIds.has(song.id)}
                            isPlaying={currentSongId === song.id}
                            isActiveMenu={activeMenuId === song.id}
                            hasActiveSelection={selectedIds.size > 0}
                            playlists={playlists}
                            currentPlaylistId={currentPlaylistId}
                            t={t}
                            appIcon={appIcon}
                            onToggleSelect={onToggleSelect}
                            onPlay={() => onPlay(startIndex + i)}
                            onPlayNext={() => onPlayNext(song)}
                            onAddToQueue={() => onAddToQueue(song)}
                            onAddToPlaylist={(pid) => onAddToPlaylist(pid, [song.id])}
                            onEdit={() => onEdit(song)}
                            onDelete={() => onDelete(song)}
                            onToggleFilter={onToggleFilter}
                            onToggleMenu={(sid, e) => onToggleMenu(sid, e)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
