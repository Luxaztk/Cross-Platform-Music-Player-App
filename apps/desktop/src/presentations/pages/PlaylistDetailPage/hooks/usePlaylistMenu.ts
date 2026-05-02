import { useState, useRef, useEffect, useCallback } from 'react';

export const usePlaylistMenu = () => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeSubMenuId, setActiveSubMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number; placement: 'top' | 'bottom' }>({
    top: 0,
    right: 0,
    placement: 'bottom',
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside to close Portal menu
  useEffect(() => {
    const handleClickOut = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
        setActiveSubMenuId(null);
      }
    };
    if (activeMenuId) {
      window.addEventListener('click', handleClickOut);
    }
    return () => window.removeEventListener('click', handleClickOut);
  }, [activeMenuId]);

  // Close Portal menu on window resize or scroll
  useEffect(() => {
    const handleClose = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
        setActiveSubMenuId(null);
      }
    };
    window.addEventListener('resize', handleClose);
    const mainArea = document.querySelector('.main-area');
    mainArea?.addEventListener('scroll', handleClose);
    
    return () => {
      window.removeEventListener('resize', handleClose);
      mainArea?.removeEventListener('scroll', handleClose);
    };
  }, [activeMenuId]);

  const toggleMenu = useCallback((sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMenuId === sid) {
      setActiveMenuId(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mainArea = document.querySelector('.main-area');
      const boundary = mainArea ? mainArea.getBoundingClientRect().bottom : window.innerHeight - 90;
      const spaceBelow = boundary - rect.bottom;
      const placement: 'top' | 'bottom' = spaceBelow < 250 ? 'top' : 'bottom';
      const rightPos = Math.max(8, window.innerWidth - rect.right);
      setMenuPosition({
        top: placement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
        right: rightPos,
        placement,
      });
      setActiveMenuId(sid);
    }
  }, [activeMenuId]);

  return {
    activeMenuId,
    setActiveMenuId,
    activeSubMenuId,
    setActiveSubMenuId,
    menuPosition,
    menuRef,
    toggleMenu
  };
};
