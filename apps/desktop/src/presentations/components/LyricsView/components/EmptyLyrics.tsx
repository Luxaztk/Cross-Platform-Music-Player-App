import React from 'react';
import { MessageSquareOff, Search, Loader2 } from 'lucide-react';
import { type EmptyLyricsProps } from '../types';

export const EmptyLyrics: React.FC<EmptyLyricsProps> = ({
    isSearching,
    isLoading,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    t
}) => {
    return (
        <div className="lyrics-status empty">
            <MessageSquareOff size={48} />
            <p>{t('lyrics.noLyrics')}</p>

            <div className="search-input-container">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                    placeholder={t('lyrics.searchPlaceholder')}
                />
            </div>

            <button className="search-btn" onClick={onSearch} disabled={isSearching || isLoading}>
                {isSearching ? <Loader2 className="spinner-small" size={16} /> : <Search size={16} />}
                <span>{t('lyrics.searchOnline')}</span>
            </button>
        </div>
    );
};
