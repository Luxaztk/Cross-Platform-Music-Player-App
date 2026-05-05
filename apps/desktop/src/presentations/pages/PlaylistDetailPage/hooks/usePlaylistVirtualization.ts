import { useState, useRef, useEffect } from 'react';
import type { Song } from '@music/types';

const ROW_HEIGHT = 56;
const BUFFER_SIZE = 5;

export const usePlaylistVirtualization = (songs: Song[]) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainArea = document.querySelector('.main-area');
    if (!mainArea) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mainRect = mainArea.getBoundingClientRect();
      const relativeTop = mainRect.top - rect.top;

      setScrollTop(Math.max(0, relativeTop));
      setIsHeaderSticky(relativeTop > 0);
    };

    mainArea.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => mainArea.removeEventListener('scroll', handleScroll);
  }, []);

  const viewportHeight = window.innerHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(songs.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE);

  const visibleSongs = songs.slice(startIndex, endIndex);
  const totalHeight = songs.length * ROW_HEIGHT;
  const paddingOffset = startIndex * ROW_HEIGHT;

  return {
    scrollTop,
    isHeaderSticky,
    containerRef,
    visibleSongs,
    totalHeight,
    paddingOffset,
    startIndex,
    setScrollTop
  };
};
