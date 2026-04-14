import React, { useCallback, useMemo } from 'react';
import { CheckSquare, Play, MoreVertical, PlaySquare, ListPlus, FolderPlus, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '../../constants/IconSizes';
import { formatTime, splitArtists } from '@music/utils';

interface SongRowProps {
  song: Song;
  index: number;
  style?: React.CSSProperties; // Add for react-window
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
  style,
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

  // 1. Tách logic xử lý Artists để tránh tính toán lại trong render
  const artistsList = useMemo(() => {
    const rawArtists = song.artists && song.artists.length > 0 ? song.artists : [song.artist];
    return rawArtists.flatMap(a => splitArtists(a));
  }, [song.artists, song.artist]);

  // 2. Handler click tiêu đề (Ngăn chặn nổi bọt sự kiện một cách sạch sẽ)
  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
  }, [onPlay]);

  return (
    <div
      className={`song-row ${isSelected ? 'selected' : ''} ${isActiveMenu ? 'menu-open' : ''} ${isPlaying ? 'playing' : ''}`}
      onClick={() => onToggleSelect(song.id)}
      style={style}
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
          <div className="song-img-container">
            {song.coverArt ? (
              <img src={song.coverArt} className="song-mini-img" alt={song.title} loading="lazy" />
            ) : (
              <div className="song-mini-placeholder">
                <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
              </div>
            )}
          </div>

          <div className="song-details">
            <span
              className="title-text"
              style={{ color: isPlaying ? 'var(--color-primary)' : undefined }}
              onClick={handleTitleClick}
            >
              {song.title}
            </span>
            <div className="artist-text">
              {artistsList.map((artist, i) => (
                <React.Fragment key={`${artist}-${i}`}>
                  <span
                    className="clickable-artist"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFilter('artist', artist);
                    }}
                  >
                    {artist}
                  </span>
                  {i < artistsList.length - 1 && <span className="artist-separator"> ft.&nbsp;</span>}
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
          title='More actions'
        >
          <MoreVertical size={ICON_SIZES.SMALL} />
        </button>

        {isActiveMenu && (
          <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`}
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}>

            {/* Menu Items - Có thể tách thành một Sub-component nếu menu phức tạp hơn */}
            <MenuAction icon={<Play size={16} />} label={t('playlist.playNow', 'Phát ngay')} onClick={onPlay} />
            <MenuAction icon={<PlaySquare size={16} />} label={t('playlist.playNext', 'Phát tiếp theo')} onClick={onPlayNext} />
            <MenuAction icon={<ListPlus size={16} />} label={t('playlist.addToQueue', 'Thêm vào hàng đợi')} onClick={onAddToQueue} />

            <div className="menu-divider"></div>

            {/* Nested Playlist Menu */}
            <div
              className={`menu-item nested-trigger ${activeSubMenuId === song.id ? 'active' : ''}`}
              onMouseEnter={() => onToggleSubMenu(song.id)}
            >
              <div className="item-content">
                <FolderPlus size={16} />
                <span>{t('playlist.addToPlaylist', 'Thêm vào danh sách phát')}</span>
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
            <MenuAction icon={<Edit2 size={16} />} label={t('common.edit', 'Sửa')} onClick={onEdit} />
            <MenuAction icon={<Trash2 size={16} />} label={t('common.delete', 'Xóa')} onClick={onDelete} className="delete" />
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  // 3. FIX so sánh Playlists: So sánh độ dài hoặc ID cuối thay vì tham chiếu mảng
  return (
    prev.song.id === next.song.id &&
    prev.song.lyricId === next.song.lyricId &&
    prev.isSelected === next.isSelected &&
    prev.isPlaying === next.isPlaying &&
    prev.isActiveMenu === next.isActiveMenu &&
    prev.activeSubMenuId === next.activeSubMenuId &&
    prev.menuPlacement === next.menuPlacement &&
    prev.index === next.index &&
    prev.playlists.length === next.playlists.length // So sánh nông (Shallow) một cách thông minh
  );
});

// Helper component để code sạch hơn
const MenuAction = ({ icon, label, onClick, className = '' }: any) => (
  <button className={`menu-item ${className}`} onClick={onClick}>
    {icon}
    <span>{label}</span>
  </button>
);