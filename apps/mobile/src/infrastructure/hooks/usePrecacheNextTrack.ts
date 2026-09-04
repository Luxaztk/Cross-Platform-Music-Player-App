import { useEffect, useRef } from 'react';
import { usePlayer } from '@music/hooks';
import { MobileAudioCacheService } from '../services/MobileAudioCacheService';

/**
 * Predictive Pre-caching Hook:
 * When the current playing track reaches 50% duration,
 * background caches the next track in the playback queue if it's a remote stream.
 */
export function usePrecacheNextTrack(): void {
  const { currentSong, progress, duration, queue } = usePlayer();
  const precachedSongIdRef = useRef<string | null>(null);

  // Reset precached tracking when current track changes
  useEffect(() => {
    precachedSongIdRef.current = null;
  }, [currentSong?.id]);

  useEffect(() => {
    if (!currentSong || duration <= 0 || progress <= 0) return;

    const ratio = progress / duration;
    if (ratio >= 0.5 && queue.length > 0) {
      const nextSong = queue[0]?.song;
      if (!nextSong || !nextSong.id) return;

      // Avoid duplicate pre-cache triggers for the same next song
      if (precachedSongIdRef.current === nextSong.id) return;

      // Pinned offline songs are already local
      if (nextSong.isOffline) return;

      const streamUrl = nextSong.streamUrl || nextSong.filePath;
      if (streamUrl && /^https?:\/\//i.test(streamUrl)) {
        precachedSongIdRef.current = nextSong.id;
        void MobileAudioCacheService.cacheSongStream(nextSong.id, streamUrl).catch((err) => {
          console.warn('[pre-cache] Failed to pre-cache next track:', err);
        });
      }
    }
  }, [currentSong, progress, duration, queue]);
}
