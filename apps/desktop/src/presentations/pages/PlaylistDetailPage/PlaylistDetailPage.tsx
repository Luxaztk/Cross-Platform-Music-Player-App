import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { FileMusic, FolderPlus, Loader2, X, CheckSquare, Square, Trash, Filter } from 'lucide-react';
import { useNotification } from '../../../application/hooks/useNotification';
import { useLibraryContext } from '../../components/Library';
import { usePlayer } from '@music/hooks';
import { splitArtists } from '@music/utils';
import type { Playlist, PlaylistDetail, Song } from '@music/types';
import { ICON_SIZES } from '../../constants/IconSizes';
import { EditModal } from '../../components/EditModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal/DeleteConfirmationModal';
import { SongPickerModal } from '../../components/SongPickerModal/SongPickerModal';
import { useLanguage } from '../../components/Language';
import { useTheme } from '../../components/Theme';
import { SongRow } from './SongRow';
import './PlaylistDetailPage.scss';



const formatTotalDuration = (seconds: number, t: (key: string) => string) => {
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [];
  if (hrs > 0) parts.push(`${hrs} ${t('playlist.hr')}`);
  if (mins > 0 || hrs > 0) parts.push(`${mins} ${t('playlist.min')}`);
  if (secs > 0 || (hrs === 0 && mins === 0)) parts.push(`${secs} ${t('playlist.sec')}`);
  return parts.join(' ');
};

