import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import type { Song } from '@music/types';
import { useLanguage } from '../Language';
import { useTheme } from '../Theme';
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
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter out songs already in the playlist
  const availableSongs = useMemo(() => {
    return allSongs.filter(song => !existingSongIds.includes(song.id));
  }, [allSongs, existingSongIds]);

  // Filter by search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return availableSongs;
    const query = searchQuery.toLowerCase();
    return availableSongs.filter(
      song => 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query)
    );
  }, [availableSongs, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="song-picker-modal-overlay">
      <div className="song-picker-modal">
        <div className="modal-header">
          <h2>{t('modal.selectSongs') || 'Chọn bài hát để thêm'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-content">
          {filteredSongs.length === 0 ? (
            <div className="no-results">
              <p>{t('sidebar.noResults')}</p>
            </div>
          ) : (
            <div className="song-list">
              {filteredSongs.map((song) => (
                <div 
                  key={song.id} 
                  className={`song-item ${selectedIds.has(song.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(song.id)}
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
                  <div className="checkbox">
                    {selectedIds.has(song.id) && <Check size={16} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button 
            className="primary-btn" 
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
          >
            {t('common.addSelected') || 'Add selected'} ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
