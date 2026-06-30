import type { ReactNode } from 'react';
import type { Song } from '@music/types';
import type { IStorageAdapter, IAudioEngine } from '@music/core';

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface QueueItem {
  uid: string;
  song: Song;
}

export interface PlayerUiState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export interface PlayerContextProps extends PlayerUiState {
  volume: number;
  queue: QueueItem[];
  history: Song[];

  repeatMode: RepeatMode;
  isShuffle: boolean;

  playNow: (song: Song) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  addSongsToQueue: (songs: Song[]) => void;
  playList: (songs: Song[], startIndex: number) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;

  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  getAnalyser: () => AnalyserNode | null;
  updateCurrentSongMetadata: (partial: Partial<Song>) => void;
}

export interface PlayerProviderProps {
  children: ReactNode;
  storage?: IStorageAdapter;
  engine?: IAudioEngine;
  allSongs?: Song[];
  onFileError?: (song: Song) => void;
  onSavePlaybackPosition?: (songId: string, position: number) => void;
}
