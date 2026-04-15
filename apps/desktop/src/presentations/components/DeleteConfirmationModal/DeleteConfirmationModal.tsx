import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { useLanguage } from '@hooks';
import './DeleteConfirmationModal.scss';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  messageSuffix?: string;
  itemName?: string;
  showUndoneWarning?: boolean;
  confirmText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  messageSuffix,
  itemName,
  showUndoneWarning = true,
  confirmText,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-left">
            <div className="icon-wrapper">
              <AlertTriangle className="warning-icon" size={ICON_SIZES.SMALL} />
            </div>
            <h2>{title}</h2>
          </div>
          <button className="close-btn" onClick={onClose} title={t('common.close')}>
            <X size={ICON_SIZES.SMALL} />
          </button>
        </div>

        <div className="modal-body">
          <div className="message-container">
            <p className="delete-message">
              {message}
              {itemName && <span className="item-name"> "{itemName}"</span>}
              {messageSuffix && <span> {messageSuffix}</span>}
              ?
            </p>
            {showUndoneWarning && (
              <p className="warning-text">{t('modal.undoneWarning')}</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="delete-confirm-btn" onClick={onConfirm}>
            {confirmText || t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
