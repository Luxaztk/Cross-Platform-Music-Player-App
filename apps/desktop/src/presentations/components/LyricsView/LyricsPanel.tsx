import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLyricsPanel } from './useLyricsPanel';
import { LyricsHeader } from './components/LyricsHeader';
import { LyricsContent } from './components/LyricsContent';
import { LyricsSearch } from './components/LyricsSearch';
import { EmptyLyrics } from './components/EmptyLyrics';
import './LyricsPanel.scss';

export const LyricsPanel: React.FC = () => {
  const {
    state,
    refs,
    actions,
    utils
  } = useLyricsPanel();

  const { t } = utils;

  if (!state.currentSong) return null;

  const showSearch = state.searchResults.length > 0;
  const isBusy = state.isSearching || state.isLoading;

  return (
    <div className="lyrics-sidebar-container">
      <LyricsHeader
        hasLyrics={state.lyricLines.length > 0}
        showSearch={showSearch}
        showHint={state.showHint}
        offset={state.offset}
        onSearch={actions.handleSearch}
        onAdjustOffset={actions.adjustOffset}
        onSetOffset={actions.setOffset}
        onResetOffset={actions.resetOffset}
        t={t}
      />

      <main className="lyrics-body" ref={refs.scrollRef}>
        {isBusy && !showSearch ? (
          <div className="lyrics-status">
            <Loader2 className="spinner" size={32} />
            <p>{t('lyrics.searching')}</p>
          </div>
        ) : showSearch ? (
          <LyricsSearch
            isSearching={state.isSearching}
            searchQuery={state.searchQuery}
            searchResults={state.searchResults}
            currentLyricId={state.currentSong.lyricId}
            onSearchQueryChange={actions.setSearchQuery}
            onSearch={actions.handleSearch}
            onSelectResult={actions.selectSearchResult}
            onClose={() => {
              actions.setSearchResults([]);
              actions.setSearchQuery('');
            }}
            t={t}
          />
        ) : state.lyricLines.length > 0 ? (
          <LyricsContent
            lyricLines={state.lyricLines}
            currentLineIndex={state.currentLineIndex}
            progress={state.progress}
            onLineClick={actions.handleLineClick}
            onSyncNow={actions.setOffset}
            activeLineRef={refs.activeLineRef}
            t={t}
          />
        ) : (
          <EmptyLyrics
            isSearching={state.isSearching}
            isLoading={state.isLoading}
            searchQuery={state.searchQuery}
            onSearchQueryChange={actions.setSearchQuery}
            onSearch={actions.handleSearch}
            t={t}
          />
        )}
      </main>
    </div>
  );
};
