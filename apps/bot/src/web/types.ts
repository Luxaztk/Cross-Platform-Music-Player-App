import type { RepeatMode } from '@music/hooks';

export interface ActivityTrack {
  id?: string;
  title: string;
  artist: string;
  coverArt?: string;
  thumbnail?: string;
  duration?: number;
}

export const getRepeatMode = (mode: string): RepeatMode => {
  const upper = (mode || '').toUpperCase();
  if (upper === 'ALL') return 'ALL';
  if (upper === 'ONE') return 'ONE';
  return 'OFF';
};
