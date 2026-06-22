import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloaderModal } from '@components';
import { SearchOverlay } from './SearchOverlay';
import { useHeader } from './useHeader';
import { SearchInput } from './components/SearchInput';
import { ProfileMenu } from './components/ProfileMenu';
import logo from '@music/brand/logos/icon_only_gradient.png';
import './Header.scss';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    domNodes,
    actions,
    utils
  } = useHeader();

  const { t } = utils;

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo" onClick={() => navigate('/playlist/0')} title={t('header.home')}>
            <img src={logo} alt="logo" />
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar-wrapper" ref={domNodes.searchRef}>
            <SearchInput
              searchQuery={state.searchQuery}
              isSearchFocused={state.isSearchFocused}
              onSearchChange={(val) => {
                actions.setSearchQuery(val);
                actions.setSelectedIndex(0);
                actions.setIsSearchFocused(true);
              }}
              onFocus={() => actions.setIsSearchFocused(true)}
              onClear={() => actions.setSearchQuery('')}
              t={t}
            />

            {state.isSearchFocused && (
              <SearchOverlay
                query={state.searchQuery}
                results={state.searchResults}
                recentSearches={state.recentSearches}
                selectedIndex={state.selectedIndex}
                onSelect={actions.handleSelectResult}
                onSelectRecent={actions.handleSelectRecent}
                onRemoveRecent={actions.removeRecentSearch}
                onClearRecent={actions.clearRecentSearches}
                onPlayNext={actions.playNext}
                onAddToQueue={actions.addToQueue}
              />
            )}
          </div>
        </div>

        <div className="header-right">
          <ProfileMenu
            isOpen={state.showProfileMenu}
            activeMenuStack={state.activeMenuStack}
            menusToRender={utils.menusToRender}
            menuHeight={state.menuHeight}
            // eslint-disable-next-line react-hooks/refs
            dropdownRef={domNodes.dropdownRef}
            // eslint-disable-next-line react-hooks/refs
            profileRef={domNodes.profileRef}
            onToggle={() => actions.setShowProfileMenu(!state.showProfileMenu)}
            onPushMenu={actions.handlePushMenu}
            onPopMenu={actions.handlePopMenu}
            t={t}
          />
        </div>
      </header>

      <DownloaderModal
        key={state.showDownloader ? 'open' : 'closed'}
        isOpen={state.showDownloader}
        onClose={() => actions.setShowDownloader(false)}
      />
    </>
  );
};

export default Header;
