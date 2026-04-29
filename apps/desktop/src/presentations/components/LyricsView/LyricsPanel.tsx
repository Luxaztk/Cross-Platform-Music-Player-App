import React, { useEffect, useRef, useState } from 'react';
import { useLyrics, usePlayer } from '@music/hooks';
import { useLanguage } from '@hooks';
import { 
  MessageSquareOff, 
  Search, 
  Loader2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Anchor
} from 'lucide-react';
import { formatLyricsSearchQuery } from '@music/core';
import { LYRIC_OFFSET } from '@music/hooks';
import type { LyricSearchResult } from '@music/types';
import './LyricsPanel.scss';



export const LyricsPanel: React.FC = () => {
  const { t } = useLanguage();
  const { currentSong, seek, progress } = usePlayer();
  const {
    lyricLines,
    currentLineIndex,
    isLoading,
    searchLyrics,
    saveLyrics,
    patchLyricSearchParam,
    offset,
    adjustOffset,
    setOffset,
    resetOffset
  } = useLyrics();

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => 
    currentSong?.lyricSearchParam || (currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : '')
  );
  const [lastQueryUsed, setLastQueryUsed] = useState('');
  const [showHint, setShowHint] = useState(true);

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

  const [prevSongId, setPrevSongId] = useState<string | undefined>(undefined);
  const [prevSearchParam, setPrevSearchParam] = useState<string | undefined>(undefined);

  if (currentSong?.id !== prevSongId || currentSong?.lyricSearchParam !== prevSearchParam) {
    setPrevSongId(currentSong?.id);
    setPrevSearchParam(currentSong?.lyricSearchParam);
    setSearchResults([]);
    setIsSearching(false);
    
    // Đồng bộ lại searchQuery khi đổi bài hoặc đổi tham số tìm kiếm
    const newQuery = currentSong?.lyricSearchParam || (currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : '');
    setSearchQuery(newQuery);
  }

  // Ephemeral Hint: Briefly show hidden buttons when panel opens
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLineClick = (time: number) => {
    seek(time);
  };

  const handleSearch = React.useCallback(async () => {
    if (!currentSong) return;
    setIsSearching(true);

    // Priority Logic: Check if lyricSearchParam exists, use it as primary search string.
    // If empty, fall back to the default (name + artist) and then (name).
    let query = searchQuery.trim();
    if (!query) {
      if (currentSong.lyricSearchParam) {
        query = currentSong.lyricSearchParam;
      } else {
        query = formatLyricsSearchQuery(currentSong.title, currentSong.artist);
      }
    }

    try {
      let results = await searchLyrics(query);
      setLastQueryUsed(query);

      // Step 2: Fallback to Title only if combined search returned no results
      if (results.length === 0 && query.includes(' - ')) {
        const fallbackQuery = currentSong.title;
        results = await searchLyrics(fallbackQuery);
        setLastQueryUsed(fallbackQuery);
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
      // Capture Search Term: When a user performs a manual search OR a successful auto-search that results in a lyric selection, capture that search string.
      if (lastQueryUsed) {
        await patchLyricSearchParam(lastQueryUsed);
      }
      setSearchResults([]);
      setSearchQuery('');
      setLastQueryUsed('');
    }
  }, [saveLyrics, patchLyricSearchParam, lastQueryUsed]);

  if (!currentSong) return null;

  return (
    <div className="lyrics-sidebar-container">
      <div className="lyrics-header">
        <div className="header-left">
          {lyricLines.length > 0 && searchResults.length === 0 && (
            <button 
              className={`change-lyrics-btn ${showHint ? 'hint-active' : ''}`} 
              onClick={handleSearch} 
              title={t('lyrics.changeLyrics')}
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {lyricLines.length > 0 && searchResults.length === 0 && (
          <div className="sync-toolbar">
            <div className="sync-buttons">
              <button onClick={() => adjustOffset(-5)} title={`${t('lyrics.adjustBackward')} 5s`}><ChevronsLeft size={14} /></button>
              <button onClick={() => adjustOffset(-1)} title={`${t('lyrics.adjustBackward')} 1s`}><ChevronLeft size={14} /></button>
              <button className="reset-btn" onClick={resetOffset} title={t('lyrics.resetOffset')}><RotateCcw size={12} /></button>
              <button onClick={() => adjustOffset(1)} title={`${t('lyrics.adjustForward')} 1s`}><ChevronRight size={14} /></button>
              <button onClick={() => adjustOffset(5)} title={`${t('lyrics.adjustForward')} 5s`}><ChevronsRight size={14} /></button>
            </div>
            <div className="sync-input">
              <input 
                type="number" 
                step="0.1"
                value={Math.round(offset * 10) / 10}
                onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
              />
              <span>s</span>
            </div>
          </div>
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
                className={`lyric-line-wrapper ${index === currentLineIndex ? 'active' : ''} ${index < currentLineIndex ? 'passed' : ''}`}
              >
                <div className="lyric-line" onClick={() => handleLineClick(line.time)}>
                  {line.text}
                </div>
                <button 
                  className="sync-now-btn" 
                  onClick={() => setOffset(progress - line.time - LYRIC_OFFSET)}
                  title={t('lyrics.syncNow')}
                >
                  <Anchor size={12} />
                </button>
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
