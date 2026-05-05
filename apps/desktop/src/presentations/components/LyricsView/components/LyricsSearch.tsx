import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { type LyricsSearchProps } from '../types';

export const LyricsSearch: React.FC<LyricsSearchProps> = ({
    isSearching,
    searchQuery,
    searchResults,
    currentLyricId,
    onSearchQueryChange,
    onSearch,
    onSelectResult,
    onClose,
    t
}) => {
    return (
        <div className="search-results-sidebar">
            <div className="search-results-header">
                <h3>{t('lyrics.searchResults')}</h3>
                <button className="close-results" onClick={onClose}>{t('common.cancel')}</button>
            </div>

            <div className="search-input-container">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder={t('lyrics.searchOther')}
                    autoFocus
                />
                <button onClick={onSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="spinner-small" size={14} /> : <Search size={14} />}
                </button>
            </div>

            <div className="results-list">
                {searchResults.map((res, i) => {
                    const isActive = res.id && currentLyricId && String(currentLyricId) === String(res.id);
                    return (
                        <div
                            key={res.id || i}
                            className={`result-item ${isActive ? 'active-result' : ''}`}
                            onClick={() => onSelectResult(res.syncedLyrics || res.plainLyrics, res.id)}
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
    );
};
