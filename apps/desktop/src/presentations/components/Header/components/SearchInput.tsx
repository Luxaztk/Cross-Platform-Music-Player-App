import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type SearchInputProps } from '../types';

export const SearchInput: React.FC<SearchInputProps> = ({
    searchQuery,
    onSearchChange,
    onFocus,
    onClear,
    t
}) => {

    return (
        <div className="search-bar">
            <Search className="search-icon" size={ICON_SIZES.SMALL} />
            <input
                type="text"
                placeholder={t('header.searchPlaceholder', { defaultValue: 'Tìm kiếm bài hát... (Bấm ? để xem phím tắt)' })}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={onFocus}
            />
            {searchQuery && (
                <button className="clear-search" onClick={onClear} title={t('common.clear')}>
                    <X size={14} />
                </button>
            )}
            <div className="search-divider" />
            <button className="filter-options-btn" title={t('header.filterOptions')}>
                <SlidersHorizontal size={14} />
            </button>
        </div>
    );
};
