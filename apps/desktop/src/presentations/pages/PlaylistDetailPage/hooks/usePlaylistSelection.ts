import { useState, useCallback, useEffect } from 'react';
import type { Song } from '@music/types';

export const usePlaylistSelection = (id: string | undefined, songs: Song[], isLibrary: boolean, setBulkDeleteMode: (mode: 'library' | 'playlist' | null) => void) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === songs.length && songs.length > 0) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedIds(new Set(songs.map((s) => s.id)));
      setLastSelectedId(songs.length > 0 ? songs[songs.length - 1].id : null);
    }
  }, [selectedIds.size, songs]);

  const toggleSelect = useCallback((songId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedIds((prev) => {
      const next = new Set(prev);
      
      if (e?.shiftKey && lastSelectedId) {
        const lastIndex = songs.findIndex((s) => s.id === lastSelectedId);
        const currentIndex = songs.findIndex((s) => s.id === songId);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          
          for (let i = start; i <= end; i++) {
            next.add(songs[i].id);
          }
          setLastSelectedId(songId);
          return next;
        }
      }

      if (next.has(songId)) {
        next.delete(songId);
        if (lastSelectedId === songId) setLastSelectedId(null);
      } else {
        next.add(songId);
        setLastSelectedId(songId);
      }
      return next;
    });
  }, [songs, lastSelectedId]);

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
