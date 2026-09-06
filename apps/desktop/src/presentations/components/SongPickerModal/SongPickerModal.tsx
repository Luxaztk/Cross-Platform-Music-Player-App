import React from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import type { Song } from '@music/types';
import { useSongPicker } from './useSongPicker';
import { ICON_SIZES } from '@constants';
import './SongPickerModal.scss';

interface SongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs: Song[];
  existingSongIds: string[];
  onAdd: (selectedSongIds: string[]) => void;
}

export const SongPickerModal: React.FC<SongPickerModalProps> = ({
  isOpen,
  onClose,
  allSongs,
  existingSongIds,
  onAdd,
}) => {
  const { state, actions, utils } = useSongPicker(allSongs, existingSongIds, onAdd, onClose);
  const { t, appIcon } = utils;

  if (!isOpen) return null;

  return (
    <div className="song-picker-modal-overlay" onClick={actions.onClose}>
      <div className="song-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modal.selectSongs')}</h2>
          <button type="button" className="close-btn" onClick={actions.onClose} title={t('common.close')}>
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        <div className="search-container">
          <Search size={ICON_SIZES.SMALL} className="search-icon" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-content">
          {state.isDebouncing && state.searchQuery !== '' ? (
            <div className="searching-state">
              <Loader2 size={24} className="animate-spin" />
              <p>{t('downloader.searching')}</p>
            </div>
          ) : (state.isTrulyEmpty && state.searchQuery !== '') ? (
            <div className="no-results">
              <Search size={48} strokeWidth={1} />
              <p>{t('sidebar.noResults')}</p>
            </div>
          ) : (
            <div className="clustered-results">
              {/* Cụm 1: Khớp tiêu đề */}
              {state.clusteredResults.titles.map(song => (
                <SongPickerItem 
                  key={song.id} 
                  song={song} 
                  isSelected={state.selectedIds.has(song.id)}
                  onClick={() => actions.toggleSelect(song.id)}
                  appIcon={appIcon}
                />
              ))}

              {/* Divider 1: Giữa Titles và Artists/Albums */}
              {(state.clusteredResults.titles.length > 0 && state.debouncedQuery) && 
               (state.clusteredResults.artists.length > 0 || state.clusteredResults.albums.length > 0) && (
                <div className="search-cluster-divider" />
              )}

              {/* Cụm 2: Khớp nghệ sĩ */}
              {state.clusteredResults.artists.map(song => (
                <SongPickerItem 
                  key={song.id} 
                  song={song} 
                  isSelected={state.selectedIds.has(song.id)}
                  onClick={() => actions.toggleSelect(song.id)}
                  appIcon={appIcon}
                />
              ))}

              {/* Divider 2: Giữa Artists và Albums */}
              {state.clusteredResults.artists.length > 0 && state.clusteredResults.albums.length > 0 && (
                <div className="search-cluster-divider" />
              )}

              {/* Cụm 3: Khớp album */}
              {state.clusteredResults.albums.map(song => (
                <SongPickerItem 
                  key={song.id} 
                  song={song} 
                  isSelected={state.selectedIds.has(song.id)}
                  onClick={() => actions.toggleSelect(song.id)}
                  appIcon={appIcon}
                />
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={actions.onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="primary-btn" onClick={actions.handleAdd} disabled={state.selectedIds.size === 0}>
            {t('common.addSelected')} ({state.selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};

interface SongPickerItemProps {
  song: Song;
  isSelected: boolean;
  onClick: () => void;
  appIcon: string;
}

// Sub-component for individual song items
const SongPickerItem: React.FC<SongPickerItemProps> = ({ song, isSelected, onClick, appIcon }) => (
  <div
    className={`song-item ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="song-info">
      <div className="song-thumb">
        {song.coverArt ? (
          <img src={song.coverArt} alt={song.title} />
        ) : (
          <img src={appIcon} alt="Default" className="placeholder-brand-icon-mini" />
        )}
      </div>
      <div className="song-details">
        <span className="title">{song.title}</span>
        <span className="artist">{song.artist}</span>
      </div>
    </div>
    <div className="checkbox">{isSelected && <Check size={ICON_SIZES.XSMALL} />}</div>
  </div>
);
