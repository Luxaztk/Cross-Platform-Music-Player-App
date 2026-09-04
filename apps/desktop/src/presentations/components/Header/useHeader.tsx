import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Languages, Palette, Headphones, Check, ShieldCheck, Download, Settings, Loader2, Power } from 'lucide-react';
import { useSearch, useLibrary, useRecentSearches, useLanguage, useTheme } from '@hooks';
import { usePlayer, useAudioDevices } from '@music/hooks';
import type { Song, RecentSearch } from '@music/types';
import type { SearchResultItem } from './SearchOverlay';
import { groupAndSortSongs } from '../../../application/utils/searchUtils';

import { type UseHeaderReturn, type MenuItem } from './types';

const getMenuItemById = (id: string, items: MenuItem[]): MenuItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = getMenuItemById(id, item.children);
      if (found) return found;
    }
  }
  return null;
};

export const useHeader = (): UseHeaderReturn => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { 
    songs, 
    playlists, 
    setLibraryFilter, 
    isSyncing,
    handleSyncLibrary
  } = useLibrary();
  const { playList, playNext, addToQueue } = usePlayer();
  const { theme, setTheme } = useTheme();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
  const { recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeMenuStack, setActiveMenuStack] = useState<string[]>(['root']);
  const [renderStack, setRenderStack] = useState<string[]>(['root']);
  const [menuHeight, setMenuHeight] = useState<number | undefined>(undefined);
  const [showDownloader, setShowDownloader] = useState(false);

  const searchResults = useSearch(songs, playlists, searchQuery);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const flatResults: SearchResultItem[] = useMemo(() => {
    const groups = groupAndSortSongs(searchResults.songs, searchQuery);
    return [
      ...groups.titles.slice(0, 5).map((s: Song) => ({ type: 'song' as const, item: s })),
      ...groups.artists.slice(0, 5).map((s: Song) => ({ type: 'song' as const, item: s })),
      ...groups.albums.slice(0, 5).map((s: Song) => ({ type: 'song' as const, item: s })),
      ...searchResults.artists.map((a: { id: string; name: string }) => ({
        type: 'artist' as const,
        item: a,
      })),
      ...searchResults.albums.map((al: { id: string; name: string; artist: string }) => ({
        type: 'album' as const,
        item: al,
      })),
    ];
  }, [searchResults, searchQuery]);


  const handleSelectResult = useCallback((result: SearchResultItem) => {
    if (result.type === 'song') {
      const songIdx = songs.findIndex((s: Song) => s.id === result.item.id);
      if (songIdx !== -1) playList(songs, songIdx);
    } else if (result.type === 'artist') {
      setLibraryFilter({ type: 'artist', values: [result.item.name] });
      navigate('/playlist/0');
    } else if (result.type === 'album') {
      setLibraryFilter({ type: 'album', values: [result.item.name] });
      navigate('/playlist/0');
    }
    setIsSearchFocused(false);
    setSearchQuery('');

    if (result.type === 'song') {
      addSearch({ type: 'query', text: result.item.title });
    } else if (result.type === 'artist' || result.type === 'album') {
      addSearch({
        type: 'entity',
        entityType: result.type,
        id: result.item.id,
        name: result.item.name,
      });
    }
  }, [songs, playList, setLibraryFilter, navigate, addSearch]);

  const handleSelectRecent = useCallback((recent: RecentSearch) => {
    if (recent.type === 'query') {
      setSearchQuery(recent.text);
    } else if (recent.type === 'entity') {
      if (recent.entityType === 'artist') {
        handleSelectResult({
          type: 'artist',
          item: { id: recent.id!, name: recent.name! },
        });
      } else if (recent.entityType === 'album') {
        handleSelectResult({
          type: 'album',
          item: { id: recent.id!, name: recent.name!, artist: '' },
        });
      }
    }
  }, [handleSelectResult]);

  const handleTestSound = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();

    const playBeep = (c: AudioContext) => {
        const osc = c.createOscillator();
        const gainNode = c.createGain();
        osc.connect(gainNode);
        gainNode.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, c.currentTime);
        gainNode.gain.setValueAtTime(0.1, c.currentTime);
        osc.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, c.currentTime + 0.5);
        osc.stop(c.currentTime + 0.5);

        setTimeout(() => {
          if (c.state !== 'closed') {
            c.close().catch(() => {});
          }
        }, 600);
    };

    if ('setSinkId' in ctx && typeof (ctx as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId === 'function') {
      (ctx as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(currentDeviceId).then(() => playBeep(ctx)).catch(() => playBeep(ctx));
    } else {
      playBeep(ctx);
    }
  }, [currentDeviceId]);

  const handlePushMenu = useCallback((id: string) => {
    setActiveMenuStack((prev) => [...prev, id]);
    setRenderStack((prev) => [...prev, id]);
  }, []);

  const handlePopMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuStack((prev) => prev.slice(0, -1));
    setTimeout(() => {
      setRenderStack((prev) => prev.slice(0, -1));
    }, 300);
  }, []);



  const rootMenuItems: MenuItem[] = useMemo(() => [
    {
      id: 'language',
      label: t('header.language'),
      icon: <Languages size={16} />,
      rightElement: (
        <div className={`lang-toggle ${language}`}>
          <span className="lang-label vi">VI</span>
          <div className="toggle-handle"></div>
          <span className="lang-label en">EN</span>
        </div>
      ),
      action: () => setLanguage(language === 'vi' ? 'en' : 'vi'),
    },
    { id: 'div1', label: '', isDivider: true },
    {
      id: 'themes',
      label: t('header.theme') || 'Chủ đề',
      icon: <Palette size={16} />,
      children: [
        { id: 'midnight', label: 'Midnight', themeId: 'midnight', action: () => setTheme('midnight'), isSelected: theme === 'midnight', rightElement: theme === 'midnight' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'amoled', label: 'Amoled', themeId: 'amoled', action: () => setTheme('amoled'), isSelected: theme === 'amoled', rightElement: theme === 'amoled' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'nord', label: 'Nord', themeId: 'nord', action: () => setTheme('nord'), isSelected: theme === 'nord', rightElement: theme === 'nord' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'rose', label: 'Rose', themeId: 'rose', action: () => setTheme('rose'), isSelected: theme === 'rose', rightElement: theme === 'rose' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'ocean', label: 'Ocean', themeId: 'ocean', action: () => setTheme('ocean'), isSelected: theme === 'ocean', rightElement: theme === 'ocean' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'snow', label: 'Snow', themeId: 'snow', action: () => setTheme('snow'), isSelected: theme === 'snow', rightElement: theme === 'snow' ? <Check size={14} className="check-icon" /> : undefined },
      ],
    },
    { id: 'div2', label: '', isDivider: true },
    {
      id: 'audioOut',
      label: t('settings.audioOutput') || 'Đầu ra âm thanh',
      icon: <Headphones size={16} />,
      children: [
        { id: 'default', label: t('settings.defaultDevice') || 'Mặc định', action: () => setAudioDevice('default'), isSelected: currentDeviceId === 'default', rightElement: currentDeviceId === 'default' ? <Check size={14} className="check-icon" /> : undefined },
        ...devices.filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications').map((d) => ({
            id: d.deviceId,
            label: d.label,
            action: () => setAudioDevice(d.deviceId),
            isSelected: currentDeviceId === d.deviceId,
            rightElement: currentDeviceId === d.deviceId ? <Check size={14} className="check-icon" /> : undefined,
        })),
        { id: 'div3', label: '', isDivider: true },
        { id: 'test', label: t('settings.testSound') || 'Kiểm tra âm thanh', action: handleTestSound, className: 'test-sound-btn' },
      ],
    },
    { id: 'div4', label: '', isDivider: true },
    {
      id: 'scan',
      label: t('libraryCleanup.title'),
      icon: isSyncing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />,
      action: () => {
        handleSyncLibrary();
        setShowProfileMenu(false);
      },
    },
    {
      id: 'downloader',
      label: t('downloader.title'),
      icon: <Download size={16} />,
      action: () => {
        setShowDownloader(true);
        setShowProfileMenu(false);
      },
    },
    {
      id: 'settings',
      label: t('header.settings'),
      icon: <Settings size={16} />,
      action: () => {
        navigate('/settingsPage');
        setShowProfileMenu(false);
      },
    },
    { id: 'div5', label: '', isDivider: true },
    {
      id: 'quit',
      label: 'Quit',
      icon: <Power size={16} />,
      action: () => {
        window.electronAPI?.quitApp?.();
      },
      className: 'quit-btn',
    },
  ], [t, language, setLanguage, theme, setTheme, currentDeviceId, devices, setAudioDevice, handleTestSound, isSyncing, handleSyncLibrary, navigate]);

  const menusToRender = useMemo(() => renderStack.map((id) => {
    if (id === 'root') return { id: 'root', title: '', items: rootMenuItems };
    const item = getMenuItemById(id, rootMenuItems);
    if (item && item.children) return { id: item.id, title: item.label, items: item.children };
    return null;
  }), [renderStack, rootMenuItems]);

  // Click outside and keys
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setIsSearchFocused(false);
      }
      if (isSearchFocused && searchQuery) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (event.key === 'Enter') {
          const selected = flatResults[selectedIndex];
          if (selected) handleSelectResult(selected);
        }
      }
    };
    if (showProfileMenu || isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeydown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [showProfileMenu, isSearchFocused, selectedIndex, flatResults, searchQuery, handleSelectResult]);

  // Reset menu on close
  useEffect(() => {
    if (!showProfileMenu) {
      const timer = setTimeout(() => {
        setActiveMenuStack(['root']);
        setRenderStack(['root']);
        setMenuHeight(undefined);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showProfileMenu]);

  // Update menu height
  useEffect(() => {
    if (showProfileMenu && dropdownRef.current) {
      const activeIndex = activeMenuStack.length - 1;
      const slider = dropdownRef.current.querySelector('.drilldown-slider');
      if (slider && slider.children[activeIndex]) {
        const activePage = slider.children[activeIndex] as HTMLElement;
        setMenuHeight(activePage.offsetHeight + 2);
      }
    }
  }, [showProfileMenu, activeMenuStack, menusToRender]);

  return {
    state: {
      searchQuery,
      isSearchFocused,
      selectedIndex,
      showProfileMenu,
      showDownloader,
      activeMenuStack,
      renderStack,
      menuHeight,
      isSyncing,
      searchResults,
      flatResults,
      recentSearches,
      language
    },
    domNodes: {
      searchRef,
      profileRef,
      dropdownRef,
    },
    actions: {
      setSearchQuery,
      setIsSearchFocused,
      setSelectedIndex,
      setShowProfileMenu,
      setShowDownloader,
      handleSelectResult,
      handleSelectRecent,
      handlePushMenu,
      handlePopMenu,
      removeRecentSearch: removeSearch,
      clearRecentSearches: clearAll,
      playNext,
      addToQueue
    },
    utils: {
      t,
      menusToRender
    }
  };
};
