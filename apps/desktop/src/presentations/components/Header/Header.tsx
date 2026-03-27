import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, User, Languages, Settings, LogOut } from 'lucide-react';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import './Header.scss';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showProfileMenu]);

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
        <div className="search-bar">
          <Search className="search-icon" size={ICON_SIZES.SMALL} />
          <input type="text" placeholder={t('header.searchPlaceholder')} disabled />
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
