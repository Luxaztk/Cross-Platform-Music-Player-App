import React, { useCallback, useMemo } from 'react';
import { CheckSquare, Play, MoreVertical } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '@constants';
import { formatTime, splitArtists } from '@music/utils';

interface SongRowProps {
  song: Song;
  index: number;
  isSelected: boolean;
  isPlaying: boolean;
  isActiveMenu: boolean;
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  hasActiveSelection: boolean;
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
}

export const SongRow: React.FC<SongRowProps> = React.memo(
  ({
    song,
    index,
    isSelected,
    isPlaying,
    isActiveMenu,
    hasActiveSelection,
    appIcon,
    onToggleSelect,
    onPlay,
    onToggleFilter,
    onToggleMenu,
  }) => {
    // 1. Tách logic xử lý Artists để tránh tính toán lại trong render
    const artistsList = useMemo(() => {
      const rawArtists = song.artists && song.artists.length > 0 ? song.artists : [song.artist];
      return rawArtists.flatMap((a) => splitArtists(a));
    }, [song.artists, song.artist]);

    // 2. Handler click tiêu đề (Ngăn chặn nổi bọt sự kiện một cách sạch sẽ)
    const handleTitleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay();
      },
      [onPlay],
    );

    const handleFirstColumnClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasActiveSelection) {
          onToggleSelect(song.id, e);
        } else {
          onPlay();
        }
      },
      [hasActiveSelection, song.id, onToggleSelect, onPlay],
    );

    return (
      <div
        className={`song-row ${isSelected ? 'selected' : ''} ${isActiveMenu ? 'menu-open' : ''} ${isPlaying ? 'playing' : ''}`}
        onClick={() => onToggleSelect(song.id)}
      >
        <div className="col-idx" onClick={handleFirstColumnClick}>
          <div className="checkbox-cell">
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
            className={`row-more-btn ${isActiveMenu ? 'active' : ''} ${isPlaying ? 'visible' : ''}`}
            onClick={(e) => onToggleMenu(song.id, e)}
            title="More actions"
          >
            <MoreVertical size={ICON_SIZES.SMALL} />
          </button>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // 3. FIX so sánh Playlists: So sánh độ dài hoặc ID cuối thay vì tham chiếu mảng
    return (
      prev.song.id === next.song.id &&
      prev.song.lyricId === next.song.lyricId &&
      prev.isSelected === next.isSelected &&
      prev.isPlaying === next.isPlaying &&
      prev.isActiveMenu === next.isActiveMenu &&
      prev.hasActiveSelection === next.hasActiveSelection &&
      prev.index === next.index &&
      prev.playlists.length === next.playlists.length // So sánh nông (Shallow) một cách thông minh
    );
  },
);
