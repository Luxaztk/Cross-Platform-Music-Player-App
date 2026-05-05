import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type SidebarMiniProps } from '../types';

export const SidebarMini: React.FC<SidebarMiniProps> = ({
    isVisible,
    playlists,
    onToggle,
    onCreatePlaylist,
    appIcon,
    t
}) => {
    if (!isVisible) return null;

    return (
        <nav className="sidebar-nav mini">
            <div className="mini-top-actions">
                <button className="nav-item mini" onClick={onToggle} title={t('sidebar.expand')}>
                    <ChevronRight size={ICON_SIZES.MEDIUM} />
                </button>
                <NavLink to="/playlist/0" className="nav-item mini" title={t('sidebar.allSongs')}>
                    <img src={appIcon} alt="" className="brand-icon-mini-sidebar" />
                </NavLink>
            </div>

            <div className="mini-divider" />

            <div className="mini-playlists-scroll">
                {playlists.map((playlist) => (
                    <NavLink
                        key={playlist.id}
                        to={`/playlist/${playlist.id}`}
                        className={({ isActive }) => `nav-item mini ${isActive ? 'active' : ''}`}
                        title={playlist.name}
                    >
                        <img src={appIcon} alt="" className="brand-icon-mini-sidebar" />
                    </NavLink>
                ))}
            </div>

            <div className="mini-bottom-actions">
                <button className="nav-item mini accent" title={t('sidebar.createPlaylist')} onClick={onCreatePlaylist}>
                    <Plus size={ICON_SIZES.MEDIUM} />
                </button>
            </div>
        </nav>
    );
};
