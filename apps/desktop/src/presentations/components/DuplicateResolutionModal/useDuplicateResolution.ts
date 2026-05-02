import { useState, useCallback } from 'react';
import type { Song } from '@music/types';
import { useLanguage } from '@hooks';

export const useDuplicateResolution = (
  duplicates: Song[],
  onResolve: (selectedSongs: Song[]) => void,
  onClose: () => void
) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === duplicates.length) {
        return new Set();
      } else {
        return new Set(duplicates.map((d) => d.id));
      }
    });
  }, [duplicates]);

  const handleApply = useCallback(() => {
    const selectedSongs = duplicates.filter((d) => selectedIds.has(d.id));
    onResolve(selectedSongs);
    onClose();
  }, [duplicates, selectedIds, onResolve, onClose]);

  return {
    state: {
      selectedIds,
      isAllSelected: selectedIds.size === duplicates.length
    },
    actions: {
      toggleSelect,
      selectAll,
      handleApply,
      onClose
    },
    utils: {
      t
    }
  };
};
