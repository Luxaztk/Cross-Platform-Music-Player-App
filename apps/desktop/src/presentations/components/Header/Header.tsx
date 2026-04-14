import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, User, Languages, Settings, X, SlidersHorizontal, Headphones, Check, ChevronRight, ChevronLeft, Palette, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { DownloaderModal } from '../DownloaderModal/DownloaderModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal/DeleteConfirmationModal';
import { useSearch, useLibrary, useRecentSearches, useNotification, type SearchResults } from '../../../application/hooks';
import { usePlayer, useAudioDevices } from '@music/hooks';
import type { Song, RecentSearch } from '@music/types';

import { SearchOverlay, type SearchResultItem } from './SearchOverlay';
import logo from '@music/brand/logos/icon_only_gradient.png';
import { useTheme } from '../Theme';
import './Header.scss';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  action?: () => void;
  children?: MenuItem[];
  isDivider?: boolean;
  isSelected?: boolean;
  className?: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { songs, playlists, setLibraryFilter, handleScanMissingFiles, handleDeleteSongs } = useLibrary();
  const { playList, playNext, addToQueue } = usePlayer();
  const { showNotification } = useNotification();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activeMenuStack, setActiveMenuStack] = React.useState<string[]>(['root']);
  const [renderStack, setRenderStack] = React.useState<string[]>(['root']);
  const [menuHeight, setMenuHeight] = React.useState<number | undefined>(undefined);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
  const { recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();
  const [showDownloader, setShowDownloader] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [missingFileIds, setMissingFileIds] = React.useState<string[] | null>(null);

  const searchResults = useSearch(songs, playlists, searchQuery);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const flatResults: SearchResultItem[] = [
    ...searchResults.songs.map((s: Song) => ({ type: 'song' as const, item: s })),
    ...searchResults.artists.map((a: SearchResults['artists'][number]) => ({ type: 'artist' as const, item: a })),
    ...searchResults.albums.map((al: SearchResults['albums'][number]) => ({ type: 'album' as const, item: al })),
  ];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setIsSearchFocused(false);
      }

      if (isSearchFocused && searchQuery) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
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
  }, [showProfileMenu, isSearchFocused, selectedIndex, flatResults, searchQuery]);

  const handleSelectResult = (result: SearchResultItem) => {
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

    // Add to recent searches
    if (result.type === 'song') {
      addSearch({ type: 'query', text: result.item.title });
    } else if (result.type === 'artist' || result.type === 'album') {
      addSearch({ 
        type: 'entity', 
        entityType: result.type, 
        id: result.item.id, 
        name: result.item.name
      });
    }
  };

  const handleSelectRecent = (recent: RecentSearch) => {
    if (recent.type === 'query') {
      setSearchQuery(recent.text);
    } else if (recent.type === 'entity') {
      if (recent.entityType === 'artist') {
        handleSelectResult({ 
          type: 'artist', 
          item: { id: recent.id!, name: recent.name! }
        });
      } else if (recent.entityType === 'album') {
        // Find the album in results or just pass a reconstructed object
        // Since handleSelectResult only uses id and name for navigation, this is safe
        handleSelectResult({ 
          type: 'album', 
          item: { id: recent.id!, name: recent.name!, artist: '' } // artist is required by type
        });
      }
    }
  };

  const handleTestSound = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    // Check if setSinkId is supported (Experimental)
    if ('setSinkId' in ctx && typeof (ctx as any).setSinkId === 'function') {
      (ctx as any).setSinkId(currentDeviceId).then(() => {
        playBeep(ctx);
      }).catch((e: Error) => {
        console.error('Failed to set sinkId on audio context', e);
        playBeep(ctx);
      });
    } else {
      playBeep(ctx);
    }
  };

  const playBeep = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  };

  const onScanMissing = async () => {
    setIsScanning(true);
    setShowProfileMenu(false);
    try {
      const missing = await handleScanMissingFiles();
      if (missing.length === 0) {
        showNotification('info', t('libraryCleanup.noMissing'));
      } else {
        setMissingFileIds(missing);
      }
    } catch (err) {
      console.error('Scan missing files error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const confirmCleanup = async () => {
    if (!missingFileIds) return;
    const count = missingFileIds.length;
    const success = await handleDeleteSongs(missingFileIds);
    if (success) {
      showNotification('success', t('libraryCleanup.success').replace('{count}', count.toString()));
    }
    setMissingFileIds(null);
  };

  React.useEffect(() => {
    if (!showProfileMenu) {
      const timer = setTimeout(() => {
        setActiveMenuStack(['root']);
        setRenderStack(['root']);
        setMenuHeight(undefined);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showProfileMenu]);

  const handlePushMenu = React.useCallback((id: string) => {
    setActiveMenuStack(prev => [...prev, id]);
    setRenderStack(prev => [...prev, id]);
  }, []);

  const handlePopMenu = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuStack(prev => prev.slice(0, -1));
    setTimeout(() => {
      setRenderStack(prev => prev.slice(0, -1));
    }, 300);
  }, []);

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

  const rootMenuItems: MenuItem[] = [
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
      action: () => setLanguage(language === 'vi' ? 'en' : 'vi')
    },
    { id: 'div1', label: '', isDivider: true },
    {
      id: 'themes',
      label: t('header.theme') || 'Chủ đề',
      icon: <Palette size={16} />,
      children: [
        { id: 'midnight', label: 'Midnight', action: () => setTheme('midnight'), isSelected: theme === 'midnight', rightElement: theme === 'midnight' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'amoled', label: 'Amoled', action: () => setTheme('amoled'), isSelected: theme === 'amoled', rightElement: theme === 'amoled' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'nord', label: 'Nord', action: () => setTheme('nord'), isSelected: theme === 'nord', rightElement: theme === 'nord' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'rose', label: 'Rose', action: () => setTheme('rose'), isSelected: theme === 'rose', rightElement: theme === 'rose' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'ocean', label: 'Ocean', action: () => setTheme('ocean'), isSelected: theme === 'ocean', rightElement: theme === 'ocean' ? <Check size={14} className="check-icon" /> : undefined },
        { id: 'snow', label: 'Snow', action: () => setTheme('snow'), isSelected: theme === 'snow', rightElement: theme === 'snow' ? <Check size={14} className="check-icon" /> : undefined },
      ]
    },
    { id: 'div2', label: '', isDivider: true },
    {
      id: 'audioOut',
      label: t('settings.audioOutput') || 'Đầu ra âm thanh',
      icon: <Headphones size={16} />,
      children: [
        { id: 'default', label: t('settings.defaultDevice') || 'Mặc định', action: () => setAudioDevice('default'), isSelected: currentDeviceId === 'default', rightElement: currentDeviceId === 'default' ? <Check size={14} className="check-icon" /> : undefined },
        ...devices.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications').map(d => ({
          id: d.deviceId,
          label: d.label,
          action: () => setAudioDevice(d.deviceId),
          isSelected: currentDeviceId === d.deviceId,
          rightElement: currentDeviceId === d.deviceId ? <Check size={14} className="check-icon" /> : undefined
        })),
        { id: 'div3', label: '', isDivider: true },
        { id: 'test', label: t('settings.testSound') || 'Kiểm tra âm thanh', action: handleTestSound, className: 'test-sound-btn' }
      ]
    },
    { id: 'div4', label: '', isDivider: true },
    {
      id: 'scan',
      label: t('libraryCleanup.title'),
      icon: isScanning ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />,
      action: onScanMissing
    },
    {
      id: 'downloader',
      label: t('downloader.title'),
      icon: <Download size={16} />,
      action: () => { setShowDownloader(true); setShowProfileMenu(false); }
    },
    {
      id: 'settings',
      label: t('header.settings'),
      icon: <Settings size={16} />
    }
  ];

  const menusToRender = renderStack.map((id) => {
    let menu = null;
    if (id === 'root') {
      menu = { id: 'root', title: '', items: rootMenuItems };
    } else {
      const item = getMenuItemById(id, rootMenuItems);
      if (item && item.children) {
        menu = { id: item.id, title: item.label, items: item.children };
      }
    }
    return menu;
  });

  React.useEffect(() => {
    if (showProfileMenu && dropdownRef.current) {
      const activeIndex = activeMenuStack.length - 1;
      const slider = dropdownRef.current.querySelector('.drilldown-slider');
      if (slider && slider.children[activeIndex]) {
        const activePage = slider.children[activeIndex] as HTMLElement;
        // The container has 1px top/bottom border
        setMenuHeight(activePage.offsetHeight + 2);
      }
    }
  }, [showProfileMenu, activeMenuStack, menusToRender]);

  return (
    <>
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo" onClick={() => navigate('/playlist/0')} title={t('header.home')}>
          <img src={logo} alt="logo" />
        </div>
      </div>

      <div className="header-center">
        <button
          className="icon-button nav-controls"
          onClick={() => navigate('/playlist/0')}
          title={t('header.home')}
        >
          <Home size={ICON_SIZES.LARGE} />
        </button>
        <div className="search-bar" ref={searchRef}>
          <Search className="search-icon" size={ICON_SIZES.SMALL} />
          <input
            type="text"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')} title={t('common.clear')}>
              <X size={14} />
            </button>
          )}
          <div className="search-divider" />
          <button className="filter-options-btn" title={t('header.filterOptions')}>
            <SlidersHorizontal size={14} />
          </button>

          {isSearchFocused && (
            <SearchOverlay
              query={searchQuery}
              results={searchResults}
              recentSearches={recentSearches}
              selectedIndex={selectedIndex}
              onSelect={handleSelectResult}
              onSelectRecent={handleSelectRecent}
              onRemoveRecent={removeSearch}
              onClearRecent={clearAll}
              onPlayNext={playNext}
              onAddToQueue={addToQueue}
              onClose={() => setIsSearchFocused(false)}
            />
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="profile-container" ref={profileRef}>
          <button
            className={`user-profile-btn ${showProfileMenu ? 'active' : ''}`}
            title={t('header.profile')}
            onClick={() => {
              if (showProfileMenu) {
                setShowProfileMenu(false);
              } else {
                setShowProfileMenu(true);
              }
            }}
          >
            <div className="avatar">
              <User size={ICON_SIZES.MEDIUM} />
            </div>
          </button>

          {showProfileMenu && (
            <div 
              className="profile-dropdown" 
              onClick={(e) => e.stopPropagation()}
              ref={dropdownRef}
              style={{
                height: menuHeight ? `${menuHeight}px` : undefined,
                transition: 'height 0.3s ease'
              }}
            >
              <div 
                className="drilldown-slider" 
                style={{ 
                  transform: `translateX(-${activeMenuStack.length - 1}00%)` 
                }}
              >
                {menusToRender.map((menu, index) => {
                  if (!menu) return null;
                  return (
                    <div key={menu.id} className="drilldown-page">
                      {index > 0 && (
                        <div className="dropdown-header" onClick={handlePopMenu}>
                          <ChevronLeft size={16} className="back-icon" />
                          <span>{menu.title}</span>
                        </div>
                      )}
                      <div className="dropdown-items">
                        {menu.items.map((item) => (
                          item.isDivider ? (
                            <div key={item.id} className="dropdown-divider" />
                          ) : (
                            <button
                              key={item.id}
                              className={`dropdown-item ${item.isSelected ? 'selected' : ''} ${item.className || ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.children) {
                                  handlePushMenu(item.id);
                                } else if (item.action) {
                                  item.action();
                                }
                              }}
                            >
                              <div className="item-left">
                                {item.icon && <div className="item-icon">{item.icon}</div>}
                                <span className="item-label">{item.label}</span>
                              </div>
                              <div className="item-right">
                                {item.rightElement}
                                {item.children && <ChevronRight size={16} className="item-chevron" />}
                              </div>
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    <DownloaderModal 
      isOpen={showDownloader} 
      onClose={() => setShowDownloader(false)} 
    />

    <DeleteConfirmationModal
      isOpen={!!missingFileIds}
      onClose={() => setMissingFileIds(null)}
      onConfirm={confirmCleanup}
      title={t('libraryCleanup.title')}
      confirmText={t('common.delete')}
      message={t('libraryCleanup.foundMissing').replace('{count}', missingFileIds?.length.toString() || '0')}
      messageSuffix={t('libraryCleanup.confirmMessage')}
    />
  </>
  );
};

export default Header;
