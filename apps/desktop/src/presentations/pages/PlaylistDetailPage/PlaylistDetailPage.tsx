import React from 'react';
import { useParams } from 'react-router-dom';
import { Music, FileMusic, FolderPlus, MoreVertical, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useNotification } from '../../../application/hooks';
import { useLibraryContext } from '../../components/Library';
import type { Playlist, PlaylistDetail, Song } from '@music/types';
import { ICON_SIZES } from '../../constants/IconSizes';
import { EditModal } from '../../components/EditModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal/DeleteConfirmationModal';
import { useLanguage } from '../../components/Language';
import './PlaylistDetailPage.scss';

/**
 * Helper to format duration in seconds to "X hr Y min" or "Y min Z sec"
 */
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
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = React.useState<PlaylistDetail | null>(null);
  const [localSongs, setLocalSongs] = React.useState<Song[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // New States
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = React.useState<'top' | 'bottom'>('bottom');
  const [editingSong, setEditingSong] = React.useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = React.useState<Song | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const {
    handleImportFiles,
    handleImportFolder,
    handleGetPlaylistDetail,
    handleUpdatePlaylist,
    handleUpdateSong,
    handleDeleteSong
  } = useLibraryContext();

  const { showNotification } = useNotification();
  const { t } = useLanguage();

  const isLibrary = id === '0';

  React.useEffect(() => {
    if (id) {
      setIsLoading(true);
      setPlaylist(null);
      setLocalSongs([]);

      handleGetPlaylistDetail(id).then(data => {
        if (data) {
          setPlaylist(data);
          setLocalSongs(data.songs || []);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [id, handleGetPlaylistDetail]);

  // Click out to close menu
  React.useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('click', handleClickOut);
    }
    return () => window.removeEventListener('click', handleClickOut);
  }, [activeMenuId]);

  const onSaveMetadata = async (updated: any) => {
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
    }
  };

  const totalDuration = localSongs.reduce((acc, song) => acc + (song.duration || 0), 0);

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
    showNotification('info', t('playlist.addFromLibrary') + ' - Coming soon!');
  };

  return (
    <div className="playlist-detail-page">
      <div className="playlist-header-container">
        <div className="playlist-cover-large">
          {isLoading ? (
            <div className="skeleton-cover skeleton" />
          ) : playlist?.thumbnail ? (
            <img src={playlist.thumbnail} alt={playlist.name} />
          ) : (
            <Music size={80} className="placeholder-icon" />
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
                      <span className="metadata-item">{localSongs.length} {t('playlist.songs')}</span>
                      <span className="metadata-separator">•</span>
                      <span className="metadata-item">{formatTotalDuration(totalDuration, t)}</span>
                    </>
                  )}
                </div>

                {/* Inline Actions */}
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

      <div className="songs-list-container">
        <div className="list-header">
          <div className="col-idx">#</div>
          <div className="col-title">{t('playlist.title')}</div>
          <div className="col-album">{t('playlist.album')}</div>
          <div className="col-duration">{t('playlist.duration')}</div>
          <div className="col-more"></div>
        </div>
        {localSongs.length === 0 ? (
          <p className="no-songs">{t('playlist.noSongs')}</p>
        ) : (
          localSongs.map((song, index) => (
            <div key={song.id} className={`song-row ${activeMenuId === song.id ? 'menu-open' : ''}`}>
              <div className="col-idx">{index + 1}</div>
              <div className="col-title">
                <div className="song-cell">
                  {song.coverArt ? (
                    <img src={song.coverArt} className="song-mini-img" alt={song.title} />
                  ) : (
                    <div className="song-mini-placeholder">
                      <Music size={16} />
                    </div>
                  )}
                  <div className="song-details">
                    <span className="title-text">{song.title}</span>
                    <span className="artist-text">{song.artist}</span>
                  </div>
                </div>
              </div>
              <div className="col-album">{song.album || '-'}</div>
              <div className="col-duration">
                {(() => {
                  const d = Math.round(song.duration || 0);
                  const m = Math.floor(d / 60);
                  const s = d % 60;
                  return `${m}:${s.toString().padStart(2, '0')}`;
                })()}
              </div>
              <div className="col-more">
                <button
                  className={`row-more-btn ${activeMenuId === song.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMenuId === song.id) {
                      setActiveMenuId(null);
                    } else {
                      // Calculate placement
                      const rect = e.currentTarget.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const menuHeight = 120;
                      
                      setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
                      setActiveMenuId(song.id);
                    }
                  }}
                >
                  <MoreVertical size={ICON_SIZES.SMALL} />
                </button>
                {activeMenuId === song.id && (
                  <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`} 
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}>
                    <button className="menu-item" onClick={() => {
                      setEditingSong(song);
                      setIsEditModalOpen(true);
                      setActiveMenuId(null);
                    }}>
                      <Edit2 size={16} />
                      {t('common.edit')}
                    </button>
                    <button className="menu-item delete" onClick={() => {
                      onDeleteSong(song);
                      setActiveMenuId(null);
                    }}>
                      <Trash2 size={16} />
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <EditModal
        type={editingSong ? 'song' : 'playlist'}
        data={editingSong || playlist}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSong(null);
        }}
        onSave={onSaveMetadata}
      />
      <DeleteConfirmationModal
        isOpen={!!deletingSong}
        onClose={() => setDeletingSong(null)}
        onConfirm={confirmDeleteSong}
        title={t('modal.deleteSongTitle')}
        message={t('modal.deleteSongQuestion')}
        itemName={deletingSong?.title}
        messageSuffix={t('modal.deleteSongFromPlaylist')}
      />
    </div>
  );
};
