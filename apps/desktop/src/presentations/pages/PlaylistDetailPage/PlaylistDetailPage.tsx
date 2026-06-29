import React from 'react';
import { EditModal, DeleteConfirmationModal, SongPickerModal } from '@components';
import { usePlaylistDetail } from './usePlaylistDetail';
import { PlaylistHeader } from './components/PlaylistHeader';
import { FilterChips } from './components/FilterChips';
import { SongListHeader } from './components/SongListHeader';
import { VirtualSongList } from './components/VirtualSongList';
import { BulkActionsBar } from './components/BulkActionsBar';
import { SongRowContextMenu } from './components/SongRowContextMenu';
import { FloatingBadge } from './components/FloatingBadge';
import './PlaylistDetailPage.scss';

export const PlaylistDetailPage: React.FC = () => {
  const {
    state,
    refs: { containerRef, menuRef },
    actions,
    utils
  } = usePlaylistDetail();

  React.useEffect(() => {
    console.log('PlaylistDetailPage MOUNTED!');
    return () => console.log('PlaylistDetailPage UNMOUNTED!');
  }, []);

  const { t, appIcon, playlists, allSongs, currentSong, id, libraryFilter } = utils;

  const activeSong = state.activeMenuId ? state.filteredSongs.find((s) => s.id === state.activeMenuId) : null;

  return (
    <div className="playlist-detail-page">
      <PlaylistHeader
        isLoading={state.isLoading}
        isLibrary={state.isLibrary}
        playlist={state.playlist}
        localSongsCount={state.localSongs.length}
        filteredSongsCount={state.filteredSongs.length}
        libraryFilterType={libraryFilter.type}
        totalDuration={state.totalDuration}
        isImporting={state.isImporting}
        appIcon={appIcon}
        onImportFiles={actions.onImportFiles}
        onImportFolder={actions.onImportFolder}
        onAddFromSystem={actions.onAddFromSystem}
        onEditPlaylist={() => actions.setIsEditModalOpen(true)}
        t={t}
      />

      <div className="songs-list-container" ref={containerRef}>
        <FilterChips
          filter={libraryFilter}
          onRemoveTag={(val) => {
            const next = libraryFilter.values.filter((v) => v !== val);
            actions.setLibraryFilter({
              type: next.length === 0 ? 'none' : libraryFilter.type,
              values: next,
            });
          }}
          t={t}
        />

        <SongListHeader
          isSticky={state.isHeaderSticky}
          isSelectedAll={state.selectedIds.size === state.filteredSongs.length && state.filteredSongs.length > 0}
          onToggleSelectAll={actions.toggleSelectAll}
          t={t}
        />

        <VirtualSongList
          isLoading={state.isLoading}
          isDebouncing={state.isDebouncing}
          filteredSongs={state.filteredSongs}
          visibleSongs={state.visibleSongs}
          startIndex={state.startIndex}
          totalHeight={state.totalHeight}
          paddingOffset={state.paddingOffset}
          selectedIds={state.selectedIds}
          currentSongId={currentSong?.id}
          activeMenuId={state.activeMenuId}
          isImporting={state.isImporting}
          playlists={playlists}
          currentPlaylistId={id}
          appIcon={appIcon}
          onToggleSelect={actions.toggleSelect}
          onPlay={(idx) => actions.playList(state.filteredSongs, idx)}
          onPlayNext={actions.playNext}
          onAddToQueue={actions.addToQueue}
          onAddToPlaylist={actions.onAddSongsToPlaylist}
          onEdit={(song) => {
            actions.setEditingSong(song);
            actions.setIsEditModalOpen(true);
            actions.setActiveMenuId(null);
          }}
          onDelete={actions.onDeleteSong}
          onToggleFilter={actions.toggleFilter}
          onToggleMenu={actions.toggleMenu}
          onImportFiles={actions.onImportFiles}
          onImportFolder={actions.onImportFolder}
          t={t}
        />
      </div>

      <SongRowContextMenu
        isVisible={!!state.activeMenuId}
        song={activeSong || null}
        position={state.menuPosition}
        activeSubMenuId={state.activeSubMenuId}
        playlists={playlists}
        currentPlaylistId={id}
        onPlay={() => {
          const idx = state.filteredSongs.findIndex((s) => s.id === activeSong?.id);
          if (idx !== -1) actions.playList(state.filteredSongs, idx);
          actions.setActiveMenuId(null);
        }}
        onPlayNext={() => {
          if (activeSong) actions.playNext(activeSong);
          actions.setActiveMenuId(null);
        }}
        onAddToQueue={() => {
          if (activeSong) actions.addToQueue(activeSong);
          actions.setActiveMenuId(null);
        }}
        onAddToPlaylist={(pid) => activeSong && actions.onAddSongsToPlaylist(pid, [activeSong.id])}
        onEdit={() => {
          if (activeSong) actions.setEditingSong(activeSong);
          actions.setIsEditModalOpen(true);
          actions.setActiveMenuId(null);
        }}
        onDelete={() => activeSong && actions.onDeleteSong(activeSong)}
        onSetSubMenu={actions.setActiveSubMenuId}
        t={t}
        menuRef={menuRef}
      />

      <BulkActionsBar
        selectedCount={state.selectedIds.size}
        isLibrary={state.isLibrary}
        onBulkDelete={(mode) => actions.setBulkDeleteMode(mode)}
        onBulkAddToQueue={actions.onBulkAddToQueue}
        onCancel={() => actions.setSelectedIds(new Set())}
        t={t}
      />

      <EditModal
        type={state.editingSong ? 'song' : 'playlist'}
        data={state.editingSong || state.playlist}
        isOpen={state.isEditModalOpen}
        onClose={() => {
          actions.setIsEditModalOpen(false);
          actions.setEditingSong(null);
        }}
        onSave={actions.onSaveMetadata}
      />

      <DeleteConfirmationModal
        isOpen={!!state.deletingSong || !!state.bulkDeleteMode}
        onClose={() => {
          actions.setDeletingSong(null);
          actions.setBulkDeleteMode(null);
        }}
        onConfirm={state.deletingSong ? actions.confirmDeleteSong : actions.confirmBulkDelete}
        title={state.bulkDeleteMode ? t('modal.bulkDeleteTitle') : t('modal.deleteSongTitle')}
        message={
          state.bulkDeleteMode === 'library'
            ? t('modal.bulkDeleteLibraryMessage', { count: state.selectedIds.size })
            : state.bulkDeleteMode === 'playlist'
              ? t('modal.bulkRemovePlaylistMessage', { count: state.selectedIds.size })
              : t('modal.deleteSongQuestion')
        }
        itemName={state.deletingSong?.title}
        messageSuffix={state.deletingSong ? t('modal.deleteSongFromPlaylist') : undefined}
      />

      <SongPickerModal
        isOpen={state.isSongPickerOpen}
        onClose={() => actions.setIsSongPickerOpen(false)}
        allSongs={allSongs}
        existingSongIds={state.localSongs.map((s) => s.id)}
        onAdd={(songIds) => id && actions.onAddSongsToPlaylist(id, songIds)}
      />

      <FloatingBadge />
    </div>
  );
};
