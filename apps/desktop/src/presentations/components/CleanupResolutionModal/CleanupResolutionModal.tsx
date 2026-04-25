import React, { useState } from 'react';
import { X, Check, Trash2, AlertTriangle, FileX } from 'lucide-react';
import type { Song } from '@music/types';
import { useLanguage } from '@hooks';
import './CleanupResolutionModal.scss';

interface CleanupResolutionModalProps {
  isOpen: boolean;
  missingSongs: Song[];
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}

export const CleanupResolutionModal: React.FC<CleanupResolutionModalProps> = ({
  isOpen,
  missingSongs,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(missingSongs.map(s => s.id)));

  if (!isOpen || missingSongs.length === 0) return null;

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
    if (selectedIds.size === missingSongs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(missingSongs.map(s => s.id)));
    }
  };

  const handleApply = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="cleanup-modal-overlay">
      <div className="cleanup-modal">
        <div className="modal-header">
          <div className="title-with-icon">
            <AlertTriangle size={24} className="warning-icon" />
            <h2>{t('libraryCleanup.title') || 'Dọn dẹp thư viện'}</h2>
          </div>
          <button className="close-btn" onClick={onClose} title={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="cleanup-info">
            <p>
              {t('libraryCleanup.foundMissingDescription').replace('{count}', missingSongs.length.toString())}
            </p>
          </div>

          <div className="cleanup-list">
            {missingSongs.map((song) => (
              <div 
                key={song.id} 
                className={`cleanup-item ${selectedIds.has(song.id) ? 'selected' : ''}`}
                onClick={() => toggleSelect(song.id)}
              >
                <div className="item-icon">
                    <FileX size={20} />
                </div>
                <div className="item-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-path" title={song.filePath}>{song.filePath}</span>
                </div>
                <div className="checkbox-wrapper">
                    {selectedIds.has(song.id) ? (
                    <div className="checkbox checked">
                        <Check size={14} />
                    </div>
                    ) : (
                    <div className="checkbox" />
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
              <button className="text-btn" onClick={selectAll}>
                {selectedIds.size === missingSongs.length ? t('common.deselectAll') : t('common.selectAll')}
              </button>
          </div>
          <div className="footer-right">
              <button className="secondary-btn" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button 
                className="primary-btn danger-btn" 
                onClick={handleApply}
                disabled={selectedIds.size === 0}
              >
                <Trash2 size={16} />
                <span>{t('libraryCleanup.removeSelected').replace('{count}', selectedIds.size.toString())}</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
