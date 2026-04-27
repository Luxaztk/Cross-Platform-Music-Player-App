import React from 'react';
import { Stack } from 'expo-router';
import { PlayerProvider, SharedLibraryProvider, useLibraryContext } from '@music/hooks';
import { MobileStorageAdapter } from '../infrastructure/services/MobileStorageAdapter';
import { MobileLibraryRepository } from '../infrastructure/repositories/MobileLibraryRepository';

const storage = new MobileStorageAdapter();
const repo = new MobileLibraryRepository();

function PlayerWrapper({ children }: { children: React.ReactNode }) {
  const { songs } = useLibraryContext();
  return (
    <PlayerProvider storage={storage} allSongs={songs}>
      {children}
    </PlayerProvider>
  );
}

export default function RootLayout() {
  return (
    <SharedLibraryProvider repository={repo}>
      <PlayerWrapper>
        <Stack screenOptions={{ headerShown: false }} />
      </PlayerWrapper>
    </SharedLibraryProvider>
  );
}
