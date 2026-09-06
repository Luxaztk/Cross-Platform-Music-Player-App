import { useEffect } from 'react';
import { usePlayer } from '@music/hooks';
import type { MobileAudioAdapter } from '../audio/MobileAudioAdapter';

export interface UseMobileLockScreenProps {
  adapter: MobileAudioAdapter;
}

export const useMobileLockScreen = ({ adapter }: UseMobileLockScreenProps): void => {
  const { currentSong } = usePlayer();

  useEffect(() => {
    if (currentSong) {
      adapter.updateLockScreen(true, currentSong);
    } else {
      adapter.updateLockScreen(false);
    }
  }, [currentSong, adapter]);
};
