import React, { useCallback, useMemo } from 'react';
import { CheckSquare, Play, MoreVertical } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '@constants';
import { formatTime } from '@music/utils';


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
    t,
    onToggleSelect,
    onPlay,
    onToggleFilter,
    onToggleMenu,
  }) => {
    // 1. Tách nghệ sĩ và giữ nguyên dấu nối gốc (ft., x, &, ,, and)
    const artistParts = useMemo(() => {
      const rawArtist = song.artist || '';
      // Regex tách nhưng giữ lại separator
      return rawArtist.split(/(\s(?:ft\.?|x|&|and)\s|,\s?)/i);
    }, [song.artist]);

    // 2. Handler click tiêu đề
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
              <CheckSquare size={ICON_SIZES.XSMALL} className="text-primary" />
            ) : isPlaying ? (
              <Play size={ICON_SIZES.TINY} className="playing-icon" />
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
                {artistParts.map((part, i) => {
                  const isSeparator = /(\s(?:ft\.?|x|&|and)\s|,\s?)/i.test(part);
                  if (isSeparator) {
                    return <span key={i} className="artist-separator">{part}</span>;
                  }
                  return (
                    <span
                      key={i}
                      className="clickable-artist"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFilter('artist', part.trim());
                      }}
                    >
                      {part}
                    </span>
                  );
                })}
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
            title={t('common.moreActions')}
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
