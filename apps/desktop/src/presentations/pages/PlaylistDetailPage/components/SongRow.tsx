import React, { useCallback, useMemo } from 'react';
import { CheckSquare, Square, Play, MoreVertical } from 'lucide-react';
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
  t: (key: string, options?: Record<string, string | number>) => string;
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

    // 2. Handler click row
    const handleRowClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 2) return; // Bỏ qua click chuột phải
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          onToggleSelect(song.id, e);
        } else {
          onPlay();
        }
      },
      [song.id, onToggleSelect, onPlay],
    );

    const handleIndexClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSelect(song.id, e);
      },
      [song.id, onToggleSelect],
    );

    return (
      <div
        className={`song-row ${isSelected ? 'selected' : ''} ${isActiveMenu ? 'menu-open' : ''} ${isPlaying ? 'playing' : ''} ${hasActiveSelection ? 'has-selection' : ''}`}
        onClick={handleRowClick}
      >
        <div className="col-idx" onClick={handleIndexClick}>
          <div className="checkbox-cell">
            {hasActiveSelection ? (
              isSelected ? (
                <CheckSquare size={ICON_SIZES.XSMALL} className="text-primary" />
              ) : (
                <Square size={ICON_SIZES.XSMALL} />
              )
            ) : isSelected ? (
              <CheckSquare size={ICON_SIZES.XSMALL} className="text-primary" />
            ) : isPlaying ? (
              <Play size={ICON_SIZES.TINY} className="playing-icon" />
            ) : (
              <>
                <span className="row-number">{index + 1}</span>
                <Play size={ICON_SIZES.TINY} className="row-play-btn" onClick={(e) => { e.stopPropagation(); onPlay(); }} />
              </>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="title-text"
                  style={{ color: isPlaying ? 'var(--color-primary)' : undefined }}
                >
                  {song.title}
                </span>
                {song.sourceType === 'stream' && (
                  <span
                    className="badge-streaming-indicator"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--color-primary, #10b981)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      letterSpacing: '0.5px',
                      lineHeight: '12px',
                    }}
                  >
                    STREAM
                  </span>
                )}
              </div>
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
                      title={`💡 ${t('common.filterByArtist', { defaultValue: `Click để lọc bài hát của ${part.trim()}` })}`}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey || e.shiftKey) {
                          // Allow bubbling to handleRowClick for selection
                          return;
                        }
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
          {!hasActiveSelection && (
            <button
              className={`row-more-btn ${isActiveMenu ? 'active' : ''} ${isPlaying ? 'visible' : ''}`}
              onClick={(e) => onToggleMenu(song.id, e)}
              title={t('common.moreActions')}
            >
              <MoreVertical size={ICON_SIZES.SMALL} />
            </button>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    // 3. FIX so sánh Playlists: So sánh độ dài hoặc ID cuối thay vì tham chiếu mảng
    return (
      prev.song === next.song &&
      prev.isSelected === next.isSelected &&
      prev.isPlaying === next.isPlaying &&
      prev.isActiveMenu === next.isActiveMenu &&
      prev.hasActiveSelection === next.hasActiveSelection &&
      prev.index === next.index &&
      prev.playlists === next.playlists &&
      prev.currentPlaylistId === next.currentPlaylistId
    );
  },
);
