import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Server,
  X,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  Lock,
  Users,
  Globe,
  Music,
  Plus,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import { ServerClient } from '@music/core';
import type { Song, ServerUserSummary } from '@music/types';
import { EditSongPermissionsModal } from '@components/EditSongPermissionsModal';

export interface ServerLibraryBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  clientUsername?: string;
  token?: string;
  existingSongs: Song[];
  onSyncSongs: (selectedSongs: Song[]) => Promise<void>;
}

export const ServerLibraryBrowserModal: React.FC<ServerLibraryBrowserModalProps> = ({
  isOpen,
  onClose,
  serverUrl,
  clientUsername,
  token,
  existingSongs,
  onSyncSongs,
}) => {
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverSongs, setServerSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<ServerUserSummary[]>([]);
  const [selectedUploader, setSelectedUploader] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyNotAdded, setOnlyNotAdded] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Load server songs and users when opened
  useEffect(() => {
    if (!isOpen || !serverUrl) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setLoadError(null);
        setSelectedSongIds(new Set());
      }
    });

    const auth = { username: clientUsername, token };

    Promise.all([
      ServerClient.fetchSongs(serverUrl, { username: clientUsername, token }),
      ServerClient.fetchUsers(serverUrl, auth),
    ])
      .then(([songsRes, usersRes]) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (songsRes.ok) {
          setServerSongs(songsRes.songs);
        } else {
          setLoadError(songsRes.error || t('settings.server.cannotConnect'));
        }

        if (usersRes.ok) {
          setUsers(usersRes.users);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setLoadError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, serverUrl, clientUsername, token, t]);

  // Fast check whether a song is already present in the user's local library
  const isAlreadyInLibrary = useCallback(
    (serverSong: Song): boolean => {
      return existingSongs.some((local) => {
        if (serverSong.hash && local.hash && serverSong.hash === local.hash) {
          return true;
        }
        if (
          local.title.toLowerCase().trim() === serverSong.title.toLowerCase().trim() &&
          local.artist.toLowerCase().trim() === serverSong.artist.toLowerCase().trim() &&
          Math.abs(local.duration - serverSong.duration) <= 2
        ) {
          return true;
        }
        return false;
      });
    },
    [existingSongs]
  );

  // Filter songs
  const filteredSongs = useMemo(() => {
    return serverSongs.filter((song) => {
      // 1. Uploader filter
      if (selectedUploader !== 'all') {
        const uploader = (song.uploader || '').toLowerCase();
        if (uploader !== selectedUploader.toLowerCase()) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = song.title.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q);
        const matchAlbum = song.album.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchAlbum) {
          return false;
        }
      }

      // 3. Only not added
      if (onlyNotAdded && isAlreadyInLibrary(song)) {
        return false;
      }

      return true;
    });
  }, [serverSongs, selectedUploader, searchQuery, onlyNotAdded, isAlreadyInLibrary]);

  // Selection toggle
  const toggleSongSelection = (id: string) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedSongIds);
    for (const song of filteredSongs) {
      next.add(song.id);
    }
    setSelectedSongIds(next);
  };

  const deselectAllFiltered = () => {
    const next = new Set(selectedSongIds);
    for (const song of filteredSongs) {
      next.delete(song.id);
    }
    setSelectedSongIds(next);
  };

  const handleExecuteSync = async () => {
    const toSync = serverSongs.filter((s) => selectedSongIds.has(s.id));
    if (toSync.length === 0) return;

    setIsSyncing(true);
    try {
      await onSyncSongs(toSync);
      onClose();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="server-browser-overlay" onClick={onClose}>
      <div
        className="server-browser-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="server-browser-title"
      >
        {/* Header */}
        <div className="server-browser-header">
          <div className="header-left">
            <Server size={22} className="server-icon" />
            <div>
              <h2 id="server-browser-title">
                {t('settings.server.browserTitle', { defaultValue: 'Kho Nhạc Máy Chủ Homelab' })}
              </h2>
              <p className="header-desc">
                {t('settings.server.browserDesc', {
                  defaultValue: 'Lọc theo người tải lên và chọn các bài hát muốn đồng bộ vào Thư viện',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="server-browser-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        {/* Uploader filter chips */}
        <div className="uploader-filter-bar">
          <span className="filter-label">
            {t('settings.server.filterByUploader', { defaultValue: 'Lọc theo Uploader' })}:
          </span>
          <div className="uploader-chips-list">
            <button
              type="button"
              className={`uploader-chip ${selectedUploader === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedUploader('all')}
            >
              <span>{t('settings.server.filterAllUploaders', { defaultValue: 'Tất cả uploader' })}</span>
              <span className="chip-count">({serverSongs.length})</span>
            </button>

            {users.map((u) => (
              <button
                type="button"
                key={u.username}
                className={`uploader-chip ${selectedUploader.toLowerCase() === u.username.toLowerCase() ? 'active' : ''}`}
                onClick={() => setSelectedUploader(u.username)}
              >
                <span className="chip-username">{u.username}</span>
                <span className="chip-count">({u.songCount})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="browser-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="browser-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('settings.server.filterSearchPlaceholder', {
                defaultValue: 'Tìm bài hát trên máy chủ...',
              })}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-actions">
            <label className="only-not-added-label">
              <input
                type="checkbox"
                checked={onlyNotAdded}
                onChange={(e) => setOnlyNotAdded(e.target.checked)}
              />
              <span>
                {t('settings.server.filterOnlyNotAdded', {
                  defaultValue: 'Chỉ hiện bài chưa có trong Thư viện',
                })}
              </span>
            </label>

            <button
              type="button"
              className="select-action-btn"
              onClick={selectAllFiltered}
              disabled={filteredSongs.length === 0}
            >
              <CheckSquare size={14} />
              <span>{t('settings.server.selectAll', { defaultValue: 'Chọn tất cả' })}</span>
            </button>

            <button
              type="button"
              className="select-action-btn"
              onClick={deselectAllFiltered}
              disabled={selectedSongIds.size === 0}
            >
              <Square size={14} />
              <span>{t('settings.server.deselectAll', { defaultValue: 'Bỏ chọn' })}</span>
            </button>
          </div>
        </div>

        {/* Songs List */}
        <div className="browser-songs-container">
          {isLoading ? (
            <div className="browser-loading-state">
              <RefreshCw size={28} className="spin-icon" />
              <p>
                {t('settings.server.loadingBrowser', {
                  defaultValue: 'Đang tải danh sách bài hát từ máy chủ...',
                })}
              </p>
            </div>
          ) : loadError ? (
            <div className="browser-error-state">
              <p className="error-text">{loadError}</p>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="browser-empty-state">
              <Music size={32} />
              <p>
                {t('settings.server.noFilteredSongs', {
                  defaultValue: 'Không tìm thấy bài hát nào phù hợp với bộ lọc',
                })}
              </p>
            </div>
          ) : (
            <div className="browser-songs-list">
              {filteredSongs.map((song) => {
                const isSelected = selectedSongIds.has(song.id);
                const isLocal = isAlreadyInLibrary(song);

                return (
                  <div
                    key={song.id}
                    className={`browser-song-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    <div className="song-checkbox-col">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSongSelection(song.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="song-cover-col">
                      {song.coverArt ? (
                        <img src={song.coverArt} alt={song.title} className="song-cover-thumb" />
                      ) : (
                        <div className="song-cover-placeholder">
                          <Music size={16} />
                        </div>
                      )}
                    </div>

                    <div className="song-meta-col">
                      <div className="song-title-row">
                        <span className="song-title" title={song.title}>
                          {song.title}
                        </span>
                        {isLocal && (
                          <span className="badge-in-library">
                            <CheckCircle2 size={12} />
                            <span>Đã có</span>
                          </span>
                        )}
                      </div>
                      <div className="song-artist-row">
                        <span className="song-artist" title={song.artist}>
                          {song.artist}
                        </span>
                        {song.album && <span className="song-album">• {song.album}</span>}
                      </div>
                    </div>

                    <div className="song-badges-col">
                      {song.uploader && (
                        <span className="badge-uploader" title={`Uploader: ${song.uploader}`}>
                          <span className="uploader-dot" />
                          <span>{song.uploader}</span>
                        </span>
                      )}

                      {song.visibility === 'private' && (
                        <span className="badge-visibility private" title="Chỉ mình tôi">
                          <Lock size={12} />
                          <span>Private</span>
                        </span>
                      )}

                      {song.visibility === 'whitelist' && (
                        <span className="badge-visibility whitelist" title="Chia sẻ trong Whitelist">
                          <Users size={12} />
                          <span>Whitelist</span>
                        </span>
                      )}

                      {song.visibility === 'public' && (
                        <span className="badge-visibility public" title="Công khai">
                          <Globe size={12} />
                          <span>Public</span>
                        </span>
                      )}

                      {!!clientUsername &&
                        (song.uploader || '').toLowerCase() === clientUsername.toLowerCase() && (
                          <button
                            type="button"
                            className="btn-edit-permissions"
                            title={t('settings.server.editPermissionsBtn', {
                              defaultValue: 'Sửa quyền',
                            })}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSong(song);
                            }}
                          >
                            <Shield size={11} />
                            <span>
                              {t('settings.server.editPermissionsBtn', {
                                defaultValue: 'Sửa quyền',
                              })}
                            </span>
                          </button>
                        )}
                    </div>

                    <div className="song-duration-col">
                      {Math.floor(song.duration / 60)}:
                      {String(Math.floor(song.duration % 60)).padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="server-browser-footer">
          <div className="selected-summary">
            {t('settings.server.selectedCount', {
              count: selectedSongIds.size,
              defaultValue: `Đã chọn: ${selectedSongIds.size} bài hát`,
            })}
          </div>

          <div className="footer-action-buttons">
            <button
              type="button"
              className="server-browser-cancel-btn"
              onClick={onClose}
              disabled={isSyncing}
            >
              {t('common.cancel', { defaultValue: 'Đóng' })}
            </button>

            <button
              type="button"
              className="server-browser-sync-btn"
              onClick={handleExecuteSync}
              disabled={selectedSongIds.size === 0 || isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>{t('settings.server.syncing', { defaultValue: 'Đang đồng bộ...' })}</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>
                    {t('settings.server.syncSelectedBtn', {
                      count: selectedSongIds.size,
                      defaultValue: `Đồng bộ ${selectedSongIds.size} bài đã chọn`,
                    })}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {editingSong && (
          <EditSongPermissionsModal
            isOpen={!!editingSong}
            onClose={() => setEditingSong(null)}
            song={editingSong}
            serverUrl={serverUrl}
            auth={{ username: clientUsername, token }}
            availableUsers={users}
            onPermissionUpdated={(updatedSong) => {
              setServerSongs((prev) =>
                prev.map((s) => (s.id === updatedSong.id ? { ...s, ...updatedSong } : s))
              );
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
