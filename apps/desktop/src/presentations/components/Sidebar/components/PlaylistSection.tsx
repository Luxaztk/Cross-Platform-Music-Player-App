import React from 'react';
import { Plus, Search, ArrowUpDown, Loader2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type PlaylistSectionProps } from '../types';
import { PlaylistItem } from './PlaylistItem';

export const PlaylistSection: React.FC<PlaylistSectionProps> = ({
    isVisible,
    playlists,
    query,
    isSearchExpanded,
    isDebouncing,
    sortMode,
    isSortMenuOpen,
    activeMenuId,
    menuPlacement,
    menuRef,
    sortMenuRef,
    searchInputRef,
    onQueryChange,
    onSearchToggle,
    onSearchBlur,
    onToggleSortMenu,
    onSortChange,
    onCreatePlaylist,
    onToggleMenu,
    onEditPlaylist,
    onDeletePlaylist,
    appIcon,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="nav-section-playlists">
            <div className="section-header">
                <h3>{t('sidebar.playlists')}</h3>
                <div className="section-actions">
                    <button className="add-playlist-btn" title={t('sidebar.createPlaylist')} onClick={onCreatePlaylist}>
                        <Plus size={ICON_SIZES.SMALL} />
                    </button>
                </div>
            </div>

            <div className="library-controls">
                <div className={`search-container ${isSearchExpanded ? 'expanded' : ''}`}>
                    <button
                        className={`search-btn ${query ? 'has-query' : ''}`}
                        onMouseDown={onSearchToggle}
                        title={t('header.searchPlaceholder')}
                    >
                        <Search size={ICON_SIZES.XSMALL} />
                    </button>
                    <div className="search-input-wrapper">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('header.searchPlaceholder')}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            onBlur={onSearchBlur}
                            className="playlist-search-input"
                        />
                    </div>
                </div>

                <div className="controls-right-group">
                    <div className="sort-filter-container" ref={sortMenuRef}>
                        <button
                            className={`control-btn ${sortMode !== 'default' ? 'active' : ''}`}
                            title={t('sidebar.sort')}
                            onClick={() => onToggleSortMenu(!isSortMenuOpen)}
                        >
                            <ArrowUpDown size={ICON_SIZES.XSMALL} />
                        </button>
                        {isSortMenuOpen && (
                            <div className="sort-menu open-down">
                                <div className="menu-label">{t('sidebar.sort') || 'Sắp xếp'}</div>
                                <button
                                    className={`menu-item ${sortMode === 'az' ? 'active' : ''}`}
                                    onClick={() => onSortChange('az')}
                                >
                                    <span>{t('sidebar.sortAZ') || 'Tên (A-Z)'}</span>
                                </button>
                                <button
                                    className={`menu-item ${sortMode === 'za' ? 'active' : ''}`}
                                    onClick={() => onSortChange('za')}
                                >
                                    <span>{t('sidebar.sortZA') || 'Tên (Z-A)'}</span>
                                </button>
                                <button
                                    className={`menu-item ${sortMode === 'default' ? 'active' : ''}`}
                                    onClick={() => onSortChange('default')}
                                >
                                    <span>{t('sidebar.sortDefault') || 'Mặc định'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isDebouncing && query ? (
                <div className="searching-sidebar">
                    <Loader2 size={16} className="animate-spin" />
                    <span>{t('downloader.searching') || 'Searching...'}</span>
                </div>
            ) : playlists.length === 0 ? (
                <div className="empty-playlists">
                    {query ? (
                        <p>{t('sidebar.noResults') || 'No results found.'}</p>
                    ) : (
                        <>
                            <p>{t('sidebar.noPlaylists')}</p>
                            <button className="create-first-btn" onClick={onCreatePlaylist}>
                                {t('sidebar.createFirst')}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <ul>
                    {playlists.map((playlist) => (
                        <PlaylistItem
                            key={playlist.id}
                            playlist={playlist}
                            isActive={window.location.hash.includes(`/playlist/${playlist.id}`)}
                            isMenuOpen={activeMenuId === playlist.id}
                            menuPlacement={menuPlacement}
                            menuRef={menuRef}
                            onToggleMenu={onToggleMenu}
                            onEdit={onEditPlaylist}
                            onDelete={onDeletePlaylist}
                            appIcon={appIcon}
                            t={t}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};
