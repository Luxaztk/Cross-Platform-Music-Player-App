import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, User, Languages, Settings, LogOut, X, SlidersHorizontal, Headphones, Check, ChevronRight, Palette, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { DownloaderModal } from '../DownloaderModal/DownloaderModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal/DeleteConfirmationModal';
import { useSearch, useLibrary, useRecentSearches, useNotification } from '../../../application/hooks';
import { usePlayer, useAudioDevices } from '@music/hooks';
import type { Song } from '@music/types';
import { SearchOverlay } from './SearchOverlay';
import logo from '@music/brand/logos/icon_only_gradient.png';
import { useTheme, type ThemeType } from '../Theme';
import './Header.scss';

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
  const [showDeviceMenu, setShowDeviceMenu] = React.useState(false);
  const [showThemeMenu, setShowThemeMenu] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { devices, currentDeviceId, setAudioDevice } = useAudioDevices();
  const { recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches();
  const [showDownloader, setShowDownloader] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [missingFileIds, setMissingFileIds] = React.useState<string[] | null>(null);

  const searchResults = useSearch(songs, playlists, searchQuery);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const flatResults = [
    ...searchResults.songs.map((s: Song) => ({ type: 'song', item: s })),
    ...searchResults.artists.map((a: any) => ({ type: 'artist', item: a })),
    ...searchResults.albums.map((al: any) => ({ type: 'album', item: al })),
  ];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowDeviceMenu(false);
        setShowThemeMenu(false);
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

  const handleSelectResult = (result: any) => {
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

  const handleSelectRecent = (recent: any) => {
    if (recent.type === 'query') {
      setSearchQuery(recent.text);
    } else if (recent.type === 'entity') {
      handleSelectResult({ type: recent.entityType, item: { id: recent.id, name: recent.name } });
    }
  };

  const handleTestSound = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    if (typeof (ctx as any).setSinkId === 'function') {
      (ctx as any).setSinkId(currentDeviceId).then(() => {
        playBeep(ctx);
      }).catch((e: any) => {
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
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
          <div className="search-divider" />
          <button className="filter-options-btn">
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
                setShowDeviceMenu(false);
                setShowThemeMenu(false);
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
            <div className="profile-dropdown">
              <div className="dropdown-section">
                <div
                  className="dropdown-item lang-switcher"
                  onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                >
                  <div className="lang-switcher-left">
                    <Languages size={16} />
                    <span>{t('header.language')}</span>
                  </div>
                  <div className={`lang-toggle ${language}`}>
                    <span className="lang-label vi">VI</span>
                    <div className="toggle-handle"></div>
                    <span className="lang-label en">EN</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider" />

              {/* Theme Selection */}
              <div
                className="dropdown-item nested-dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeMenu(!showThemeMenu);
                  setShowDeviceMenu(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Palette size={16} />
                  <span>{t('header.theme') || 'Chủ đề'}</span>
                </div>
                <ChevronRight size={14} className={`chevron ${showThemeMenu ? 'open' : ''}`} />

                {showThemeMenu && (
                  <div className="nested-dropdown-menu">
                    {[
                      { id: 'midnight', name: 'Midnight', color: '#10b981' },
                      { id: 'amoled', name: 'Amoled', color: '#ffffff' },
                      { id: 'nord', name: 'Nord', color: '#88c0d0' },
                      { id: 'rose', name: 'Rose', color: '#f43f5e' },
                      { id: 'ocean', name: 'Ocean', color: '#06b6d4' },
                      { id: 'snow', name: 'Snow', color: '#fcfaf7', border: '1px solid rgba(0,0,0,0.06)' }
                    ].map((themeItem) => (
                      <button
                        key={themeItem.id}
                        className={`device-btn ${theme === themeItem.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(themeItem.id as ThemeType);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            backgroundColor: themeItem.color,
                            border: (themeItem as any).border || 'none',
                            boxShadow: themeItem.id === 'snow' ? 'none' : `0 0 8px ${themeItem.color}44`
                          }} />
                          <span>{themeItem.name}</span>
                        </div>
                        {theme === themeItem.id && <Check size={14} className="check-icon" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown-divider" />

              {/* Output Device Selection */}
              <div
                className="dropdown-item nested-dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeviceMenu(!showDeviceMenu);
                  setShowThemeMenu(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Headphones size={16} />
                  <span>{t('settings.audioOutput') || 'Đầu ra âm thanh'}</span>
                </div>
                <ChevronRight size={14} className={`chevron ${showDeviceMenu ? 'open' : ''}`} />

                {showDeviceMenu && (
                  <div className="nested-dropdown-menu">
                    <button
                      className={`device-btn ${currentDeviceId === 'default' ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAudioDevice('default');
                      }}
                    >
                      <span>{t('settings.defaultDevice') || 'Mặc định'}</span>
                      {currentDeviceId === 'default' && <Check size={14} className="check-icon" />}
                    </button>
                    {devices.filter(d => d.deviceId !== 'default' && d.deviceId !== 'communications').map(d => (
                      <button
                        key={d.deviceId}
                        className={`device-btn ${currentDeviceId === d.deviceId ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAudioDevice(d.deviceId);
                        }}
                      >
                        <span title={d.label}>{d.label}</span>
                        {currentDeviceId === d.deviceId && <Check size={14} className="check-icon" />}
                      </button>
                    ))}
                    <div className="dropdown-divider" style={{ margin: '4px 0' }} />
                    <button
                      className="device-btn test-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSound();
                      }}
                    >
                      <span>{t('settings.testSound') || 'Kiểm tra âm thanh'}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="dropdown-divider" />

              <button 
                className="dropdown-item" 
                onClick={onScanMissing}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>{t('libraryCleanup.title')}</span>
              </button>

              <button className="dropdown-item" onClick={() => { setShowDownloader(true); setShowProfileMenu(false); }}>
                <Download size={16} />
                <span>{t('downloader.title')}</span>
              </button>

              <button className="dropdown-item">
                <Settings size={16} />
                <span>{t('header.settings')}</span>
              </button>
              <button className="dropdown-item" style={{ display: 'none' }}>
                <LogOut size={16} />
                <span>{t('header.logout')}</span>
              </button>
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
