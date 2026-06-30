import React from 'react';
import { Loader2 } from 'lucide-react';
import { SongRow } from './SongRow';
import { EmptyState } from './EmptyState';
import { type VirtualSongListProps } from '../types';

export const VirtualSongList: React.FC<VirtualSongListProps> = React.memo(({
    isLoading,
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
    onImportFiles,
    onImportFolder,
    isImporting,
    t
}) => {
    return (
        <div className="virtual-list-viewport" style={{ height: totalHeight, position: 'relative' }}>
            <div className="virtual-list-content" style={{ transform: `translateY(${paddingOffset}px)` }}>
                {isLoading || isDebouncing ? (
                    <div className="searching-state-inline">
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                ) : filteredSongs.length === 0 ? (
                    <EmptyState 
                      onImportFiles={onImportFiles}
                      onImportFolder={onImportFolder}
                      isImporting={isImporting}
                      t={t}
                    />
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
}, (prev, next) => {
    // Only compare relevant props that require a re-render.
    // We intentionally ignore 't' (language changes) and inline function props
    // to prevent unnecessary unmounts/re-renders of the entire virtual list.
    const isDebouncingEq = prev.isDebouncing === next.isDebouncing;
    const isLoadingEq = prev.isLoading === next.isLoading;
    const filteredSongsEq = prev.filteredSongs === next.filteredSongs;
    const startIndexEq = prev.startIndex === next.startIndex;
    const totalHeightEq = prev.totalHeight === next.totalHeight;
    const paddingOffsetEq = prev.paddingOffset === next.paddingOffset;
    const selectedIdsEq = prev.selectedIds === next.selectedIds;
    const currentSongIdEq = prev.currentSongId === next.currentSongId;
    const activeMenuIdEq = prev.activeMenuId === next.activeMenuId;
    const playlistsEq = prev.playlists === next.playlists;
    const currentPlaylistIdEq = prev.currentPlaylistId === next.currentPlaylistId;
    const isImportingEq = prev.isImporting === next.isImporting;

    const isEqual = isDebouncingEq && isLoadingEq && filteredSongsEq && startIndexEq && totalHeightEq && paddingOffsetEq && selectedIdsEq && currentSongIdEq && activeMenuIdEq && playlistsEq && currentPlaylistIdEq && isImportingEq;

    if (!isEqual) {
        console.log('VirtualSongList re-render! Changed props:', {
            isLoading: !isLoadingEq,
            isDebouncing: !isDebouncingEq,
            filteredSongs: !filteredSongsEq,
            startIndex: !startIndexEq,
            totalHeight: !totalHeightEq,
            paddingOffset: !paddingOffsetEq,
            selectedIds: !selectedIdsEq,
            currentSongId: !currentSongIdEq,
            activeMenuId: !activeMenuIdEq,
            playlists: !playlistsEq,
            currentPlaylistId: !currentPlaylistIdEq,
            isImporting: !isImportingEq,
        });
    }

    return isEqual;
});
