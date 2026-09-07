import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Globe, Users, Lock, Music, AlertCircle, RefreshCw } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import { ServerClient } from '@music/core';
import type { Song, SongVisibility, ServerUserSummary } from '@music/types';
import { WhitelistBadgeInput } from '../../pages/SettingsPage/components/WhitelistBadgeInput';
import './EditSongPermissionsModal.scss';

export interface EditSongPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  serverUrl: string;
  auth?: { username?: string; token?: string };
  availableUsers?: ServerUserSummary[];
  onPermissionUpdated?: (updatedSong: Song) => void;
}

interface ModalContentProps extends EditSongPermissionsModalProps {
  song: Song;
}

const EditSongPermissionsModalContent: React.FC<ModalContentProps> = ({
  isOpen,
  onClose,
  song,
  serverUrl,
  auth,
  availableUsers = [],
  onPermissionUpdated,
}) => {
  const { t } = useLanguage();

  const [visibility, setVisibility] = useState<SongVisibility>(song.visibility || 'public');
  const [whitelist, setWhitelist] = useState<string[]>(
    Array.isArray(song.whitelist) ? [...song.whitelist] : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  const handleSave = async () => {
    if (!serverUrl || !song.id) return;

    setIsSaving(true);
    setErrorMessage(null);

    const cleanWhitelist = visibility === 'whitelist' ? whitelist.filter(Boolean) : [];

    try {
      const res = await ServerClient.updateSongPermissions(
        serverUrl,
        song.id,
        {
          visibility,
          whitelist: cleanWhitelist,
        },
        auth
      );

      if (res.ok) {
        const updatedSong: Song = {
          ...song,
          visibility,
          whitelist: cleanWhitelist,
        };
        onPermissionUpdated?.(updatedSong);
        onClose();
      } else {
        setErrorMessage(
          res.error || t('settings.server.savePermissionsFailed', { error: 'Unknown error' })
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(t('settings.server.savePermissionsFailed', { error: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const visibilityOptions: Array<{
    id: SongVisibility;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'public',
      label: t('settings.server.visibilityPublic'),
      desc: t('settings.server.visibilityPublicDesc'),
      icon: <Globe size={18} className="option-icon public" />,
    },
    {
      id: 'whitelist',
      label: t('settings.server.visibilityWhitelist'),
      desc: t('settings.server.visibilityWhitelistDesc'),
      icon: <Users size={18} className="option-icon whitelist" />,
    },
    {
      id: 'private',
      label: t('settings.server.visibilityPrivate'),
      desc: t('settings.server.visibilityPrivateDesc'),
      icon: <Lock size={18} className="option-icon private" />,
    },
  ];

  return ReactDOM.createPortal(
    <div className="edit-song-permissions-overlay" onClick={() => !isSaving && onClose()}>
      <div
        className="edit-song-permissions-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-modal-title"
      >
        {/* Header */}
        <div className="permissions-modal-header">
          <div>
            <h3 id="permissions-modal-title">
              {t('settings.server.editPermissionsTitle', { defaultValue: 'Quyền Chia Sẻ Bài Hát' })}
            </h3>
            <p className="modal-desc">
              {t('settings.server.editPermissionsDesc', {
                defaultValue:
                  'Chỉnh sửa quyền truy cập và danh sách bạn bè được phép nghe bài hát này trên máy chủ.',
              })}
            </p>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
          >
            <X size={ICON_SIZES.MEDIUM} />
          </button>
        </div>

        {/* Song Info Preview */}
        <div className="permissions-song-preview">
          <div className="song-thumb">
            {song.coverArt ? (
              <img src={song.coverArt} alt={song.title} />
            ) : (
              <div className="thumb-placeholder">
                <Music size={20} />
              </div>
            )}
          </div>
          <div className="song-meta">
            <div className="song-title" title={song.title}>
              {song.title}
            </div>
            <div className="song-artist" title={song.artist}>
              {song.artist}
            </div>
            {song.uploader && (
              <span className="song-uploader-tag">
                {t('settings.server.uploadedBy', { uploader: song.uploader })}
              </span>
            )}
          </div>
        </div>

        {/* Visibility Options */}
        <div className="visibility-options-group">
          {visibilityOptions.map((opt) => {
            const isSelected = visibility === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                className={`visibility-card-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setVisibility(opt.id)}
                disabled={isSaving}
              >
                <div className="card-radio-indicator">
                  <div className="radio-dot" />
                </div>
                <div className="card-icon-wrap">{opt.icon}</div>
                <div className="card-text-wrap">
                  <span className="card-title">{opt.label}</span>
                  <span className="card-desc">{opt.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Whitelist Input Area if Whitelist Mode */}
        {visibility === 'whitelist' && (
          <div className="whitelist-editor-section">
            <label className="whitelist-label">
              <Users size={14} />
              <span>{t('settings.server.visibilityWhitelist')}</span>
            </label>
            <WhitelistBadgeInput
              value={whitelist}
              onChange={setWhitelist}
              availableUsers={availableUsers}
              currentUsername={auth?.username}
              placeholder={t('settings.server.whitelistBadgePlaceholder')}
            />
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="permissions-error-alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="permissions-modal-footer">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>{t('settings.server.savingPermissions')}</span>
              </>
            ) : (
              <span>{t('settings.server.savePermissions')}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const EditSongPermissionsModal: React.FC<EditSongPermissionsModalProps> = (props) => {
  if (!props.isOpen || !props.song) return null;
  return (
    <EditSongPermissionsModalContent
      key={props.song.id}
      {...props}
      song={props.song}
    />
  );
};
