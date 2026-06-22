import React from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import { type RecentSearch } from '@music/types';

interface RecentSearchesProps {
    recentSearches: RecentSearch[];
    onSelectRecent: (recent: RecentSearch) => void;
    onRemoveRecent: (timestamp: number) => void;
    onClearRecent: () => void;
    t: (key: string, options?: Record<string, unknown> | string) => string;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
    recentSearches,
    onSelectRecent,
    onRemoveRecent,
    onClearRecent,
    t
}) => {
    return (
        <div className="search-overlay recent-view">
            <div className="search-overlay-header">
                <div className="section-header-row">
                    <span className="section-label">{t('search.recent') || 'Tìm kiếm gần đây'}</span>
                    <button className="clear-all-btn" onClick={onClearRecent}>
                        <Trash2 size={14} />
                        <span>{t('search.clearAll') || 'Xóa tất cả'}</span>
                    </button>
                </div>
            </div>
            <div className="search-overlay-content">
                <div className="recent-list">
                    {recentSearches.map((item) => (
                        <div
                            key={item.timestamp}
                            className="recent-item"
                            onClick={() => onSelectRecent(item)}
                        >
                            <div className="recent-item-left">
                                {item.type === 'query' ? (
                                    <Clock size={16} className="item-icon" />
                                ) : (
                                    <div className="entity-thumb">
                                        <div className="thumb-placeholder">{item.name.charAt(0)}</div>
                                    </div>
                                )}
                                <div className="item-info">
                                    <span className="item-name">
                                        {item.type === 'query' ? item.text : item.name}
                                    </span>
                                    {item.type === 'entity' && (
                                        <span className="item-type">
                                            {item.entityType === 'artist' ? t('search.artists') : t('search.albums')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onRemoveRecent(item.timestamp);
                                }}
                                title={t('common.remove')}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
