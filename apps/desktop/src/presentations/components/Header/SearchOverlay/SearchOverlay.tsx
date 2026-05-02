import React from 'react';
import { CornerDownLeft, ArrowUp, ArrowDown, Search, Loader2 } from 'lucide-react';
import { type SearchOverlayProps } from './types';
import { useSearchOverlay } from './useSearchOverlay';
import { RecentSearches } from './components/RecentSearches';
import { SongResultItem } from './components/SongResultItem';
import './SearchOverlay.scss';

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
  onAddToQueue
}) => {
  const {
    state,
    refs,
    actions,
    utils
  } = useSearchOverlay(query, results, selectedIndex);

  const { t } = utils;

  if (!query) {
    if (recentSearches.length === 0) return null;
    return (
      <RecentSearches
        recentSearches={recentSearches}
        onSelectRecent={onSelectRecent}
        onRemoveRecent={onRemoveRecent}
        onClearRecent={onClearRecent}
        t={t}
      />
    );
  }

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

      <div className="search-overlay-content" ref={refs.contentRef}>
        {results.isSearching && query !== '' ? (
          <div className="searching-state">
            <Loader2 size={24} className="animate-spin" />
            <span>{t('downloader.searching') || 'Đang tìm kiếm...'}</span>
          </div>
        ) : state.isTrulyEmpty ? (
          <div className="no-results">
            <Search size={48} strokeWidth={1} />
            <p>
              {t('search.noResults') || 'Không tìm thấy kết quả cho'} "{query}"
            </p>
          </div>
        ) : (
          <>
            {(state.clusteredSongs.titles.length > 0 || state.clusteredSongs.artists.length > 0 || state.clusteredSongs.albums.length > 0) && (
              <div className="results-section">
                <h4 className="section-title">{t('search.songs') || 'Bài hát'}</h4>
                
                {state.clusteredSongs.titles.map((song, idx) => (
                  <SongResultItem
                    key={`song-title-${song.id}`}
                    song={song}
                    globalIdx={idx}
                    selectedIndex={selectedIndex}
                    activeMenuId={state.activeMenuId}
                    menuPlacement={state.menuPlacement}
                    appIcon={state.appIcon}
                    onSelect={(s) => onSelect({ type: 'song', item: s })}
                    onMoreClick={actions.handleMoreClick}
                    onPlayNow={(s) => onSelect({ type: 'song', item: s })}
                    onPlayNext={onPlayNext}
                    onAddToQueue={onAddToQueue}
                    menuRef={refs.menuRef}
                    t={t}
                  />
                ))}

                {state.clusteredSongs.titles.length > 0 && (state.clusteredSongs.artists.length > 0 || state.clusteredSongs.albums.length > 0) && (
                  <div className="search-cluster-divider" />
                )}

                {state.clusteredSongs.artists.map((song, idx) => (
                  <SongResultItem
                    key={`song-artist-${song.id}`}
                    song={song}
                    globalIdx={state.clusteredSongs.titles.length + idx}
                    selectedIndex={selectedIndex}
                    activeMenuId={state.activeMenuId}
                    menuPlacement={state.menuPlacement}
                    appIcon={state.appIcon}
                    onSelect={(s) => onSelect({ type: 'song', item: s })}
                    onMoreClick={actions.handleMoreClick}
                    onPlayNow={(s) => onSelect({ type: 'song', item: s })}
                    onPlayNext={onPlayNext}
                    onAddToQueue={onAddToQueue}
                    menuRef={refs.menuRef}
                    t={t}
                  />
                ))}

                {state.clusteredSongs.artists.length > 0 && state.clusteredSongs.albums.length > 0 && (
                  <div className="search-cluster-divider" />
                )}

                {state.clusteredSongs.albums.map((song, idx) => (
                  <SongResultItem
                    key={`song-album-${song.id}`}
                    song={song}
                    globalIdx={state.clusteredSongs.titles.length + state.clusteredSongs.artists.length + idx}
                    selectedIndex={selectedIndex}
                    activeMenuId={state.activeMenuId}
                    menuPlacement={state.menuPlacement}
                    appIcon={state.appIcon}
                    onSelect={(s) => onSelect({ type: 'song', item: s })}
                    onMoreClick={actions.handleMoreClick}
                    onPlayNow={(s) => onSelect({ type: 'song', item: s })}
                    onPlayNext={onPlayNext}
                    onAddToQueue={onAddToQueue}
                    menuRef={refs.menuRef}
                    t={t}
                  />
                ))}
              </div>
            )}

            {results.artists.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.artists')}</h4>
                {results.artists.map((artist, idx) => {
                  const globalIdx = state.clusteredSongs.titles.length + state.clusteredSongs.artists.length + state.clusteredSongs.albums.length + idx;
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
                  );
                })}
              </div>
            )}

            {results.albums.length > 0 && (
              <div className="results-section">
                <h4 className="section-title">{t('search.albums')}</h4>
                {results.albums.map((album, idx) => {
                  const globalIdx = state.clusteredSongs.titles.length + state.clusteredSongs.artists.length + state.clusteredSongs.albums.length + results.artists.length + idx;
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
                            <img src={state.appIcon} alt="" className="placeholder-brand-icon-mini" />
                          </div>
                        )}
                        <div className="song-meta">
                          <span className="song-title">{album.name}</span>
                          <span className="song-artist">{album.artist}</span>
                        </div>
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
