import React from 'react';
import { Filter, X } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type FilterChipsProps } from '../types';

export const FilterChips: React.FC<FilterChipsProps> = ({
    filter,
    onRemoveTag,
    t
}) => {
    if (filter.type === 'none' || filter.values.length === 0) return null;

    return (
        <div className="filter-chip-container">
            <div className="active-filter-label">
                <Filter size={ICON_SIZES.MINI} className="filter-icon" />
                <span className="filter-text">{t('playlist.filteringBy')}</span>
            </div>

            <div className="filter-tags-list">
                {filter.values.map((val) => (
                    <div key={val} className="active-filter-tag">
                        <span className="tag-value">{val}</span>
                        <button
                            className="remove-tag-btn"
                            onClick={() => onRemoveTag(val)}
                            title={t('common.clear')}
                        >
                            <X size={ICON_SIZES.MINI} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
