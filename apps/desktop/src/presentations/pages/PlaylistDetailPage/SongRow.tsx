import React from 'react';
import { CheckSquare, Play, MoreVertical, PlaySquare, ListPlus, FolderPlus, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '../../constants/IconSizes';
import { formatTime, splitArtists } from '@music/utils';

interface SongRowProps {
  song: Song;
  index: number;
  isSelected: boolean;
  isPlaying: boolean;
  isActiveMenu: boolean;
  activeSubMenuId: string | null;
  menuPlacement: 'top' | 'bottom';
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  t: (key: string, options?: any) => string;
  appIcon: string;
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onPlay: () => void;
  onPlayNext: () => void;
  onAddToQueue: () => void;
  onAddToPlaylist: (playlistId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFilter: (type: 'artist' | 'album', value: string) => void;
  onToggleMenu: (id: string, e: React.MouseEvent) => void;
  onToggleSubMenu: (id: string) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

export const SongRow: React.FC<SongRowProps> = React.memo(({
  song,
  index,
  isSelected,
  isPlaying,
  isActiveMenu,
  activeSubMenuId,
  menuPlacement,
  playlists,
  currentPlaylistId,
  t,
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
  onToggleSubMenu,
  menuRef,
}) => {
  return (
    <div
      className={`song-row ${isSelected ? 'selected' : ''} ${isActiveMenu ? 'menu-open' : ''} ${isPlaying ? 'playing' : ''}`}
      onClick={() => onToggleSelect(song.id)}
    >
      <div className="col-idx">
        <div className="checkbox-cell" onClick={(e) => onToggleSelect(song.id, e)}>
          {isSelected ? (
            <CheckSquare size={16} className="text-primary" />
          ) : isPlaying ? (
            <Play size={14} className="playing-icon" />
          ) : (
            index + 1
          )}
        </div>
      </div>
      <div className="col-title">
        <div className="song-cell">
          {song.coverArt ? (
            <img src={song.coverArt} className="song-mini-img" alt={song.title} />
          ) : (
            <div className="song-mini-placeholder">
              <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
            </div>
          )}
          <div className="song-details">
            <span
              className="title-text"
              style={{ color: isPlaying ? 'var(--color-primary)' : undefined }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              {song.title}
            </span>
            <div className="artist-text">
              {(song.artists || [song.artist]).flatMap(a => splitArtists(a)).map((artist, i, arr) => (
                <React.Fragment key={artist + i}>
                  <span
                    className="clickable-artist"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFilter('artist', artist);
                    }}
                  >
                    {artist}
                  </span>
                  {i < arr.length - 1 && <span className="artist-separator"> ft.&nbsp;</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="col-album">{song.album || '-'}</div>
      <div className="col-duration">{formatTime(song.duration || 0)}</div>
      <div className="col-more">
        <button
          className={`row-more-btn ${isActiveMenu ? 'active' : ''}`}
          onClick={(e) => onToggleMenu(song.id, e)}
        >
          <MoreVertical size={ICON_SIZES.SMALL} />
        </button>
        {isActiveMenu && (
          <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`}
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}>
            <button className="menu-item" onClick={() => {
              onPlay();
            }}>
              <Play size={16} />
              {t('playlist.playNow') || 'Phát ngay'}
            </button>
            <button className="menu-item" onClick={() => {
              onPlayNext();
            }}>
              <PlaySquare size={16} />
              {t('playlist.playNext') || 'Phát tiếp theo'}
            </button>
            <button className="menu-item" onClick={() => {
              onAddToQueue();
            }}>
              <ListPlus size={16} />
              {t('playlist.addToQueue') || 'Thêm vào hàng đợi'}
            </button>

            <div className="menu-divider"></div>

            <div
              className={`menu-item nested-trigger ${activeSubMenuId === song.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSubMenu(song.id);
              }}
              onMouseEnter={() => onToggleSubMenu(song.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderPlus size={16} />
                {t('playlist.addToPlaylist') || 'Thêm vào danh sách phát'}
              </div>
              <ChevronRight size={14} />

              {activeSubMenuId === song.id && (
                <div className="nested-menu">
                  {playlists.filter(p => p.id !== '0' && p.id !== currentPlaylistId).length === 0 ? (
                    <div className="menu-item disabled">
                      {t('sidebar.noPlaylists')}
                    </div>
                  ) : (
                    playlists
                      .filter(p => p.id !== '0' && p.id !== currentPlaylistId)
                      .map(p => (
                        <button
                          key={p.id}
                          className="menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToPlaylist(p.id);
                          }}
                        >
                          {p.name}
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>

            <div className="menu-divider"></div>
            <button className="menu-item" onClick={() => {
              onEdit();
            }}>
              <Edit2 size={16} />
              {t('common.edit')}
            </button>
            <button className="menu-item delete" onClick={() => {
              onDelete();
            }}>
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if essential props changed
  return (
    prev.song.id === next.song.id &&
    prev.song.lyricId === next.song.lyricId &&
    prev.isSelected === next.isSelected &&
    prev.isPlaying === next.isPlaying &&
    prev.isActiveMenu === next.isActiveMenu &&
    prev.activeSubMenuId === next.activeSubMenuId &&
    prev.menuPlacement === next.menuPlacement &&
    prev.playlists === next.playlists &&
    prev.index === next.index
  );
});
