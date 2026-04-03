import React, { useEffect, useRef } from 'react';
import { Music, CornerDownLeft, ArrowUp, ArrowDown, User, Disc, Play, PlaySquare, ListPlus, MoreVertical } from 'lucide-react';
import type { Song } from '@music/types';
import type { SearchResults } from '../../../application/hooks';
import { useLanguage } from '../Language';
import './SearchOverlay.scss';

interface SearchOverlayProps {
  query: string;
  results: SearchResults;
  selectedIndex: number;
  onSelect: (item: any) => void;
  onPlayNext: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onClose: () => void;
}

const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 20
};

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  query,
  results,
  selectedIndex,
  onSelect,
  onPlayNext,
  onAddToQueue,
}) => {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = React.useState<'top' | 'bottom'>('bottom');

  // Auto-scroll logic when selectedIndex changes
  useEffect(() => {
    if (contentRef.current) {
      const activeItem = contentRef.current.querySelector('.search-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  // Click out to close menu
  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('mousedown', handleClickOut);
    }
    return () => window.removeEventListener('mousedown', handleClickOut);
  }, [activeMenuId]);

  if (!query) return null;

  // Flatten results for unified indexing (Must match Header.tsx logic)
  const flattenedSongs = results.songs.map(s => ({ type: 'song', item: s }));
  const flattenedArtists = results.artists.map(a => ({ type: 'artist', item: a }));
  const flattenedAlbums = results.albums.map(al => ({ type: 'album', item: al }));
  
  const flatResults = [
    ...flattenedSongs,
    ...flattenedArtists,
    ...flattenedAlbums,
  ];

  const hasResults = flatResults.length > 0;

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
        {!hasResults ? (
          <div className="no-results">
            {t('search.noResults')} "{query}"
          </div>
        ) : (
          <>
            {/* Song Results */}
            {results.songs.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.songs')}</h4>
                {results.songs.map((song, idx) => {
                  const globalIdx = idx;
                  return (
                    <div 
                      key={`song-${song.id}`}
                      className={`search-item song ${selectedIndex === globalIdx ? 'active' : ''}`}
                      onClick={() => onSelect({ type: 'song', item: song })}
                    >
                      <div className="song-info">
                        {song.coverArt ? (
                          <img src={song.coverArt} alt="" className="song-thumb" />
                        ) : (
                          <div className="song-thumb-placeholder"><Music size={14} /></div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{song.title}</span>
                          <span className="song-artist">{t('search.songs')} • {song.artist}</span>
                        </div>
                      </div>
                      
                      
                      <div className="item-actions">
                        <button 
                          className={`more-btn ${activeMenuId === song.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === song.id) {
                              setActiveMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = contentRef.current?.getBoundingClientRect();
                              const spaceBelow = containerRect ? containerRect.bottom - rect.bottom : window.innerHeight - rect.bottom;
                              const menuHeight = 180;
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
                              onSelect({ type: 'song', item: song });
                              setActiveMenuId(null);
                            }}>
                              <Play size={16} />
                              {t('playlist.playNow')}
                            </button>
                            <button className="menu-item" onClick={() => {
                              onPlayNext(song);
                              setActiveMenuId(null);
                            }}>
                              <PlaySquare size={16} />
                              {t('playlist.playNext')}
                            </button>
                            <button className="menu-item" onClick={() => {
                              onAddToQueue(song);
                              setActiveMenuId(null);
                            }}>
                              <ListPlus size={16} />
                              {t('playlist.addToQueue')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Artist Results */}
            {results.artists.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.artists')}</h4>
                {results.artists.map((artist, idx) => {
                  const globalIdx = results.songs.length + idx;
                  return (
                    <div 
                      key={`artist-${artist.id}`}
                      className={`search-item artist ${selectedIndex === globalIdx ? 'active' : ''}`}
                      onClick={() => onSelect({ type: 'artist', item: artist })}
                    >
                      <div className="song-info">
                        {artist.avatar ? (
                          <img src={artist.avatar} alt="" className="song-thumb circular" />
                        ) : (
                          <div className="song-thumb-placeholder circular"><User size={14} /></div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{artist.name}</span>
                          <span className="song-artist">{t('search.artists')}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          className={`more-btn ${activeMenuId === artist.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === artist.id) {
                              setActiveMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = contentRef.current?.getBoundingClientRect();
                              const spaceBelow = containerRect ? containerRect.bottom - rect.bottom : window.innerHeight - rect.bottom;
                              const menuHeight = 120;
                              setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
                              setActiveMenuId(artist.id);
                            }
                          }}
                        >
                          <MoreVertical size={ICON_SIZES.SMALL} />
                        </button>
                        
                        {activeMenuId === artist.id && (
                          <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`} 
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}>
                            <button className="menu-item" onClick={() => {
                              onSelect({ type: 'artist', item: artist });
                              setActiveMenuId(null);
                            }}>
                              <Play size={16} />
                              {t('playlist.playNow')}
                            </button>
                            {/* Add other artist-specific actions here if needed */}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Album Results */}
            {results.albums.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.albums')}</h4>
                {results.albums.map((album, idx) => {
                  const globalIdx = results.songs.length + results.artists.length + idx;
                  return (
                    <div 
                      key={`album-${album.id}`}
                      className={`search-item album ${selectedIndex === globalIdx ? 'active' : ''}`}
                      onClick={() => onSelect({ type: 'album', item: album })}
                    >
                      <div className="song-info">
                        {album.coverArt ? (
                           <img src={album.coverArt} alt="" className="song-thumb" />
                        ) : (
                          <div className="song-thumb-placeholder"><Disc size={14} /></div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{album.name}</span>
                          <span className="song-artist">{t('search.albums')} • {album.artist}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          className={`more-btn ${activeMenuId === album.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === album.id) {
                              setActiveMenuId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = contentRef.current?.getBoundingClientRect();
                              const spaceBelow = containerRect ? containerRect.bottom - rect.bottom : window.innerHeight - rect.bottom;
                              const menuHeight = 120;
                              setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
                              setActiveMenuId(album.id);
                            }
                          }}
                        >
                          <MoreVertical size={ICON_SIZES.SMALL} />
                        </button>
                        
                        {activeMenuId === album.id && (
                          <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`} 
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}>
                            <button className="menu-item" onClick={() => {
                              onSelect({ type: 'album', item: album });
                              setActiveMenuId(null);
                            }}>
                              <Play size={16} />
                              {t('playlist.playNow')}
                            </button>
                            {/* Add other album-specific actions here if needed */}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
