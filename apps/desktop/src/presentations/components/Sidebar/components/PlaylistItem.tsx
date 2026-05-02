import React from 'react';
import { NavLink } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type PlaylistItemProps } from '../types';

export const PlaylistItem: React.FC<PlaylistItemProps> = ({
    playlist,
    isActive,
    isMenuOpen,
    menuPlacement,
    menuRef,
    onToggleMenu,
    onEdit,
    onDelete,
    appIcon,
    t
}) => {
    return (
        <li className={isMenuOpen ? 'menu-open' : ''}>
            <NavLink
                to={`/playlist/${playlist.id}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
            >
                <img src={appIcon} alt="" className="icon brand-icon-small" />
                <span className="text">{playlist.name}</span>
                <div className="col-more">
                    <button
                        className={`more-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={(e) => onToggleMenu(e, playlist.id)}
                        title={t('common.more')}
                    >
                        <MoreVertical size={ICON_SIZES.TINY} />
                    </button>

                    {isMenuOpen && (
                        <div
                            className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`}
                            ref={menuRef}
                        >
                            <button className="menu-item" onClick={(e) => onEdit(e, playlist)}>
                                <Edit2 size={ICON_SIZES.TINY} />
                                <span>{t('common.edit')}</span>
                            </button>
                            <button className="menu-item delete" onClick={(e) => onDelete(e, playlist)}>
                                <Trash2 size={ICON_SIZES.TINY} />
                                <span>{t('common.delete')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </NavLink>
        </li>
    );
};
