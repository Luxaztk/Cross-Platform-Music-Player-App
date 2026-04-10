import React, { useEffect, useRef, useState } from 'react';
import { useLyrics, usePlayer } from '@music/hooks';
import { useLanguage } from '../Language';
import { MessageSquareOff, Search, Loader2, RotateCcw } from 'lucide-react';
import { formatLyricsSearchQuery } from '@music/utils';
import type { LyricSearchResult } from '@music/types';
import './LyricsPanel.scss';



export const LyricsPanel: React.FC = () => {
  const { t } = useLanguage();
  const { currentSong, seek } = usePlayer();
  const {
    lyricLines,
    currentLineIndex,
    isLoading,
    searchLyrics,
    saveLyrics
  } = useLyrics();

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active line
  useEffect(() => {
    if (activeLineRef.current && scrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex]);

  // Reset search state when song changes
  useEffect(() => {
    setSearchResults([]);
    setIsSearching(false);
    setSearchQuery(currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : '');
  }, [currentSong?.id, currentSong?.title, currentSong?.artist]);

  const handleLineClick = (time: number) => {
    seek(time);
  };

  const handleSearch = React.useCallback(async () => {
    if (!currentSong) return;
    setIsSearching(true);

    // Use explicitly provided query or fallback to default format: "Song Name - Artist"
    const query = searchQuery.trim() || formatLyricsSearchQuery(currentSong.title, currentSong.artist);

    try {
      let results = await searchLyrics(query);

      // Step 2: Fallback to Title only if combined search returned no results
      if (results.length === 0 && query.includes(' - ')) {
        results = await searchLyrics(currentSong.title);
      }

      setSearchResults(results);
    } catch (err) {
      console.error('[LyricsView] handleSearch failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [currentSong, searchQuery, searchLyrics]);

  const selectSearchResult = React.useCallback(async (lyrics: string, lyricId: number) => {
    const success = await saveLyrics(lyrics, lyricId);
    if (success) {
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [saveLyrics]);

  if (!currentSong) return null;

  return (
    <div className="lyrics-sidebar-container">
      <div className="lyrics-header">
        {lyricLines.length > 0 && searchResults.length === 0 && (
          <button className="change-lyrics-btn" onClick={handleSearch} title={t('lyrics.changeLyrics')}>
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      <main className="lyrics-body" ref={scrollRef}>
        {(isSearching || isLoading) && searchResults.length === 0 ? (
          <div className="lyrics-status">
            <Loader2 className="spinner" size={32} />
            <p>{t('lyrics.searching')}</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="search-results-sidebar">
            <div className="search-results-header">
              <h3>{t('lyrics.searchResults')}</h3>
              <button className="close-results" onClick={() => { setSearchResults([]); setSearchQuery(''); }}>{t('common.cancel')}</button>
            </div>

            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('lyrics.searchOther')}
                autoFocus
              />
              <button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="spinner-small" size={14} /> : <Search size={14} />}
              </button>
            </div>

            <div className="results-list">
              {searchResults.map((res, i) => {
                const isActive = res.id && currentSong?.lyricId && String(currentSong.lyricId) === String(res.id);
                return (
                  <div
                    key={res.id || i}
                    className={`result-item ${isActive ? 'active-result' : ''}`}
                    onClick={() => selectSearchResult(res.syncedLyrics || res.plainLyrics, res.id)}
                  >
                    <div className="res-header">
                      <div className="res-title">{res.trackName}</div>
                      {isActive && <span className="active-tag">{t('lyrics.currentlyUsing')}</span>}
                    </div>
                    <div className="res-meta">{res.artistName} • {res.albumName}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : lyricLines.length > 0 ? (
          <div className="lyrics-content">
            {lyricLines.map((line, index) => (
              <div
                key={index}
                ref={index === currentLineIndex ? activeLineRef : null}
                className={`lyric-line ${index === currentLineIndex ? 'active' : ''} ${index < currentLineIndex ? 'passed' : ''}`}
                onClick={() => handleLineClick(line.time)}
              >
                {line.text}
              </div>
            ))}
          </div>
        ) : (
          <div className="lyrics-status empty">
            <MessageSquareOff size={48} />
            <p>{t('lyrics.noLyrics')}</p>

            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('lyrics.searchPlaceholder')}
              />
            </div>

            <button className="search-btn" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="spinner-small" size={16} /> : <Search size={16} />}
              <span>{t('lyrics.searchOnline')}</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
