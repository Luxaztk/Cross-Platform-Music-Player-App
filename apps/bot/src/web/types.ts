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
  if (upper === 'ALL' || upper === 'QUEUE') return 'ALL';
  if (upper === 'ONE' || upper === 'TRACK') return 'ONE';
  return 'OFF';
};
