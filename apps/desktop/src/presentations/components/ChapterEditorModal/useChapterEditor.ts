import { useState, useCallback } from 'react';
import type { Song, SongChapter } from '@music/types';
import { formatTime } from '@music/utils';
import { usePlayer } from '@music/hooks';
import { useLanguage, useLibrary } from '@hooks';
import type { UseChapterEditorReturn } from './types';

function recalculateEndTimes(chapters: SongChapter[], totalDuration?: number): SongChapter[] {
  const sorted = [...chapters].sort((a, b) => a.startTime - b.startTime);
  return sorted.map((ch, idx) => {
    let endTime: number | undefined;
    if (idx < sorted.length - 1) {
      endTime = sorted[idx + 1].startTime;
    } else if (totalDuration && totalDuration > ch.startTime) {
      endTime = totalDuration;
    }
    return { ...ch, endTime };
  });
}

export const useChapterEditor = (
  song: Song | null,
  currentAudioTime: number = 0,
  onSeek?: (seconds: number) => void,
  isOpen: boolean = false,
  onSave?: (chapters: SongChapter[]) => void,
): UseChapterEditorReturn => {
  const { t } = useLanguage();
  const { handlePatchSong } = useLibrary();
  const { currentSong, updateCurrentSongMetadata } = usePlayer();

  const [prevSong, setPrevSong] = useState(song);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [chapters, setChapters] = useState<SongChapter[]>(() =>
    song?.chapters && song.chapters.length > 0
      ? recalculateEndTimes(song.chapters, song.duration)
      : []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);

  // Sync chapters when song prop changes or modal reopens (React recommended pattern)
  if (song !== prevSong || (isOpen && !prevIsOpen)) {
    setPrevSong(song);
    setPrevIsOpen(isOpen);
    const initial = song?.chapters && song.chapters.length > 0
      ? recalculateEndTimes(song.chapters, song.duration)
      : [];
    setChapters(initial);
    setIsDirty(false);
    setStatusMessage(null);
    setStatusType(null);
  } else if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  const handleAddChapter = useCallback((atTime?: number) => {
    let newStart: number;
    if (typeof atTime === 'number') {
      newStart = atTime;
    } else if (currentAudioTime > 0) {
      newStart = currentAudioTime;
    } else if (chapters.length > 0) {
      newStart = chapters[chapters.length - 1].startTime + 30;
    } else {
      newStart = 0;
    }

    const roundedStart = Math.max(0, Math.round(newStart * 10) / 10);
    const newChapter: SongChapter = {
      id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${t('chapters.chapterName') || 'Mục'} ${chapters.length + 1}`,
      startTime: roundedStart,
    };

    setChapters(prev => recalculateEndTimes([...prev, newChapter], song?.duration));
    setIsDirty(true);
  }, [chapters, currentAudioTime, song?.duration, t]);

  const handleRemoveChapter = useCallback((id: string) => {
    setChapters(prev => recalculateEndTimes(prev.filter(c => c.id !== id), song?.duration));
    setIsDirty(true);
  }, [song?.duration]);

  const handleUpdateTitle = useCallback((id: string, title: string) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    setIsDirty(true);
  }, []);

  const handleUpdateArtist = useCallback((id: string, artist: string) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, artist: artist || undefined } : c));
    setIsDirty(true);
  }, []);

  const handleSwapArtistTitle = useCallback((id: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        title: c.artist || '',
        artist: c.title || undefined,
      };
    }));
    setIsDirty(true);
  }, []);

  const handleToggleSkip = useCallback((id: string) => {
    setChapters(prev => prev.map(c => c.id === id ? { ...c, skip: !c.skip } : c));
    setIsDirty(true);
  }, []);

  const handleAdjustTime = useCallback((id: string, deltaSeconds: number) => {
    setChapters(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        const maxDuration = song?.duration || 86400;
        const newStart = Math.max(0, Math.min(maxDuration, Math.round((c.startTime + deltaSeconds) * 10) / 10));
        return { ...c, startTime: newStart };
      });
      return recalculateEndTimes(updated, song?.duration);
    });
    setIsDirty(true);
  }, [song?.duration]);

  const handleMarkCurrentTime = useCallback((id: string) => {
    const roundedTime = Math.max(0, Math.round(currentAudioTime * 10) / 10);
    setChapters(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, startTime: roundedTime } : c));
      return recalculateEndTimes(updated, song?.duration);
    });
    setIsDirty(true);
  }, [currentAudioTime, song?.duration]);

  const handlePreview = useCallback((startTime: number) => {
    onSeek?.(startTime);
  }, [onSeek]);

  const handleSave = useCallback(async () => {
    if (!song) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const finalChapters = recalculateEndTimes(chapters, song.duration);

      // 1. Update in-memory player state if currently playing
      if (currentSong?.id === song.id) {
        updateCurrentSongMetadata({ chapters: finalChapters });
      }

      // 2. Persist to DB and Library context
      if (handlePatchSong) {
        await handlePatchSong(song.id, { chapters: finalChapters });
      } else if (window.electronAPI?.patchSong) {
        await window.electronAPI.patchSong(song.id, { chapters: finalChapters });
      }

      onSave?.(finalChapters);
      setIsDirty(false);
      setStatusType('success');
      setStatusMessage(t('chapters.saveSuccess') || 'Đã lưu danh sách mốc bài hát!');
    } catch (err) {
      console.error('Failed to save chapters:', err);
      setStatusType('error');
      setStatusMessage(t('chapters.saveError') || 'Lỗi khi lưu mốc bài hát.');
    } finally {
      setIsSaving(false);
    }
  }, [song, chapters, currentSong, updateCurrentSongMetadata, handlePatchSong, onSave, t]);

  const handleExportPhysicalSlices = useCallback(async () => {
    if (!song || chapters.length === 0) return;
    if (!window.electronAPI?.selectDirectory || !window.electronAPI?.exportChapters) {
      setStatusType('error');
      setStatusMessage(t('chapters.desktopOnlyExport') || 'Tính năng xuất file chỉ hỗ trợ trên ứng dụng Desktop.');
      return;
    }

    try {
      const targetDir = await window.electronAPI.selectDirectory(
        t('chapters.exportSlices') || 'Chọn thư mục lưu các bài hát con'
      );
      if (!targetDir) return;

      setIsExporting(true);
      setStatusType('info');
      setStatusMessage(t('chapters.exporting') || 'Đang cắt và xuất các file con bằng FFmpeg...');

      const result = await window.electronAPI.exportChapters(song.id, chapters, targetDir);
      if (result.success) {
        setStatusType('success');
        setStatusMessage(
          t('chapters.exportSuccess', { count: result.exportedCount }) ||
            `Đã xuất ${result.exportedCount} bài hát thành công!`
        );
      } else {
        setStatusType('error');
        setStatusMessage(result.error || t('chapters.exportError') || 'Lỗi khi xuất file rời.');
      }
    } catch (err) {
      console.error('Failed to export chapter slices:', err);
      setStatusType('error');
      setStatusMessage(t('chapters.exportError') || 'Lỗi khi xuất file rời.');
    } finally {
      setIsExporting(false);
    }
  }, [song, chapters, t]);

  return {
    chapters,
    isDirty,
    isSaving,
    isExporting,
    statusMessage,
    statusType,
    handleAddChapter,
    handleRemoveChapter,
    handleUpdateTitle,
    handleUpdateArtist,
    handleSwapArtistTitle,
    handleToggleSkip,
    handleAdjustTime,
    handleMarkCurrentTime,
    handlePreview,
    handleSave,
    handleExportPhysicalSlices,
    formatTime,
  };
};
