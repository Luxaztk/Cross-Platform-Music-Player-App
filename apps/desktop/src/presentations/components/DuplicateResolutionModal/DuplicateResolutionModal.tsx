import React, { useState } from 'react';
import { X, Check, Copy, AlertCircle } from 'lucide-react';
import type { Song } from '@music/types';
import { useLanguage } from '../Language';
import './DuplicateResolutionModal.scss';

interface DuplicateResolutionModalProps {
  isOpen: boolean;
  duplicates: Song[];
  onClose: () => void;
  onResolve: (selectedSongs: Song[]) => void;
}

export const DuplicateResolutionModal: React.FC<DuplicateResolutionModalProps> = ({
  isOpen,
  duplicates,
  onClose,
  onResolve,
}) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen || duplicates.length === 0) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === duplicates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(duplicates.map(d => d.id)));
    }
  };

  const handleApply = () => {
    const selectedSongs = duplicates.filter(d => selectedIds.has(d.id));
    onResolve(selectedSongs);
    onClose();
  };

  return (
    <div className="duplicate-modal-overlay">
      <div className="duplicate-modal">
        <div className="modal-header">
          <h2>{t('modal.duplicatesFound') || 'Phát hiện trùng lặp'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <p>
            {t('modal.duplicatesDescription') || 
              `Phát hiện ${duplicates.length} bài hát đã tồn tại trong thư viện của bạn (dựa trên nội dung file). Bạn có muốn tiếp tục thêm các bản copy này không?`}
          </p>

          <div className="duplicate-list">
            {duplicates.map((song) => (
              <div 
                key={song.id} 
                className={`duplicate-item ${selectedIds.has(song.id) ? 'selected' : ''}`}
                onClick={() => toggleSelect(song.id)}
              >
                <div className="item-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-path">{song.filePath}</span>
                </div>
                {selectedIds.has(song.id) ? (
                  <Check size={18} className="text-primary" />
                ) : (
                  <Copy size={18} className="text-dim" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="secondary-btn" onClick={selectAll}>
            {selectedIds.size === duplicates.length ? t('common.deselectAll') || 'Bỏ chọn hết' : t('common.selectAll')}
          </button>
          <button 
            className="primary-btn" 
            onClick={handleApply}
            disabled={selectedIds.size === 0}
          >
            {t('common.addSelected') || `Thêm ${selectedIds.size} bài đã chọn`}
          </button>
        </div>
      </div>
    </div>
  );
};
