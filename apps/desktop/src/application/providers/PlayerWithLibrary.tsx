import React from 'react';
import { PlayerProvider, useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '@hooks';
import { ElectronStorageAdapter } from '../../infrastructure/services/ElectronStorageAdapter';

const storage = new ElectronStorageAdapter();

export const PlayerWithLibrary = ({ children }: { children: React.ReactNode }) => {
  const { songs } = useLibraryContext();
  const { showNotification } = useNotification();
  const { t } = useLanguage();

  return (
    <PlayerProvider
      storage={storage}
      allSongs={songs}
      onFileError={(song) => {
        showNotification('error', t('player.fileNotFound').replace('{title}', song.title));
      }}
    >
      {children}
    </PlayerProvider>
  );
};
