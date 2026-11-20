import { X } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useModalBackdropClose } from '@hooks/useModalBackdropClose';
import { useEditModal } from './useEditModal';
import { CreatableMetadataInput } from './CreatableMetadataInput';
import type { Song, Playlist } from '@music/types';
import type { EditModalProps } from './types';
import './EditModal.scss';

export const EditModal = <TData extends Song | Playlist,>({
  type,
  data,
  isOpen,
  onClose,
  onSave,
  isBulk = false,
}: EditModalProps<TData>) => {
  const { state, actions, utils } = useEditModal(type, data, isOpen, onClose, onSave, isBulk);
  const { t } = utils;
  const backdropProps = useModalBackdropClose(actions.onClose);

  if (!isOpen || !data) return null;

  return (
    <div className="modal-overlay" {...backdropProps}>
      <div className={`edit-modal ${isBulk ? 'bulk' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{state.modalTitle}</h2>
          <button type="button" className="close-btn" onClick={actions.onClose} title={t('common.close')}>
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
                  <CreatableMetadataInput
                    id="edit-song-artists"
                    label={t('modal.songArtist')}
                    placeholder={t('modal.songArtist')}
                    options={state.artistOptions}
                    values={state.artists}
                    multiple
                    createLabel={t('modal.createValue')}
                    noResultsLabel={t('modal.noMetadataResults')}
                    removeValueLabel={t('modal.removeValue')}
                    parseValue={actions.parseArtistInput}
                    onChange={actions.setArtists}
                  />
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
              <CreatableMetadataInput
                id="edit-song-album"
                label={t('modal.songAlbum')}
                placeholder={t('modal.songAlbum')}
                options={state.albumOptions}
                values={state.album ? [state.album] : []}
                createLabel={t('modal.createValue')}
                noResultsLabel={t('modal.noMetadataResults')}
                removeValueLabel={t('modal.removeValue')}
                onChange={(values) => actions.setAlbum(values[0] ?? '')}
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          {!isBulk && <p className="disclaimer">{t('modal.disclaimer')}</p>}
          <button
            type="button"
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


