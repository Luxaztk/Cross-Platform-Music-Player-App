import { useState, useCallback, useEffect } from 'react';
import type { Song } from '@music/types';

export const usePlaylistSelection = (id: string | undefined, songs: Song[], isLibrary: boolean, setBulkDeleteMode: (mode: 'library' | 'playlist' | null) => void) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setSelectedIds(new Set());
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === songs.length && songs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(songs.map((s) => s.id)));
    }
  }, [selectedIds.size, songs]);

  const toggleSelect = useCallback((songId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  }, []);

  // Keyboard shortcut for Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedIds.size > 0) {
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        setBulkDeleteMode(isLibrary ? 'library' : 'playlist');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size, isLibrary, setBulkDeleteMode]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelectAll,
    toggleSelect
  };
};
