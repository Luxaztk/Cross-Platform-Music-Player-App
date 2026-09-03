import { useEffect, useRef } from 'react';
import type { Song } from '@music/types';

export interface UseMediaSessionProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
}

export const useMediaSession = ({
  currentSong,
  isPlaying,
  progress,
  duration,
  play,
  pause,
  next,
  prev,
  seek,
}: UseMediaSessionProps): void => {
  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  const nextRef = useRef(next);
  const prevRef = useRef(prev);
  const seekRef = useRef(seek);
  const progressRef = useRef(progress);
  const durationRef = useRef(duration);

  // Keep references to latest callbacks and values
  useEffect(() => {
    playRef.current = play;
    pauseRef.current = pause;
    nextRef.current = next;
    prevRef.current = prev;
    seekRef.current = seek;
    progressRef.current = progress;
    durationRef.current = duration;
  });

  // Action handlers registration
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) {
      return;
    }

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => playRef.current()],
      ['pause', () => pauseRef.current()],
      ['previoustrack', () => prevRef.current()],
      ['nexttrack', () => nextRef.current()],
      ['stop', () => pauseRef.current()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined && !Number.isNaN(details.seekTime)) {
            seekRef.current(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const skipTime = details.seekOffset || 10;
          seekRef.current(Math.max(progressRef.current - skipTime, 0));
        },
      ],
      [
        'seekforward',
        (details) => {
          const skipTime = details.seekOffset || 10;
          seekRef.current(Math.min(progressRef.current + skipTime, durationRef.current));
        },
      ],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers or older versions might not support specific actions
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      });
    };
  }, []);

  // Metadata synchronization
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) {
      return;
    }

    if (!currentSong) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artistName =
      currentSong.artist ||
      (currentSong.artists && currentSong.artists.length > 0 ? currentSong.artists.join(', ') : '');

    const artwork: MediaImage[] = [];
    if (currentSong.coverArt) {
      artwork.push(
        { src: currentSong.coverArt, sizes: '96x96' },
        { src: currentSong.coverArt, sizes: '128x128' },
        { src: currentSong.coverArt, sizes: '192x192' },
        { src: currentSong.coverArt, sizes: '256x256' },
        { src: currentSong.coverArt, sizes: '384x384' },
        { src: currentSong.coverArt, sizes: '512x512' },
      );
    }

    try {
      if (typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title || 'Unknown Title',
          artist: artistName || 'Unknown Artist',
          album: currentSong.album || '',
          artwork,
        });
      }
    } catch (err) {
      console.warn('Failed to set MediaMetadata:', err);
    }
  }, [currentSong]);

  // Playback state synchronization
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) {
      return;
    }

    try {
      navigator.mediaSession.playbackState = isPlaying
        ? 'playing'
        : currentSong
        ? 'paused'
        : 'none';
    } catch {
      // Ignore
    }
  }, [isPlaying, currentSong]);

  // Position state synchronization (throttled to prevent OS IPC flooding)
  const lastSetPositionTimeRef = useRef(0);
  const lastReportedPosRef = useRef(0);

  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaSession ||
      typeof navigator.mediaSession.setPositionState !== 'function'
    ) {
      return;
    }

    if (duration > 0 && isFinite(duration) && isFinite(progress)) {
      const now = Date.now();
      const posDiff = Math.abs(progress - lastReportedPosRef.current);

      if (now - lastSetPositionTimeRef.current >= 1000 || posDiff > 1) {
        lastSetPositionTimeRef.current = now;
        lastReportedPosRef.current = progress;
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(duration, 0),
            playbackRate: isPlaying ? 1 : 0,
            position: Math.min(Math.max(progress, 0), duration),
          });
        } catch {
          // Ignore invalid position edge cases
        }
      }
    }
  }, [progress, duration, isPlaying]);
};
