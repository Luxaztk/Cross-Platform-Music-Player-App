import type { Song, SongChapter } from '@music/types';

export interface ChapterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  currentAudioTime?: number;
  onSeek?: (seconds: number) => void;
  onSave?: (chapters: SongChapter[]) => void;
}

export interface UseChapterEditorReturn {
  chapters: SongChapter[];
  isDirty: boolean;
  isSaving: boolean;
  isExporting: boolean;
  statusMessage: string | null;
  statusType: 'success' | 'error' | 'info' | null;
  handleAddChapter: (atTime?: number) => void;
  handleRemoveChapter: (id: string) => void;
  handleUpdateTitle: (id: string, title: string) => void;
  handleUpdateArtist: (id: string, artist: string) => void;
  handleSwapArtistTitle: (id: string) => void;
  handleToggleSkip: (id: string) => void;
  handleAdjustTime: (id: string, deltaSeconds: number) => void;
  handleMarkCurrentTime: (id: string) => void;
  handlePreview: (startTime: number) => void;
  handleSave: () => Promise<void>;
  handleExportPhysicalSlices: () => Promise<void>;
  formatTime: (seconds: number) => string;
}
