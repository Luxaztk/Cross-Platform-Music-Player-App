import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, User, Languages, Settings, LogOut, X, SlidersHorizontal } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { useSearch, useLibrary } from '../../../application/hooks';
import { usePlayer } from '@music/hooks';
import type { Song, Playlist } from '@music/types';
import { SearchOverlay } from './SearchOverlay';
import './Header.scss';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { songs, playlists, setLibraryFilter } = useLibrary();
  const { playList, playNext, addToQueue } = usePlayer();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
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
        setLibraryFilter({ type: 'artist', value: result.item.name });
        navigate('/playlist/0');
    } else if (result.type === 'album') {
        setLibraryFilter({ type: 'album', value: result.item.name });
        navigate('/playlist/0');
    }
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo">
          <span className="app-name">Melovista</span>
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

          {isSearchFocused && searchQuery && (
             <SearchOverlay 
                query={searchQuery}
                results={searchResults}
                selectedIndex={selectedIndex}
                onSelect={handleSelectResult}
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
            onClick={() => setShowProfileMenu(!showProfileMenu)}
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
  );
};

export default Header;
