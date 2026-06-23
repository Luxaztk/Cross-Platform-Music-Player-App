import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Playlist } from '@music/types';
import { useLibraryContext } from '@music/hooks';
import { useTheme, useLanguage, useLocalFilter } from '@hooks';
import { type UseSidebarReturn, type SortMode } from './types';

export const useSidebar = (): UseSidebarReturn => {
  const {
    playlists,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleUpdatePlaylist,
    handleImportFiles,
    handleImportFolder,
  } = useLibraryContext();
  
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { appIcon } = useTheme();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);
  const [playlistQuery, setPlaylistQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    if (activeMenuId || isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId, isSortMenuOpen]);

  const onCreatePlaylist = useCallback(async () => {
    const nextNum = playlists.filter((p: Playlist) => String(p.id) !== '0').length + 1;
    const playlistName = t('sidebar.createPlaylist') + ` #${nextNum}`;
    const newPlaylist = await handleCreatePlaylist(playlistName);
    if (newPlaylist) {
      navigate(`/playlist/${newPlaylist.id}`);
    }
  }, [playlists, t, handleCreatePlaylist, navigate]);

  const onEditPlaylist = useCallback((e: React.MouseEvent, playlist: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlaylist(playlist);
    setActiveMenuId(null);
  }, []);

  const onDeletePlaylist = useCallback((e: React.MouseEvent, playlist: Playlist) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingPlaylist(playlist);
    setActiveMenuId(null);
  }, []);

  const confirmDeletePlaylist = useCallback(async () => {
    if (!deletingPlaylist) return;
    const success = await handleDeletePlaylist(deletingPlaylist.id);
    if (success) {
      setDeletingPlaylist(null);
      if (window.location.hash.includes(`/playlist/${deletingPlaylist.id}`)) {
        navigate('/playlist/0');
      }
    }
  }, [deletingPlaylist, handleDeletePlaylist, navigate]);

  const onImportFiles = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(null);
    await handleImportFiles();
  }, [handleImportFiles]);

  const onImportFolder = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(null);
    await handleImportFolder();
  }, [handleImportFolder]);

  const toggleMenu = useCallback((e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeMenuId === playlistId) {
      setActiveMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 120;
      setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
      setActiveMenuId(playlistId);
    }
  }, [activeMenuId]);

  const handleSearchToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      if (playlistQuery) setPlaylistQuery('');
    } else {
      setIsSearchExpanded(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchExpanded, playlistQuery]);

  const handleSearchBlur = useCallback(() => {
    if (!playlistQuery) {
      setIsSearchExpanded(false);
    }
  }, [playlistQuery]);

  const nonLibraryPlaylists = useMemo(() => 
    playlists.filter((p: Playlist) => String(p.id) !== '0'), 
    [playlists]
  );

  const [filteredPlaylists, isDebouncing] = useLocalFilter(nonLibraryPlaylists, playlistQuery, ['name']);

  const customPlaylists = useMemo(() => {
    if (sortMode === 'default') return filteredPlaylists;
    return [...filteredPlaylists].sort((a, b) => {
      if (sortMode === 'az') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
  }, [filteredPlaylists, sortMode]);

  const handleUpdatePlaylistAction = useCallback(async (p: Playlist) => {
    await handleUpdatePlaylist(p);
  }, [handleUpdatePlaylist]);

  return {
    state: {
      activeMenuId,
      menuPlacement,
      editingPlaylist,
      deletingPlaylist,
      playlistQuery,
      isSearchExpanded,
      sortMode,
      isSortMenuOpen,
      isDebouncing
    },
    playlists: {
      all: playlists,
      filtered: filteredPlaylists,
      sorted: customPlaylists
    },
    refs: {
      menuRef,
      sortMenuRef,
      searchInputRef
    },
    actions: {
      setActiveMenuId,
      setIsSortMenuOpen,
      setEditingPlaylist,
      setDeletingPlaylist,
      setPlaylistQuery,
      onCreatePlaylist,
      onEditPlaylist,
      onDeletePlaylist,
      confirmDeletePlaylist,
      handleUpdatePlaylist: handleUpdatePlaylistAction,
      onImportFiles,
      onImportFolder,
      toggleMenu,
      handleSearchToggle,
      handleSearchBlur,
      setSortMode
    },
    utils: {
      t,
      appIcon
    }
  };
};
