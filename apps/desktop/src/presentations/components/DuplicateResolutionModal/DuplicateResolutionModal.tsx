import React from 'react';
import { X, Check, Copy } from 'lucide-react';
import type { Song } from '@music/types';
import { useDuplicateResolution } from './useDuplicateResolution';
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
  const { state, actions, utils } = useDuplicateResolution(duplicates, onResolve, onClose);
  const { t } = utils;

  if (!isOpen || duplicates.length === 0) return null;

  return (
    <div className="duplicate-modal-overlay">
      <div className="duplicate-modal">
        <div className="modal-header">
          <h2>{t('modal.duplicatesFound') || 'Phát hiện trùng lặp'}</h2>
          <button className="close-btn" onClick={actions.onClose} title={t('common.close')}>
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
                className={`duplicate-item ${state.selectedIds.has(song.id) ? 'selected' : ''}`}
                onClick={() => actions.toggleSelect(song.id)}
              >
                <div className="item-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-path">{song.filePath}</span>
                </div>
                {state.selectedIds.has(song.id) ? (
                  <Check size={18} className="text-primary" />
                ) : (
                  <Copy size={18} className="text-dim" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={actions.onClose}>
            {t('common.cancel')}
          </button>
          <button className="secondary-btn" onClick={actions.selectAll}>
            {state.isAllSelected ? t('common.deselectAll') || 'Bỏ chọn hết' : t('common.selectAll')}
          </button>
          <button 
            className="primary-btn" 
            onClick={actions.handleApply}
            disabled={state.selectedIds.size === 0}
          >
            {t('common.addSelected') || `Thêm ${state.selectedIds.size} bài đã chọn`}
          </button>
        </div>
      </div>
    </div>
  );
};
