import React from 'react';
import { FileMusic, FolderPlus, Loader2, Moon } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type PlaylistHeaderProps } from '../types';
import { formatTotalDuration } from '../utils';

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
    isLoading,
    isLibrary,
    playlist,
    localSongsCount,
    filteredSongsCount,
    libraryFilterType,
    totalDuration,
    isImporting,
    appIcon,
    onImportFiles,
    onImportFolder,
    onAddFromSystem,
    onEditPlaylist,
    isPlaylistExcluded,
    onToggleExcludePlaylist,
    t
}) => {
    return (
        <div className="playlist-header-container">
            <div className="playlist-cover-large">
                {isLoading ? (
                    <div className="skeleton-cover skeleton" />
                ) : playlist?.thumbnail ? (
                    <img src={playlist.thumbnail} alt={playlist.name} />
                ) : (
                    <img src={appIcon} alt="" className="placeholder-brand-icon" />
                )}
            </div>

            <div className="header-content">
                {isLoading ? (
                    <>
                        <div className="skeleton-text large skeleton" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="skeleton-metadata skeleton" />
                            <div className="skeleton-btn skeleton" style={{ width: '120px', height: '32px', marginTop: '12px' }} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="playlist-infor">
                            <h1
                                className={`playlist-name ${(!playlist?.description && !isLibrary) ? 'large' : ''}`}
                                onClick={() => !isLibrary && onEditPlaylist()}
                            >
                                {isLibrary ? t('playlist.libraryTitle') : (playlist?.name || '')}
                            </h1>
                            {(isLibrary || playlist?.description) && (
                                <p className="playlist-description">
                                    {isLibrary ? t('playlist.libraryDescription') : playlist?.description}
                                </p>
                            )}
                        </div>
                        <div className="playlist-metadata">
                            <div>
                                <span className="metadata-item">Melovista</span>
                                {localSongsCount > 0 && (
                                    <>
                                        <span className="metadata-separator">•</span>
                                        <span className="metadata-item">
                                            {libraryFilterType !== 'none' && filteredSongsCount > 0
                                                ? `${filteredSongsCount} / ${localSongsCount}`
                                                : localSongsCount}{' '}
                                            {t('playlist.songs')}
                                        </span>
                                        <span className="metadata-separator">•</span>
                                        <span className="metadata-item">{formatTotalDuration(totalDuration, t)}</span>
                                    </>
                                )}
                            </div>

                            <div className="header-actions-inline">
                                {isLibrary ? (
                                    <div className="import-btns">
                                        {isImporting ? (
                                            <button className="btn-primary-action btn-merged-loading" disabled>
                                                <Loader2 size={ICON_SIZES.SMALL} className="animate-spin" style={{ marginRight: '8px' }} />
                                                {t('playlist.processingData')}
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={onImportFiles} className="btn-primary-action">
                                                    <FileMusic size={ICON_SIZES.SMALL} style={{ marginRight: '8px' }} />
                                                    {t('playlist.importFiles')}
                                                </button>
                                                <button onClick={onImportFolder} className="btn-primary-action">
                                                    <FolderPlus size={ICON_SIZES.SMALL} style={{ marginRight: '8px' }} />
                                                    {t('playlist.importFolder')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button onClick={onAddFromSystem} className="btn-primary-action">
                                            + {t('playlist.addFromLibrary')}
                                        </button>
                                        {onToggleExcludePlaylist && (
                                            <button
                                                type="button"
                                                onClick={onToggleExcludePlaylist}
                                                className={`btn-primary-action ${isPlaylistExcluded ? 'active-exclude' : ''}`}
                                                style={{
                                                    background: isPlaylistExcluded ? 'var(--color-primary, #10b981)' : 'var(--bg-surface-raised, rgba(255, 255, 255, 0.08))',
                                                    color: isPlaylistExcluded ? '#fff' : 'var(--text-primary)',
                                                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                                                }}
                                                title={isPlaylistExcluded ? t('playlist.unexcludePlaylist') : t('playlist.excludePlaylistFromDefault')}
                                            >
                                                <Moon size={ICON_SIZES.SMALL} style={{ marginRight: '6px' }} />
                                                {isPlaylistExcluded ? t('playlist.excludedFromDefault') : t('playlist.excludeFromDefault')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
