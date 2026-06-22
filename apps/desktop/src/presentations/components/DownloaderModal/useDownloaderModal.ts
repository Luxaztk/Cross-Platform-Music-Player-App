import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage, useDownload } from '@hooks';
import { DOWNLOAD_STATUS, type DownloadItem } from '@music/types';
import { applyDownloaderMockup, IS_DEBUG_DOWNLOADER } from '../../debug/downloaderMockups';


export const useDownloaderModal = (isOpen: boolean, onClose: () => void) => {
  const { t } = useLanguage();
  let manager = useDownload();

  // ==========================================
  // 🛠 DEBUG UI MODE
  // ==========================================
  if (IS_DEBUG_DOWNLOADER) {
    manager = applyDownloaderMockup(manager);
  }


  const [isPasted, setIsPasted] = useState(false);
  const [editingItem, setEditingItem] = useState<DownloadItem | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      if (manager.downloadState === DOWNLOAD_STATUS.SUCCESS || manager.downloadState === DOWNLOAD_STATUS.ERROR) {
        if (manager.initiator === 'modal') manager.resetDownload();
      }
    }
    prevIsOpen.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, manager.downloadState, manager.initiator, manager.resetDownload]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => urlInputRef.current?.focus());
    }
  }, [isOpen]);

  const isBusy = manager.downloadState === DOWNLOAD_STATUS.FETCHING || manager.downloadState === DOWNLOAD_STATUS.DOWNLOADING;

  const handleClose = useCallback(() => {
    if (isBusy) return;
    if (manager.initiator !== 'section') {
      manager.clearAbandoned();
    }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBusy, manager.initiator, manager.clearAbandoned, onClose]);

  const handlePaste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(text)) {
        manager.setUrl(text);
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };

  return {
    state: {
      isPasted,
      editingItem,
      showBulkEdit,
      isBusy,
      downloadState: manager.downloadState,
      url: manager.url,
      previewItems: manager.previewItems,
      downloads: manager.downloads,
      playlistTitle: manager.playlistTitle,
      authRequired: manager.authRequired,
      duplicateInfo: manager.duplicateInfo,
      downloadError: manager.downloadError,
    },
    refs: {
      urlInputRef,
    },
    actions: {
      setUrl: manager.setUrl,
      fetchInfo: (mode?: 'video' | 'playlist') => mode ? manager.fetchInfo(manager.url, 'modal', mode) : manager.fetchInfo(manager.url, 'modal'),
      handlePaste,
      handleClose,
      setEditingItem,
      setShowBulkEdit,
      updateMetadata: manager.updateMetadata,
      bulkUpdateMetadata: manager.bulkUpdateMetadata,
      executeDownload: () => manager.executeDownload(!!manager.duplicateInfo.warning),
      resetDownload: manager.resetDownload,
      handleLogin: manager.handleLogin,
    },
    utils: {
      t,
    }
  };
};
