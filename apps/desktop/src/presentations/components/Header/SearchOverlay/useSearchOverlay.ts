import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type Song } from '@music/types';
import { useLanguage, useTheme, type SearchResults } from '@hooks';
import { groupAndSortSongs } from '../../../../application/utils/searchUtils';
import { type UseSearchOverlayReturn, type SearchResultItem } from './types';

export const useSearchOverlay = (
  query: string,
  results: SearchResults,
  selectedIndex: number
): UseSearchOverlayReturn => {
  const { t } = useLanguage();
  const { appIcon } = useTheme();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');

  const clusteredSongs = useMemo(() => {
    const groups = groupAndSortSongs(results.songs, query);
    return {
      titles: groups.titles.slice(0, 5),
      artists: groups.artists.slice(0, 5),
      albums: groups.albums.slice(0, 5),
    };
  }, [results.songs, query]);

  const flatResults: SearchResultItem[] = useMemo(() => [
    ...clusteredSongs.titles.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...clusteredSongs.artists.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...clusteredSongs.albums.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...results.artists.map((a) => ({ type: 'artist' as const, item: a })),
    ...results.albums.map((al) => ({ type: 'album' as const, item: al })),
  ], [clusteredSongs, results.artists, results.albums]);

  const isTrulyEmpty = useMemo(() => flatResults.length === 0, [flatResults]);

  // Auto-scroll
  useEffect(() => {
    if (contentRef.current) {
      const activeItem = contentRef.current.querySelector('.search-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('mousedown', handleClickOut);
    }
    return () => window.removeEventListener('mousedown', handleClickOut);
  }, [activeMenuId]);

  const handleMoreClick = useCallback((e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (activeMenuId === songId) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();
      const spaceBelow = containerRect
        ? containerRect.bottom - rect.bottom
        : window.innerHeight - rect.bottom;
      const menuHeight = 180;
      setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
      setActiveMenuId(songId);
    }
  }, [activeMenuId]);

  return {
    state: {
      activeMenuId,
      menuPlacement,
      clusteredSongs,
      flatResults,
      isTrulyEmpty,
      appIcon
    },
    refs: {
      contentRef,
      menuRef
    },
    actions: {
      setActiveMenuId,
      setMenuPlacement,
      handleMoreClick
    },
    utils: {
      t
    }
  };
};
