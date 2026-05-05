import React from 'react';
import { X, Download } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { EditModal } from '@components';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';

import { useDownloaderModal } from './useDownloaderModal';
import {
  InputState,
  LoadingState,
  PreviewList,
  AuthState,
  DownloaderFooter
} from './components';

import './DownloaderModal.scss';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloaderModal: React.FC<DownloaderModalProps> = ({ isOpen, onClose }) => {
  const { state, refs, actions, utils } = useDownloaderModal(isOpen, onClose);
  const { t } = utils;

  if (!isOpen) return null;

  const renderContent = () => {
    if (state.authRequired) {
      return <AuthState t={t} />;
    }

    switch (state.downloadState) {
      case DOWNLOAD_STATUS.IDLE:
        return (
          <InputState
            url={state.url}
            isPasted={state.isPasted}
            onUrlChange={actions.setUrl}
            onPaste={actions.handlePaste}
            onFetch={actions.fetchInfo}
            inputRef={refs.urlInputRef}
            t={t}
          />
        );

      case DOWNLOAD_STATUS.FETCHING:
        return <LoadingState t={t} />;

      case DOWNLOAD_STATUS.PREVIEW:
        return (
          <PreviewList
            items={state.previewItems}
            downloadState={state.downloadState}
            duplicateInfo={state.duplicateInfo}
            onItemClick={actions.setEditingItem}
            t={t}
          />
        );

      case DOWNLOAD_STATUS.DOWNLOADING:
      case DOWNLOAD_STATUS.SUCCESS:
      case DOWNLOAD_STATUS.ERROR:
        const items = state.downloads.size > 0 
          ? Array.from(state.downloads.values())
          : state.previewItems;
        
        return (
          <PreviewList
            items={items}
            downloadState={state.downloadState}
            downloadError={state.downloadError}
            t={t}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={actions.handleClose}>
        <div className="downloader-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="header-title">
              <Download size={ICON_SIZES.MEDIUM} />
              <h2>{state.playlistTitle || t('downloader.title')}</h2>
            </div>
            {!state.isBusy && (
              <button type="button" className="close-btn" onClick={actions.handleClose} title={t('common.close')}>
                <X size={ICON_SIZES.MEDIUM} />
              </button>
            )}
          </div>

          <div className="modal-body">
            {renderContent()}
          </div>

          <DownloaderFooter
            downloadState={state.downloadState}
            authRequired={state.authRequired}
            itemCount={state.previewItems.length}
            hasWarning={!!state.duplicateInfo?.warning}
            onCancel={actions.resetDownload}
            onLogin={actions.handleLogin}
            onEditAll={() => actions.setShowBulkEdit(true)}
            onEditSingle={() => actions.setEditingItem(state.previewItems[0])}
            onExecute={actions.executeDownload}
            onClose={actions.handleClose}
            t={t}
          />
        </div>
      </div>

      {state.editingItem && (
        <EditModal
          isOpen={true}
          type="song"
          data={{
            title: state.editingItem.title,
            artist: state.editingItem.artist,
            album: state.editingItem.album,
            coverArt: state.editingItem.thumbnail,
          } as any}
          onClose={() => actions.setEditingItem(null)}
          onSave={(data: any) => {
            actions.updateMetadata(state.editingItem!.id, data);
            actions.setEditingItem(null);
          }}
        />
      )}

      {state.showBulkEdit && (
        <EditModal
          isOpen={true}
          isBulk={true}
          type="song"
          data={{
            title: t('downloader.bulkEditTitle'),
            artist: state.previewItems[0]?.artist || '',
            album: state.playlistTitle || state.previewItems[0]?.album || '',
            coverArt: '',
          } as any}
          onClose={() => actions.setShowBulkEdit(false)}
          onSave={(data: any) => {
            const bulkData: Partial<DownloadItem> = {};
            if (data.artist) bulkData.artist = data.artist;
            if (data.album) bulkData.album = data.album;
            actions.bulkUpdateMetadata(bulkData);
            actions.setShowBulkEdit(false);
          }}
        />
      )}
    </>
  );
};
