import React from 'react';
import { Edit2, Download, Folder } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { DOWNLOAD_STATUS } from '@music/types';

interface DownloaderFooterProps {
  downloadState: string;
  authRequired: boolean;
  itemCount: number;
  hasWarning: boolean;
  onCancel: () => void;
  onLogin: () => void;
  onEditAll: () => void;
  onEditSingle: () => void;
  onExecute: () => void;
  onClose: () => void;
  t: (key: string, options?: Record<string, unknown> | string) => string;
}

export const DownloaderFooter: React.FC<DownloaderFooterProps> = ({
  downloadState,
  authRequired,
  itemCount,
  hasWarning,
  onCancel,
  onLogin,
  onEditAll,
  onEditSingle,
  onExecute,
  onClose,
  t
}) => {
  if (authRequired) {
    return (
      <div className="modal-footer">
        <div className="action-buttons horizontal">
          <button type="button" className="secondary-btn" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="button" className="primary-btn" onClick={onLogin}>
            {t('downloader.loginNow')}
          </button>
        </div>
      </div>
    );
  }

  switch (downloadState) {
    case DOWNLOAD_STATUS.PREVIEW:
      return (
        <div className="modal-footer">
          <div className="action-buttons">
            {itemCount === 1 ? (
              <button
                type="button"
                className="edit-btn"
                onClick={onEditSingle}
                title={t('common.edit')}
              >
                <Edit2 size={ICON_SIZES.TINY} />
              </button>
            ) : (
              <button
                type="button"
                className="edit-btn bulk"
                onClick={onEditAll}
                title={t('downloader.editAll', { count: itemCount })}
              >
                <Edit2 size={ICON_SIZES.TINY} />
                <span>{t('downloader.editAll', { count: itemCount })}</span>
              </button>
            )}

            <button
              type="button"
              className={`primary-btn ${hasWarning ? 'warning-btn' : ''}`}
              onClick={onExecute}
            >
              <Download size={ICON_SIZES.TINY} />
              <span>{itemCount > 1 ? t('downloader.downloadAll', { count: itemCount }) : t('downloader.downloadNow')}</span>
            </button>
          </div>
        </div>
      );
    case DOWNLOAD_STATUS.SUCCESS:
      return (
        <div className="modal-footer">
          <div className="action-buttons horizontal" style={{ justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={() => window.electronAPI.openDownloadsFolder()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Folder size={16} />
              <span>{t('common.openFolder', 'Mở thư mục')}</span>
            </button>
            <button type="button" className="primary-btn" onClick={onClose}>
              {t('common.done', 'Hoàn tất')}
            </button>
          </div>
        </div>
      );

    case DOWNLOAD_STATUS.ERROR:
      return (
        <div className="modal-footer">
          <div className="action-buttons horizontal">
            <button type="button" className="secondary-btn" onClick={onCancel}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
};
