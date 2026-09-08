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
        const isStream =
          song.sourceType === 'stream' ||
          song.filePath?.startsWith('http://') ||
          song.filePath?.startsWith('https://');

        if (isStream) {
          showNotification(
            'error',
            t('player.streamUnavailable', {
              title: song.title,
              defaultValue: `Không thể phát bài hát trực tuyến "${song.title}". Bài hát có thể đã bị xóa trên máy chủ.`,
            })
          );
        } else {
          showNotification(
            'error',
            t('player.fileNotFound', {
              title: song.title,
              defaultValue: `Tệp bài hát "${song.title}" không tồn tại trên ổ đĩa.`,
            })
          );
        }
      }}
      onSavePlaybackPosition={(songId, position) => {
        // Direct DB update to prevent UI re-renders (fixes 1-second stutter)
        void storage.patchSong(songId, { lastPlaybackPosition: position });
      }}
    >
      {children}
    </PlayerProvider>
  );
};
