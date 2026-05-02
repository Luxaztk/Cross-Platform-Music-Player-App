import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, MoreVertical, ListMusic } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type LibrarySectionProps } from '../types';

export const LibrarySection: React.FC<LibrarySectionProps> = ({
    isVisible,
    activeMenuId,
    menuPlacement,
    menuRef,
    onToggleMenu,
    onImportFiles,
    onImportFolder,
    onToggleSidebar,
    appIcon,
    t
}) => {
    if (!isVisible) return null;

    return (
        <div className="nav-section-library">
            <div className="library-header">
                <button className="sidebar-toggle-btn" onClick={onToggleSidebar} title={t('sidebar.collapse')}>
                    <ChevronLeft size={ICON_SIZES.SMALL} />
                </button>
                <h3>{t('sidebar.yourLibrary')}</h3>
            </div>
            <ul>
                <li>
                    <NavLink
                        to="/playlist/0"
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''} ${isActive || activeMenuId === '0' ? 'menu-open' : ''}`
                        }
                    >
                        <img src={appIcon} alt="" className="icon brand-icon-small" />
                        <span className="text">{t('sidebar.allSongs')}</span>
                        <div className="col-more">
                            <button
                                className={`more-btn ${activeMenuId === '0' ? 'active' : ''}`}
                                onClick={(e) => onToggleMenu(e, '0')}
                                title={t('common.more')}
                            >
                                <MoreVertical size={ICON_SIZES.TINY} />
                            </button>

                            {activeMenuId === '0' && (
                                <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`} ref={menuRef}>
                                    <button className="menu-item" onClick={onImportFiles}>
                                        <img src={appIcon} alt="" className="brand-icon-tiny" />
                                        <span>{t('playlist.importFiles')}</span>
                                    </button>
                                    <button className="menu-item" onClick={onImportFolder}>
                                        <ListMusic size={ICON_SIZES.TINY} />
                                        <span>{t('playlist.importFolder')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </NavLink>
                </li>
            </ul>
        </div>
    );
};
