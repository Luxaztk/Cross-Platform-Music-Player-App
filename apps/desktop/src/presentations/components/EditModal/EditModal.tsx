import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Song, Playlist } from '@music/types';
import { ICON_SIZES } from '@constants';
import { useLanguage, useTheme } from '@hooks';
import { splitArtists } from '@music/utils';
import './EditModal.scss';

interface EditModalProps {
  type: 'playlist' | 'song';
  data: Song | Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Song | Playlist) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  type,
  data,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const { appIcon } = useTheme();

  // Playlist states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  // Song states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [coverArt, setCoverArt] = useState('');

  useEffect(() => {
    if (!data) return;

    if (type === 'playlist') {
      const p = data as Playlist;
      setName(p.name || '');
      setDescription(p.description || '');
      setThumbnail(p.thumbnail || '');
    } else {
      const s = data as Song;
      setTitle(s.title || '');
      setArtist(s.artist || '');
      setAlbum(s.album || '');
      setCoverArt(s.coverArt || '');
    }
  }, [data, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleChooseImage = async () => {
    try {
      const path = await window.electronAPI.pickImage();
      if (path) {
        if (type === 'playlist') {
          setThumbnail(path);
        } else {
          setCoverArt(path);
        }
      }
    } catch (err) {
      console.error('Failed to pick image:', err as Error);
    }
  };

  const handleSave = () => {
    if (type === 'playlist') {
      if (!name.trim()) return;
      onSave({
        ...data,
        name: name.trim(),
        description: description.trim(),
        thumbnail,
      });
    } else {
      if (!title.trim()) return;
      onSave({
        ...data,
        title: title.trim(),
        artist: artist.trim(),
        artists: splitArtists(artist.trim()),
        album: album.trim(),
        coverArt,
      });
    }
    onClose();
  };

  const modalTitle = type === 'playlist' ? t('modal.editPlaylist') : t('modal.editSong');
  const currentImage = type === 'playlist' ? thumbnail : coverArt;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{modalTitle}</h2>
          <button className="close-btn" onClick={onClose} title={t('common.close')}>
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        <div className="modal-body">
          <div className="image-edit-section">
            <div className="playlist-image-large" onClick={handleChooseImage}>
              {currentImage ? (
                <img src={currentImage} alt="Cover" />
              ) : (
                <img src={appIcon} alt="Default Cover" className="placeholder-brand-icon" />
              )}
              <div className="image-overlay">
                <span>{t('modal.choosePhoto')}</span>
              </div>
            </div>
          </div>

          <div className="info-edit-section">
            {type === 'playlist' ? (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('modal.addName')}
                    className="modal-input name-input"
                  />
                </div>
                <div className="input-group">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('modal.addDescription')}
                    className="modal-input desc-input"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">{t('modal.songTitle')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('modal.songTitle')}
                    className="modal-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('modal.songArtist')}</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder={t('modal.songArtist')}
                    className="modal-input"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{t('modal.songAlbum')}</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    placeholder={t('modal.songAlbum')}
                    className="modal-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <p className="disclaimer">{t('modal.disclaimer')}</p>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={type === 'playlist' ? !name.trim() : !title.trim()}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
