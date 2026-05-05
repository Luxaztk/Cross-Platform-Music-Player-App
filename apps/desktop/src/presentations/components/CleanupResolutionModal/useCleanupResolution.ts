import { useState, useCallback } from 'react';
import type { Song } from '@music/types';
import { useLanguage } from '@hooks';

export const useCleanupResolution = (
  missingSongs: Song[],
  onConfirm: (selectedIds: string[]) => void,
  onClose: () => void
) => {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(missingSongs.map((s) => s.id)));

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
      if (prev.size === missingSongs.length) {
        return new Set();
      } else {
        return new Set(missingSongs.map((s) => s.id));
      }
    });
  }, [missingSongs]);

  const handleApply = useCallback(() => {
    onConfirm(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onConfirm, onClose]);

  return {
    state: {
      selectedIds,
      isAllSelected: selectedIds.size === missingSongs.length
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
