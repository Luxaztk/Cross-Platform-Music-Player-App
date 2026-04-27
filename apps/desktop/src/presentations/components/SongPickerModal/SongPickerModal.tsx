import React, { useState, useMemo } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import type { Song } from '@music/types';
import { useTheme, useLanguage, useClusteredSearch } from '@hooks';
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
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter out songs already in the playlist
  const availableSongs = useMemo(() => {
    return allSongs.filter((song) => !existingSongIds.includes(song.id));
  }, [allSongs, existingSongIds]);

  // Use the new clustered search hook which handles debounce, filter and group
  const { clusteredResults, debouncedQuery, isDebouncing } = useClusteredSearch(availableSongs, searchQuery);

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

  const renderSongList = (songs: Song[]) => (
    <>
      {songs.map((song) => (
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
          <div className="checkbox">{selectedIds.has(song.id) && <Check size={ICON_SIZES.XSMALL} />}</div>
        </div>
      ))}
    </>
  );

  // Tính toán trạng thái rỗng
  const totalResultsCount = (clusteredResults.titles?.length || 0) + 
                           (clusteredResults.artists?.length || 0) + 
                           (clusteredResults.albums?.length || 0);
  const isTrulyEmpty = totalResultsCount === 0;

  return (
    <div className="song-picker-modal-overlay">
      <div className="song-picker-modal">
        <div className="modal-header">
          <h2>{t('modal.selectSongs') || 'Chọn bài hát để thêm'}</h2>
          <button className="close-btn" onClick={onClose} title={t('common.close')}>
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        <div className="search-container">
          <Search size={ICON_SIZES.SMALL} className="search-icon" />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="modal-content">
          {isDebouncing && searchQuery !== '' ? (
            <div className="searching-state">
              <Loader2 size={24} className="animate-spin" />
              <p>{t('downloader.searching') || 'Đang tìm kiếm...'}</p>
            </div>
          ) : (isTrulyEmpty && searchQuery !== '') ? (
            <div className="no-results">
              <Search size={48} strokeWidth={1} />
              <p>{t('sidebar.noResults') || 'Không tìm thấy kết quả nào.'}</p>
            </div>
          ) : (
            <div className="clustered-results">
              {/* Cụm 1: Khớp tiêu đề */}
              {renderSongList(clusteredResults.titles)}

              {/* Divider 1: Giữa Titles và Artists/Albums */}
              {(clusteredResults.titles.length > 0 && debouncedQuery) && (clusteredResults.artists.length > 0 || clusteredResults.albums.length > 0) && (
                <div className="search-cluster-divider" />
              )}

              {/* Cụm 2: Khớp nghệ sĩ */}
              {renderSongList(clusteredResults.artists)}

              {/* Divider 2: Giữa Artists và Albums */}
              {clusteredResults.artists.length > 0 && clusteredResults.albums.length > 0 && (
                <div className="search-cluster-divider" />
              )}

              {/* Cụm 3: Khớp album */}
              {renderSongList(clusteredResults.albums)}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="primary-btn" onClick={handleAdd} disabled={selectedIds.size === 0}>
            {t('common.addSelected') || 'Add selected'} ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};
