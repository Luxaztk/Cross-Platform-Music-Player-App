import React, { type ReactNode, useEffect, useCallback } from 'react';
import { SharedLibraryProvider, useLibrary } from '@music/hooks';
import type { SyncOptions } from '@music/hooks/types';

import { ElectronLibraryRepository } from '@infrastructure/repositories';
import { CleanupResolutionModal } from '@components';
import { useNotification, useLanguage } from '@hooks';

const repo = new ElectronLibraryRepository();

const CleanupModalWrapper: React.FC = () => {
  const { showCleanupModal, missingSongs, setShowCleanupModal, handleDeleteSongs } = useLibrary();
  
  const handleConfirmCleanup = async (selectedIds: string[]) => {
    if (!selectedIds.length) return;
    const res = await handleDeleteSongs(selectedIds);
    if (res) {
      setShowCleanupModal(false);
    }
    return res;
  };

  return (
    <CleanupResolutionModal
      isOpen={showCleanupModal}
      missingSongs={missingSongs}
      onClose={() => setShowCleanupModal(false)}
      onConfirm={handleConfirmCleanup}
    />
  );
};

const StartupSyncTrigger: React.FC = () => {
  const { handleSyncLibrary } = useLibrary();

  useEffect(() => {
    // Startup Sync logic: Wait 60s to avoid heavy work on first load
    const timer = setTimeout(() => {
      console.log('[Library] Triggering delayed startup silent sync (60s)');
      handleSyncLibrary({ isSilent: true });
    }, 60000);

    return () => clearTimeout(timer);
  }, [handleSyncLibrary]);

  return null;
};

const ImportProgressObserver: React.FC = () => {
  const { showNotification, updateNotification } = useNotification();
  const { t } = useLanguage();

  useEffect(() => {
    let lastPercent = -1;
    const unsub = window.electronAPI.onImportProgress?.((percent: number) => {
      // Create toast if it doesn't exist
      if (lastPercent === -1) {
        showNotification('info', t('playlist.importFolder') + `... ${percent}%`, { 
          id: 'import-progress', 
          duration: 0 
        });
      } else {
        updateNotification('import-progress', { 
          message: t('playlist.importFolder') + `... ${percent}%` 
        });
      }
      
      lastPercent = percent;

      // Clean up when done
      if (percent >= 100) {
        setTimeout(() => {
          updateNotification('import-progress', {
            type: 'success',
            message: t('playlist.importComplete', 'Import hoàn tất!'),
            duration: 3000
          });
          lastPercent = -1;
        }, 500);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [showNotification, updateNotification, t]);

  return null;
};

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showNotification, updateNotification, removeNotification } = useNotification();
  const { t } = useLanguage();

  const handleSyncStart = useCallback((options: SyncOptions) => {
    if (options.isSilent) {
      showNotification('info', t('libraryCleanup.checking'), { 
        id: 'sync-toast', 
        duration: 0 
      });
    }
  }, [showNotification, t]);

  const handleSyncComplete = useCallback((
    result: { added: number; migrated: number; missingCount: number },
    actions: { setShowCleanupModal: (show: boolean) => void }
  ) => {
    const toastId = 'sync-toast';

    if (result.missingCount > 0) {
      showNotification('warning', t('libraryCleanup.foundMissing', { count: result.missingCount }), {
        id: toastId,
        duration: 0,
        onClick: () => {
          actions.setShowCleanupModal(true);
          removeNotification(toastId);
        }
      });
    } else if (result.migrated > 0) {
      updateNotification(toastId, {
        type: 'success',
        message: t('settings.downloads.autoImportComplete', { 
          added: result.added, 
          migrated: result.migrated 
        }),
        duration: 5000
      });
    } else if (result.added > 0) {
      updateNotification(toastId, {
        type: 'success',
        message: t('settings.downloads.autoImportComplete', { 
          added: result.added, 
          migrated: 0 
        }),
        duration: 5000
      });
    } else {
      updateNotification(toastId, {
        type: 'success',
        message: t('libraryCleanup.noMissing'),
        duration: 3000
      });
    }
  }, [showNotification, updateNotification, removeNotification, t]);

  const handleSyncError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    showNotification('error', `[Library] Sync failed: ${errorMessage || 'Unknown error'}`, { 
      id: 'sync-toast',
      duration: 5000 
    });
  }, [showNotification]);

  return (
    <SharedLibraryProvider 
      repository={repo} 
      onSyncStart={handleSyncStart}
      onSyncComplete={handleSyncComplete}
      onSyncError={handleSyncError}
    >
      {children}
      <CleanupModalWrapper />
      <StartupSyncTrigger />
      <ImportProgressObserver />
    </SharedLibraryProvider>
  );
};