import React from 'react';
import { PlayerProvider as SharedPlayerProvider, useLibraryContext } from '@music/hooks';
import { MobileStorageAdapter } from '../storage/MobileStorageAdapter';
import { MobileAudioAdapter } from '../audio/MobileAudioAdapter';
import { Alert } from 'react-native';
import { useLanguage } from '../../presentations/components/Language';
import { usePrecacheNextTrack } from '../hooks/usePrecacheNextTrack';

const storageAdapter = new MobileStorageAdapter();
const audioAdapter = new MobileAudioAdapter();

const PrecacheSupervisor = () => {
  usePrecacheNextTrack();
  return null;
};

export const PlayerWithLibrary = ({ children }: { children: React.ReactNode }) => {
  const { songs, handleDeleteSong } = useLibraryContext();
  const { t } = useLanguage();

  return (
    <SharedPlayerProvider
      storage={storageAdapter}
      engine={audioAdapter}
      allSongs={songs}
      onFileError={(song) => {
        Alert.alert(t.library.fileNotFound, t.library.fileNotFoundMessage, [
          { text: t.playlists.cancel, style: 'cancel' },
          {
            text: t.library.removeFromLibrary,
            style: 'destructive',
            onPress: () => {
              if (handleDeleteSong) {
                void handleDeleteSong(song.id);
              }
            },
          },
        ]);
      }}
      onSavePlaybackPosition={(songId, position) => {
        // Direct DB update to prevent UI re-renders (fixes stutter)
        void storageAdapter.patchSong(songId, { lastPlaybackPosition: position });
      }}
    >
      <PrecacheSupervisor />
      {children}
    </SharedPlayerProvider>
  );
};
