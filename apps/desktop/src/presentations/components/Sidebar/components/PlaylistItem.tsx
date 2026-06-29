import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    const handleNavigate = (e: React.MouseEvent) => {
        // Only navigate if it's not a click on the more-btn or menu
        if ((e.target as HTMLElement).closest('.col-more')) {
            return;
        }
        navigate(`/playlist/${playlist.id}`);
    };

    return (
        <li className={isMenuOpen ? 'menu-open' : ''}>
            <div
                onClick={handleNavigate}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
            >
                <img src={playlist.thumbnail || appIcon} alt="" className="icon brand-icon-small" style={{ borderRadius: playlist.thumbnail ? '4px' : '0' }} />
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
                            <button className="menu-item" onClick={(e) => { e.stopPropagation(); onEdit(e, playlist); }}>
                                <Edit2 size={ICON_SIZES.TINY} />
                                <span>{t('common.edit')}</span>
                            </button>
                            <button className="menu-item delete" onClick={(e) => { e.stopPropagation(); onDelete(e, playlist); }}>
                                <Trash2 size={ICON_SIZES.TINY} />
                                <span>{t('common.delete')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};
