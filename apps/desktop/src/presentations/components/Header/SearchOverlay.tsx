import React, { useEffect, useRef, useMemo } from 'react'
import {
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Play,
  PlaySquare,
  ListPlus,
  MoreVertical,
  X,
  Clock,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react'
import type { Song, RecentSearch } from '@music/types'
import { type SearchResults, useLanguage, useTheme } from '@hooks'
// Sửa đường dẫn tương đối chính xác (3 cấp)
import { groupAndSortSongs } from '../../../application/utils/searchUtils'
import './SearchOverlay.scss'

export type SearchResultItem =
  | { type: 'song'; item: Song }
  | { type: 'artist'; item: SearchResults['artists'][number] }
  | { type: 'album'; item: SearchResults['albums'][number] }

interface SearchOverlayProps {
  query: string
  results: SearchResults
  recentSearches: RecentSearch[]
  selectedIndex: number
  onSelect: (item: SearchResultItem) => void
  onSelectRecent: (recent: RecentSearch) => void
  onRemoveRecent: (timestamp: number) => void
  onClearRecent: () => void
  onPlayNext: (song: Song) => void
  onAddToQueue: (song: Song) => void
  onClose: () => void
}

const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 20,
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  query,
  results,
  recentSearches,
  selectedIndex,
  onSelect,
  onSelectRecent,
  onRemoveRecent,
  onClearRecent,
  onPlayNext,
  onAddToQueue,
}) => {
  const { t } = useLanguage()
  const { appIcon } = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null)
  const [menuPlacement, setMenuPlacement] = React.useState<'top' | 'bottom'>('bottom')

  // PHASE 2: Clustering and Cap Limit (Memoization Mandate)
  const clusteredSongs = useMemo(() => {
    const groups = groupAndSortSongs(results.songs, query);
    return {
      titles: groups.titles.slice(0, 5),
      artists: groups.artists.slice(0, 5),
      albums: groups.albums.slice(0, 5),
    };
  }, [results.songs, query]);

  // Sync Keyboard Navigation: Unified flattened array matching render order
  const flatResults = useMemo(() => [
    ...clusteredSongs.titles.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...clusteredSongs.artists.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...clusteredSongs.albums.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...results.artists.map((a) => ({ type: 'artist' as const, item: a })),
    ...results.albums.map((al) => ({ type: 'album' as const, item: al })),
  ], [clusteredSongs, results.artists, results.albums]);

  // Tính tổng số lượng kết quả từ tất cả các cụm và thực thể
  const totalResultsCount = flatResults.length;
  const isTrulyEmpty = totalResultsCount === 0;

  // Auto-scroll logic when selectedIndex changes
  useEffect(() => {
    if (contentRef.current) {
      const activeItem = contentRef.current.querySelector('.search-item.active')
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [selectedIndex])

  // Click out to close menu
  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    if (activeMenuId) {
      window.addEventListener('mousedown', handleClickOut)
    }
    return () => window.removeEventListener('mousedown', handleClickOut)
  }, [activeMenuId])

  if (!query) {
    if (recentSearches.length === 0) return null

    return (
      <div className="search-overlay recent-view">
        <div className="search-overlay-header">
          <div className="section-header-row">
            <span className="section-label">{t('search.recent') || 'Tìm kiếm gần đây'}</span>
            <button className="clear-all-btn" onClick={onClearRecent}>
              <Trash2 size={14} />
              <span>{t('search.clearAll') || 'Xóa tất cả'}</span>
            </button>
          </div>
        </div>
        <div className="search-overlay-content">
          <div className="recent-list">
            {recentSearches.map((item) => (
              <div
                key={item.timestamp}
                className="recent-item"
                onClick={() => onSelectRecent(item)}
              >
                <div className="recent-item-left">
                  {item.type === 'query' ? (
                    <Clock size={16} className="item-icon" />
                  ) : (
                    <div className="entity-thumb">
                      <div className="thumb-placeholder">{item.name.charAt(0)}</div>
                    </div>
                  )}
                  <div className="item-info">
                    <span className="item-name">
                      {item.type === 'query' ? item.text : item.name}
                    </span>
                    {item.type === 'entity' && (
                      <span className="item-type">
                        {item.entityType === 'artist' ? t('search.artists') : t('search.albums')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    onRemoveRecent(item.timestamp)
                  }}
                  title={t('common.remove')}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderSongItem = (song: Song, globalIdx: number) => (
    <div
      key={`song-item-${song.id}`}
      className={`search-item song ${selectedIndex === globalIdx ? 'active' : ''}`}
      onClick={() => onSelect({ type: 'song', item: song })}
    >
      <div className="song-info">
        {song.coverArt ? (
          <img src={song.coverArt} alt="" className="song-thumb" />
        ) : (
          <div className="song-thumb-placeholder">
            <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
          </div>
        )}
        <div className="song-meta">
          <span className="song-title">{song.title}</span>
          <span className="song-artist">
            {song.artist}
          </span>
        </div>
      </div>

      <div className="item-actions">
        <button
          className={`more-btn ${activeMenuId === song.id ? 'active' : ''}`}
          title={t('common.more') || 'More options'}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            if (activeMenuId === song.id) {
              setActiveMenuId(null)
            } else {
              const rect = e.currentTarget.getBoundingClientRect()
              const containerRect = contentRef.current?.getBoundingClientRect()
              const spaceBelow = containerRect
                ? containerRect.bottom - rect.bottom
                : window.innerHeight - rect.bottom
              const menuHeight = 180
              setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom')
              setActiveMenuId(song.id)
            }
          }}
        >
          <MoreVertical size={ICON_SIZES.SMALL} />
        </button>

        {activeMenuId === song.id && (
          <div
            className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`}
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="menu-item"
              onClick={() => {
                onSelect({ type: 'song', item: song })
                setActiveMenuId(null)
              }}
            >
              <Play size={16} />
              {t('playlist.playNow')}
            </button>
            <button
              className="menu-item"
              onClick={() => {
                onPlayNext(song)
                setActiveMenuId(null)
              }}
            >
              <PlaySquare size={16} />
              {t('playlist.playNext')}
            </button>
            <button
              className="menu-item"
              onClick={() => {
                onAddToQueue(song)
                setActiveMenuId(null)
              }}
            >
              <ListPlus size={16} />
              {t('playlist.addToQueue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="search-overlay">
      <div className="search-overlay-header">
        <div className="nav-hints">
          <span className="hint">
            <ArrowUp size={12} className="hint-icon" />
            <ArrowDown size={12} className="hint-icon" />
            {t('search.moveHint')}
          </span>
          <span className="hint">
            <CornerDownLeft size={12} className="hint-icon" />
            {t('search.playHint')}
          </span>
        </div>
      </div>

      <div className="search-overlay-content" ref={contentRef}>
        {results.isSearching && query !== '' ? (
          <div className="searching-state">
            <Loader2 size={24} className="animate-spin" />
            <span>{t('downloader.searching') || 'Đang tìm kiếm...'}</span>
          </div>
        ) : isTrulyEmpty ? (
          <div className="no-results">
            <Search size={48} strokeWidth={1} />
            <p>
              {t('search.noResults') || 'Không tìm thấy kết quả cho'} "{query}"
            </p>
          </div>
        ) : (
          <>
            {/* Clustered Song Results: Titles, Artists, Albums with Dividers */}
            {(clusteredSongs.titles.length > 0 || clusteredSongs.artists.length > 0 || clusteredSongs.albums.length > 0) && (
              <div className="results-section">
                <h4 className="section-title">{t('search.songs') || 'Bài hát'}</h4>
                
                {clusteredSongs.titles.map((song: Song, idx: number) => renderSongItem(song, idx))}

                {/* Divider 1: Giữa Titles và Artists/Albums */}
                {clusteredSongs.titles.length > 0 && (clusteredSongs.artists.length > 0 || clusteredSongs.albums.length > 0) && (
                  <div className="search-cluster-divider" />
                )}

                {clusteredSongs.artists.map((song: Song, idx: number) => 
                  renderSongItem(song, clusteredSongs.titles.length + idx)
                )}

                {/* Divider 2: Giữa Artists và Albums */}
                {clusteredSongs.artists.length > 0 && clusteredSongs.albums.length > 0 && (
                  <div className="search-cluster-divider" />
                )}

                {clusteredSongs.albums.map((song: Song, idx: number) => 
                  renderSongItem(song, clusteredSongs.titles.length + clusteredSongs.artists.length + idx)
                )}
              </div>
            )}

            {/* Artist Entity Results */}
            {results.artists.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.artists')}</h4>
                {results.artists.map((artist, idx) => {
                  const globalIdx = clusteredSongs.titles.length + clusteredSongs.artists.length + clusteredSongs.albums.length + idx
                  return (
                    <div
                      key={`artist-ent-${artist.id}-${idx}`}
                      className={`search-item artist ${selectedIndex === globalIdx ? 'active' : ''}`}
                      onClick={() => onSelect({ type: 'artist', item: artist })}
                    >
                      <div className="song-info">
                        {artist.avatar ? (
                          <img src={artist.avatar} alt="" className="song-thumb circular" />
                        ) : (
                          <div className="song-thumb-placeholder circular initial-placeholder">
                            {artist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{artist.name}</span>
                          <span className="song-artist">{t('search.artists')}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Album Entity Results */}
            {results.albums.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.albums')}</h4>
                {results.albums.map((album, idx) => {
                  const globalIdx = clusteredSongs.titles.length + clusteredSongs.artists.length + clusteredSongs.albums.length + results.artists.length + idx
                  return (
                    <div
                      key={`album-ent-${album.id}-${idx}`}
                      className={`search-item album ${selectedIndex === globalIdx ? 'active' : ''}`}
                      onClick={() => onSelect({ type: 'album', item: album })}
                    >
                      <div className="song-info">
                        {album.coverArt ? (
                          <img src={album.coverArt} alt="" className="song-thumb" />
                        ) : (
                          <div className="song-thumb-placeholder">
                            <img src={appIcon} alt="" className="placeholder-brand-icon-mini" />
                          </div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{album.name}</span>
                          <span className="song-artist">
                            {album.artist}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
