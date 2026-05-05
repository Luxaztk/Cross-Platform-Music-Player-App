import React from 'react';
import { X, Check, Trash2, AlertTriangle, FileX } from 'lucide-react';
import type { Song } from '@music/types';
import { useCleanupResolution } from './useCleanupResolution';
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
  const { state, actions, utils } = useCleanupResolution(missingSongs, onConfirm, onClose);
  const { t } = utils;

  if (!isOpen || missingSongs.length === 0) return null;

  return (
    <div className="cleanup-modal-overlay">
      <div className="cleanup-modal">
        <div className="modal-header">
          <div className="title-with-icon">
            <AlertTriangle size={24} className="warning-icon" />
            <h2>{t('libraryCleanup.title') || 'Dọn dẹp thư viện'}</h2>
          </div>
          <button className="close-btn" onClick={actions.onClose} title={t('common.close')}>
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
                className={`cleanup-item ${state.selectedIds.has(song.id) ? 'selected' : ''}`}
                onClick={() => actions.toggleSelect(song.id)}
              >
                <div className="item-icon">
                    <FileX size={20} />
                </div>
                <div className="item-info">
                  <span className="song-title">{song.title}</span>
                  <span className="song-path" title={song.filePath}>{song.filePath}</span>
                </div>
                <div className="checkbox-wrapper">
                    {state.selectedIds.has(song.id) ? (
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
              <button className="text-btn" onClick={actions.selectAll}>
                {state.isAllSelected ? t('common.deselectAll') : t('common.selectAll')}
              </button>
          </div>
          <div className="footer-right">
              <button className="secondary-btn" onClick={actions.onClose}>
                {t('common.cancel')}
              </button>
              <button 
                className="primary-btn danger-btn" 
                onClick={actions.handleApply}
                disabled={state.selectedIds.size === 0}
              >
                <Trash2 size={16} />
                <span>{t('libraryCleanup.removeSelected').replace('{count}', state.selectedIds.size.toString())}</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};