export const PlaylistDetailPage: React.FC = () => {
  const [id] = useState(useParams<{ id: string }>().id); // Stabilize ID
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);

  // Virtualization state
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const virtuosoRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Existing Menus/Modals state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'library' | 'playlist' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    handleImportFiles,
    handleImportFolder,
    handleGetPlaylistDetail,
    handleUpdatePlaylist,
    handleUpdateSong,
    handleDeleteSong,
    handleDeleteSongs,
    handleRemoveSongsFromPlaylist,
    handleAddSongsToPlaylist,
    playlists,
    libraryFilter,
    setLibraryFilter,
    libraryVersion,
    songs: allSongs
  } = useLibraryContext();

  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const { playList, playNext, addToQueue, currentSong } = usePlayer();

  const isLibrary = id === '0';

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setPlaylist(null);
      setLocalSongs([]);
      setSelectedIds(new Set());

      handleGetPlaylistDetail(id).then((data: PlaylistDetail | null) => {
        if (data) {
          setPlaylist(data);
          setLocalSongs(data.songs || []);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }

    return () => {
      setLibraryFilter({ type: 'none', values: [] });
    };
  }, [id, libraryVersion, handleGetPlaylistDetail, setLibraryFilter]);

  // Handle scroll parent detection
  useEffect(() => {
    const mainAreaNode = document.querySelector('.main-area') as HTMLElement;
    if (mainAreaNode) {
      setScrollParent(mainAreaNode);
    }
  }, []);

  // Click out to close menu
  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
        setActiveSubMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('click', handleClickOut);
    }
    return () => window.removeEventListener('click', handleClickOut);
  }, [activeMenuId]);

  // Keyboard shortcut for Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedIds.size > 0) {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        onBulkDelete(isLibrary ? 'library' : 'playlist');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, isLibrary]);

  const onSaveMetadata = async (updated: Song | Playlist) => {
    if (editingSong) {
      const result = await handleUpdateSong(updated as Song);
      if (result) {
        setLocalSongs(prev => prev.map(s => s.id === result.id ? result : s));
        showNotification('success', t('playlist.updateSongSuccess'));
      }
    } else if (playlist) {
      const result = await handleUpdatePlaylist(updated as Playlist);
      if (result) {
        setPlaylist(prev => prev ? { ...prev, ...result } : null);
        showNotification('success', t('playlist.updateSuccess'));
      }
    }
    setEditingSong(null);
    setIsEditModalOpen(false);
  };

  const onDeleteSong = (song: Song) => {
    setDeletingSong(song);
    setActiveMenuId(null);
  };

  const confirmDeleteSong = async () => {
    if (!deletingSong) return;

    const success = await handleDeleteSong(deletingSong.id);
    if (success) {
      setLocalSongs(prev => prev.filter(s => s.id !== deletingSong.id));
      showNotification('success', t('playlist.deleteSongSuccess'));
      setDeletingSong(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deletingSong.id);
        return next;
      });
    }
  };

  const confirmBulkDelete = async () => {
    if (!bulkDeleteMode || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    let success = false;

    if (bulkDeleteMode === 'library') {
      success = await handleDeleteSongs(ids);
    } else if (id) {
      success = await handleRemoveSongsFromPlaylist(id, ids);
    }

    if (success) {
      setLocalSongs(prev => prev.filter(s => !selectedIds.has(s.id)));
      showNotification('success', t('playlist.bulkDeleteSuccess', { count: selectedIds.size }));
      setSelectedIds(new Set());
    }
    setBulkDeleteMode(null);
  };

  const onBulkDelete = (mode: 'library' | 'playlist') => {
    setBulkDeleteMode(mode);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSongs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSongs.map(s => s.id)));
    }
  };

  const toggleSelect = useCallback((songId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  }, []);

  const toggleFilter = (type: 'artist' | 'album', value: string) => {
    if (libraryFilter.type !== type && libraryFilter.type !== 'none') {
      setLibraryFilter({ type, values: [value] });
      return;
    }

    const currentValues = libraryFilter.values;
    const index = currentValues.indexOf(value);

    if (index > -1) {
      const next = currentValues.filter(v => v !== value);
      setLibraryFilter({
        type: next.length === 0 ? 'none' : type,
        values: next
      });
    } else {
      setLibraryFilter({
        type,
        values: [...currentValues, value]
      });
    }
  };

  const filteredSongs = useMemo(() => {
    const sorted = [...(libraryFilter.type !== 'none' && libraryFilter.values.length > 0 ? localSongs.filter(song => {
      if (libraryFilter.type === 'artist') {
        const queries = libraryFilter.values
          .flatMap(v => splitArtists(v))
          .map(v => v.toLowerCase().trim());

        const allArtists = (song.artists || [song.artist])
          .flatMap(a => splitArtists(a))
          .map(a => a.toLowerCase().trim());

        return queries.every(q => allArtists.includes(q));
      }
      if (libraryFilter.type === 'album') {
        const queries = libraryFilter.values.map(v => v.toLowerCase().trim());
        return queries.includes(song.album?.toLowerCase().trim() || '');
      }
      return true;
    }) : localSongs)];

    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }, [localSongs, libraryFilter]);

  const totalDuration = filteredSongs.reduce((acc, song) => acc + (song.duration || 0), 0);

  const onImportFiles = async () => {
    setIsImporting(true);
    try {
      const res = await handleImportFiles();
      if (res.success && res.count > 0) {
        showNotification('success', t('playlist.importSuccess', { count: res.count }));
        if (isLibrary && id) {
          const updated = await handleGetPlaylistDetail(id);
          if (updated) setLocalSongs(updated.songs);
        }
      }
    } finally {
      setIsImporting(false);
    }
  };

  const onImportFolder = async () => {
    setIsImporting(true);
    try {
      const res = await handleImportFolder();
      if (res.success && res.count > 0) {
        showNotification('success', t('playlist.scanSuccess', { count: res.count }));
        if (isLibrary && id) {
          const updated = await handleGetPlaylistDetail(id);
          if (updated) setLocalSongs(updated.songs);
        }
      }
    } finally {
      setIsImporting(false);
    }
  };

  const onAddFromSystem = () => {
    setIsSongPickerOpen(true);
  };

  const onAddSongsToPlaylist = async (playlistId: string, songIds: string[]) => {
    const targetPlaylist = playlists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    const success = await handleAddSongsToPlaylist(playlistId, songIds);
    if (success) {
      showNotification('success', t('playlist.addSongsSuccess', { count: songIds.length, name: targetPlaylist.name }));
      if (id === playlistId) {
        const updated = await handleGetPlaylistDetail(id);
        if (updated) {
          setPlaylist(updated);
          setLocalSongs(updated.songs);
        }
      }
    }
    setActiveMenuId(null);
    setActiveSubMenuId(null);
  };

  // Row component for Virtuoso - simplified since style is managed by Virtuoso
  // renderRow now receives both index and the song data from Virtuoso
  const renderRow = useCallback((index: number, song: Song) => {
    if (!song) return null;

    return (
      <SongRow
        key={song.id}
        song={song}
        index={index}
        isSelected={selectedIds.has(song.id)}
        style={{ height: 56 }} // Pass style as expected by component
        isPlaying={currentSong?.id === song.id}
        isActiveMenu={activeMenuId === song.id}
        activeSubMenuId={activeSubMenuId}
        menuPlacement={menuPlacement}
        playlists={playlists}
        currentPlaylistId={id}
        t={t}
        appIcon={appIcon}
        menuRef={menuRef}
        onToggleSelect={toggleSelect}
        onPlay={() => playList(filteredSongs, index)}
        onPlayNext={() => {
          playNext(song);
          setActiveMenuId(null);
        }}
        onAddToQueue={() => {
          addToQueue(song);
          setActiveMenuId(null);
        }}
        onAddToPlaylist={(pid) => onAddSongsToPlaylist(pid, [song.id])}
        onEdit={() => {
          setEditingSong(song);
          setIsEditModalOpen(true);
          setActiveMenuId(null);
        }}
        onDelete={() => onDeleteSong(song)}
        onToggleFilter={toggleFilter}
        onToggleMenu={(sid, e) => {
          e.stopPropagation();
          if (activeMenuId === sid) {
            setActiveMenuId(null);
          } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuPlacement(spaceBelow < 250 ? 'top' : 'bottom');
            setActiveMenuId(sid);
          }
        }}
        onToggleSubMenu={(sid) => setActiveSubMenuId(activeSubMenuId === sid ? null : sid)}
      />
    );
  }, [filteredSongs, selectedIds, currentSong, activeMenuId, activeSubMenuId, menuPlacement, playlists, id, t, appIcon, toggleSelect, playList, playNext, addToQueue, handleAddSongsToPlaylist]);

  return (
    <div className="playlist-detail-page" ref={containerRef}>
      <div className="playlist-header-container">
        <div className="playlist-cover-large">
          {isLoading ? (
            <div className="skeleton-cover skeleton" />
          ) : playlist?.thumbnail ? (
            <img src={playlist.thumbnail} alt={playlist.name} />
          ) : (
            <img src={appIcon} alt="" className="placeholder-brand-icon" />
          )}
        </div>

        <div className="header-content">
          {isLoading ? (
            <>
              <div className="skeleton-text large skeleton" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="skeleton-metadata skeleton" />
                <div className="skeleton-btn skeleton" style={{ width: '120px', height: '32px', marginTop: '12px' }} />
              </div>
            </>
          ) : (
            <>
              <div className='playlist-infor'>
                <h1
                  className={`playlist-name ${!playlist?.description ? 'large' : ''}`}
                  onClick={() => !isLibrary && setIsEditModalOpen(true)}
                >
                  {playlist?.name || (isLibrary ? t('playlist.libraryTitle') : '')}
                </h1>
                {playlist?.description && (
                  <p className="playlist-description">{playlist.description}</p>
                )}
              </div>
              <div className="playlist-metadata">
                <div>
                  <span className="metadata-item">Melovista</span>
                  {localSongs.length > 0 && (
                    <>
                      <span className="metadata-separator">•</span>
                      <span className="metadata-item">
                        {libraryFilter.type !== 'none' && libraryFilter.values.length > 0 ? `${filteredSongs.length} / ${localSongs.length}` : localSongs.length} {t('playlist.songs')}
                      </span>
                      <span className="metadata-separator">•</span>
                      <span className="metadata-item">{formatTotalDuration(totalDuration, t)}</span>
                    </>
                  )}
                </div>

                <div className="header-actions-inline">
                  {isLibrary ? (
                    <div className="import-btns">
                      {isImporting ? (
                        <button className="btn-primary-action btn-merged-loading" disabled>
                          <Loader2 size={ICON_SIZES.SMALL} className="animate-spin" style={{ marginRight: '8px' }} />
                          {t('playlist.processingData')}
                        </button>
                      ) : (
                        <>
                          <button onClick={onImportFiles} className="btn-primary-action">
                            <FileMusic size={ICON_SIZES.SMALL} style={{ marginRight: '8px' }} />
                            {t('playlist.importFiles')}
                          </button>
                          <button onClick={onImportFolder} className="btn-primary-action">
                            <FolderPlus size={ICON_SIZES.SMALL} style={{ marginRight: '8px' }} />
                            {t('playlist.importFolder')}
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button onClick={onAddFromSystem} className="btn-primary-action">+ {t('playlist.addFromLibrary')}</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {libraryFilter.type !== 'none' && libraryFilter.values.length > 0 && (
        <div className="filter-chip-container" style={{ background: 'var(--bg-surface)' }}>
          <div className="active-filter-label">
            <Filter size={12} className="filter-icon" />
            <span className="filter-text">{t('playlist.filteringBy')}</span>
          </div>

          <div className="filter-tags-list">
            {libraryFilter.values.map((val) => (
              <div key={val} className="active-filter-tag">
                <span className="tag-value">{val}</span>
                <button
                  className="remove-tag-btn"
                  onClick={() => {
                    const next = libraryFilter.values.filter(v => v !== val);
                    setLibraryFilter({
                      type: next.length === 0 ? 'none' : libraryFilter.type,
                      values: next
                    });
                  }}
                  title={t('common.clear')}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="list-header sticky-table-header">
        <div className="col-idx">
          <button className="checkbox-header-btn" onClick={toggleSelectAll}>
            {selectedIds.size === filteredSongs.length && filteredSongs.length > 0 ? (
              <CheckSquare size={16} className="text-primary" />
            ) : (
              <Square size={16} />
            )}
          </button>
        </div>
        <div className="col-title">{t('playlist.title')}</div>
        <div className="col-album">{t('playlist.album')}</div>
        <div className="col-duration">{t('playlist.duration')}</div>
        <div className="col-more"></div>
      </div>

      <div className="songs-list-container">
        {scrollParent ? (
          <Virtuoso
            ref={virtuosoRef}
            customScrollParent={scrollParent}
            data={filteredSongs}
            itemContent={(index, song) => renderRow(index, song)}
            fixedItemHeight={56}
            increaseViewportBy={300}
          />
        ) : (
          <div className="loading-skeleton-container" style={{ padding: '20px' }}>
            <div className="skeleton-text large skeleton" style={{ width: '300px', height: '40px' }} />
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="selection-info">
            <span className="count">{selectedIds.size}</span>
            <span className="text">{t('playlist.songsSelected') || 'bài hát được chọn'}</span>
          </div>
          <div className="bulk-btns">
            {!isLibrary && (
              <button className="bulk-btn secondary" onClick={() => onBulkDelete('playlist')}>
                <X size={16} />
                {t('playlist.removeFromPlaylist') || 'Gỡ khỏi playlist'}
              </button>
            )}
            <button className="bulk-btn delete" onClick={() => onBulkDelete('library')}>
              <Trash size={16} />
              {t('playlist.deleteFromLibrary') || 'Xóa khỏi thư viện'}
            </button>
            <div className="bulk-divider" />
            <button className="bulk-btn close" onClick={() => setSelectedIds(new Set())}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <EditModal
        type={editingSong ? 'song' : 'playlist'}
        data={(editingSong || playlist) as any}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSong(null);
        }}
        onSave={onSaveMetadata}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingSong || !!bulkDeleteMode}
        onClose={() => {
          setDeletingSong(null);
          setBulkDeleteMode(null);
        }}
        onConfirm={deletingSong ? confirmDeleteSong : confirmBulkDelete}
        title={bulkDeleteMode ? (t('modal.bulkDeleteTitle') || 'Xóa hàng loạt') : t('modal.deleteSongTitle')}
        message={
          bulkDeleteMode === 'library'
            ? (t('modal.bulkDeleteLibraryMessage', { count: selectedIds.size }) || `Bạn có chắc muốn xóa vĩnh viễn ${selectedIds.size} bài hát đã chọn khỏi thư viện?`)
            : bulkDeleteMode === 'playlist'
              ? (t('modal.bulkRemovePlaylistMessage', { count: selectedIds.size }) || `Bạn có chắc muốn gỡ ${selectedIds.size} bài hát khỏi playlist này?`)
              : t('modal.deleteSongQuestion')
        }
        itemName={deletingSong?.title}
        messageSuffix={deletingSong ? t('modal.deleteSongFromPlaylist') : undefined}
      />

      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        allSongs={allSongs}
        existingSongIds={localSongs.map(s => s.id)}
        onAdd={(songIds) => id && onAddSongsToPlaylist(id, songIds)}
      />
    </div>
  );
};
