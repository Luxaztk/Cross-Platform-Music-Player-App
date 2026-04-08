import React, { useEffect, useRef, useState } from 'react';
import { useLyrics, usePlayer } from '@music/hooks';
import { MessageSquareOff, Search, Loader2, RotateCcw } from 'lucide-react';
import { formatLyricsSearchQuery } from '@music/utils';
import './LyricsPanel.scss';

interface LyricsPanelProps {}

export const LyricsPanel: React.FC<LyricsPanelProps> = () => {
  const { currentSong, seek } = usePlayer();
  const {
    lyricLines,
    currentLineIndex,
    isLoading,
    searchLyrics,
    saveLyrics
  } = useLyrics();

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
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
    setSearchQuery('');
  }, [currentSong?.id]);

  const handleLineClick = (time: number) => {
    seek(time);
  };

  const handleSearch = React.useCallback(async () => {
    if (!currentSong) return;
    setIsSearching(true);

    // Default format: "Song Name - Artist" using shared logic
    const query = searchQuery || formatLyricsSearchQuery(currentSong.title, currentSong.artist);
    if (!searchQuery) setSearchQuery(query);

    try {
      console.log(`[LyricsView] Step 1: Searching for "${query}"`);
      let results = await searchLyrics(query);

      // Step 2: Fallback to Title only if combined search returned no results
      if (results.length === 0 && query.includes(' - ')) {
        console.log(`[LyricsView] Step 2: Falling back to Title only: "${currentSong.title}"`);
        results = await searchLyrics(currentSong.title);
      }

      console.log(`[LyricsView] Final search results: ${results.length}`);
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
          <button className="change-lyrics-btn" onClick={handleSearch} title="Đổi lời bài hát">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      <main className="lyrics-body" ref={scrollRef}>
        {(isSearching || isLoading) && searchResults.length === 0 ? (
          <div className="lyrics-status">
            <Loader2 className="spinner" size={32} />
            <p>Đang tìm kiếm lời bài hát...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="search-results-sidebar">
            <div className="search-results-header">
              <h3>Kết quả tìm kiếm</h3>
              <button className="close-results" onClick={() => { setSearchResults([]); setSearchQuery(''); }}>Hủy</button>
            </div>

            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm nội dung khác..."
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
                      {isActive && <span className="active-tag">Đang dùng</span>}
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
            <p>Không có lời bài hát</p>

            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery || formatLyricsSearchQuery(currentSong.title, currentSong.artist)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập tên bài hát - ca sĩ..."
              />
            </div>

            <button className="search-btn" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="spinner-small" size={16} /> : <Search size={16} />}
              <span>Tìm kiếm trực tuyến</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
