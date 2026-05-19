import React from 'react';
import { X } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useEditModal } from './useEditModal';
import type { Song, Playlist } from '@music/types';
import './EditModal.scss';

interface EditModalProps {
  type: 'playlist' | 'song';
  data: Song | Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: any) => void;
  isBulk?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
  type,
  data,
  isOpen,
  onClose,
  onSave,
  isBulk = false,
}) => {
  const { state, actions, utils } = useEditModal(type, data, isOpen, onClose, onSave, isBulk);
  const { t } = utils;

  if (!isOpen || !data) return null;

  return (
    <div className="modal-overlay" onClick={actions.onClose}>
      <div className={`edit-modal ${isBulk ? 'bulk' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{state.modalTitle}</h2>
          <button className="close-btn" onClick={actions.onClose} title={t('common.close')}>
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-top-row">
            {!isBulk && (
              <div className="image-edit-section">
                <div className="playlist-image-large" onClick={actions.handleChooseImage}>
                  {state.currentImage ? (
                    <div className="image-container">
                      <img src={state.currentImage} alt="" className="image-blur-bg" />
                      <img src={state.currentImage} alt="Cover" className="image-main" />
                    </div>
                  ) : (
                    <img src={state.appIcon} alt="Default Cover" className="placeholder-brand-icon" />
                  )}
                  <div className="image-overlay">
                    <span>{t('modal.choosePhoto')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="info-edit-section">
              {type === 'playlist' ? (
                <div className="input-group">
                  <label className="input-label">{t('modal.addName')}</label>
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) => actions.setName(e.target.value)}
                    placeholder={t('modal.addName')}
                    className="modal-input name-input"
                  />
                </div>
              ) : (
                <>
                  {!isBulk && (
                    <div className="input-group">
                      <label className="input-label">{t('modal.songTitle')}</label>
                      <input
                        type="text"
                        value={state.title}
                        onChange={(e) => actions.setTitle(e.target.value)}
                        placeholder={t('modal.songTitle')}
                        className="modal-input"
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <label className="input-label">{t('modal.songArtist')}</label>
                    <input
                      type="text"
                      value={state.artist}
                      onChange={(e) => actions.setArtist(e.target.value)}
                      placeholder={t('modal.songArtist')}
                      className="modal-input"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-bottom-row">
            {type === 'playlist' ? (
              <div className="input-group">
                <label className="input-label">{t('modal.addDescription')}</label>
                <textarea
                  value={state.description}
                  onChange={(e) => actions.setDescription(e.target.value)}
                  placeholder={t('modal.addDescription')}
                  className="modal-input desc-input"
                />
              </div>
            ) : (
              <div className="input-group">
                <label className="input-label">{t('modal.songAlbum')}</label>
                <input
                  type="text"
                  value={state.album}
                  onChange={(e) => actions.setAlbum(e.target.value)}
                  placeholder={t('modal.songAlbum')}
                  className="modal-input"
                />
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {!isBulk && <p className="disclaimer">{t('modal.disclaimer')}</p>}
          <button
            className="save-btn"
            onClick={actions.handleSave}
            disabled={type === 'playlist' ? !state.name.trim() : (!isBulk && !state.title.trim())}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};


