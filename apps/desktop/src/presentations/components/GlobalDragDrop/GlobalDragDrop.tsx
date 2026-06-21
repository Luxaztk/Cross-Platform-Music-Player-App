import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '@hooks';
import './GlobalDragDrop.scss';

export const GlobalDragDrop: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const location = useLocation();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const { handleRunAutoImportScan, handleAddSongsToPlaylist, handleGetPlaylistDetail } = useLibraryContext();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine target context
  // If we are on /playlist/:id, target is that playlist. Otherwise, target is Library (0).
  const isPlaylistRoute = location.pathname.startsWith('/playlist/');
  const currentPlaylistId = isPlaylistRoute ? location.pathname.split('/')[2] : '0';
  const isLibrary = currentPlaylistId === '0';

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (!e.dataTransfer || !e.dataTransfer.files.length || isProcessing) return;

    setIsProcessing(true);
    const filePaths: string[] = [];
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      const filePath = window.electronAPI.getPathForFile(file);
      if (filePath) {
        filePaths.push(filePath);
      }
    }

    if (filePaths.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const res = await handleRunAutoImportScan(filePaths);
      
      let addedToPlaylistCount = 0;
      if (res.added > 0 || res.migrated > 0) {
        // If not library, add to the specific playlist
        if (!isLibrary && currentPlaylistId && res.details.length > 0) {
          const success = await handleAddSongsToPlaylist(currentPlaylistId, res.details);
          if (success) {
            addedToPlaylistCount = res.details.length;
            // trigger refresh playlist logic via context if needed
            await handleGetPlaylistDetail(currentPlaylistId);
            // Notice: the PlaylistDetailPage will refresh automatically via useLibraryContext dependencies
            // or we might need to rely on the page's own polling/re-fetch. 
            // In our system, `handleGetPlaylistDetail` usually triggers an update.
          }
        }

        const count = res.added + res.migrated;
        const key = filePaths.length === 1 ? 'playlist.importSuccess_singleFile' : 'playlist.importSuccess_multiFile';

        showNotification('success', t(key, { count }));
        if (!isLibrary && addedToPlaylistCount > 0) {
           showNotification('success', t('playlist.addSongsSuccess', { count: addedToPlaylistCount, name: 'Playlist' }));
        }
      }
    } catch (err) {
      console.error('[GlobalDragDrop] Error importing files:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, handleRunAutoImportScan, handleAddSongsToPlaylist, isLibrary, currentPlaylistId, showNotification, t, handleGetPlaylistDetail]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!isDragging) return null;

  return ReactDOM.createPortal(
    <div className="global-drag-drop-overlay">
      <div className="drag-content">
        <div className="drag-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <h2>{t('playlist.emptyStateTitle')}</h2>
        <p>{isLibrary ? 'Kéo thả thư mục nhạc của bạn vào đây để bắt đầu' : 'Thả vào đây để thêm vào Playlist hiện tại'}</p>
      </div>
    </div>,
    document.body
  );
};
