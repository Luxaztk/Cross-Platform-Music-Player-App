import React from 'react';
import ReactDOM from 'react-dom';
import { Play, PlaySquare, ListPlus, FolderPlus, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import type { Song, Playlist } from '@music/types';


interface MenuActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const MenuAction: React.FC<MenuActionProps> = ({ icon, label, onClick, className }) => (
  <button className={`menu-item ${className || ''}`} onClick={onClick}>
    <div className="item-content">
      {icon}
      <span>{label}</span>
    </div>
  </button>
);

interface SongRowContextMenuProps {
    isVisible: boolean;
    song: Song | null;
    position: { top: number; right: number; placement: 'top' | 'bottom' };
    activeSubMenuId: string | null;
    playlists: Playlist[];
    currentPlaylistId?: string;
    onPlay: () => void;
    onPlayNext: () => void;
    onAddToQueue: () => void;
    onAddToPlaylist: (pid: string) => void;
    onEdit: () => void;
    onDelete: () => void;
    onSetSubMenu: (id: string | null) => void;
    t: (key: string, options?: any) => string;
    menuRef: React.RefObject<HTMLDivElement | null>;
}

export const SongRowContextMenu: React.FC<SongRowContextMenuProps> = ({
    isVisible,
    song,
    position,
    activeSubMenuId,
    playlists,
    currentPlaylistId,
    onPlay,
    onPlayNext,
    onAddToQueue,
    onAddToPlaylist,
    onEdit,
    onDelete,
    onSetSubMenu,
    t,
    menuRef
}) => {
    if (!isVisible || !song) return null;

    const menuStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      right: position.right,
      ...(position.placement === 'bottom'
        ? { top: position.top }
        : { bottom: window.innerHeight - position.top }),
    };

    return ReactDOM.createPortal(
      <div className="song-row-portal-menu" style={menuStyle} ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <MenuAction
          icon={<Play size={ICON_SIZES.XSMALL} />}
          label={t('playlist.playNow')}
          onClick={onPlay}
        />
        <MenuAction
          icon={<PlaySquare size={ICON_SIZES.XSMALL} />}
          label={t('playlist.playNext')}
          onClick={onPlayNext}
        />
        <MenuAction
          icon={<ListPlus size={ICON_SIZES.XSMALL} />}
          label={t('playlist.addToQueue')}
          onClick={onAddToQueue}
        />

        <div className="menu-divider"></div>

        {/* Nested Playlist Menu */}
        <div
          className={`menu-item nested-trigger ${activeSubMenuId === song.id ? 'active' : ''}`}
          onMouseEnter={() => onSetSubMenu(song.id)}
        >
          <div className="item-content">
            <FolderPlus size={ICON_SIZES.XSMALL} />
            <span>{t('playlist.addToPlaylist')}</span>
          </div>
          <ChevronRight size={ICON_SIZES.TINY} />

          {activeSubMenuId === song.id && (
            <div className="nested-menu">
              {playlists.filter((p) => p.id !== '0' && p.id !== currentPlaylistId).length === 0 ? (
                <div className="menu-item disabled">{t('sidebar.noPlaylists')}</div>
              ) : (
                playlists
                  .filter((p) => p.id !== '0' && p.id !== currentPlaylistId)
                  .map((p) => (
                    <button
                      key={p.id}
                      className="menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylist(p.id);
                      }}
                    >
                      {p.name}
                    </button>
                  ))
              )}
            </div>
          )}
        </div>

        <div className="menu-divider"></div>
        <MenuAction
          icon={<Edit2 size={ICON_SIZES.XSMALL} />}
          label={t('common.edit')}
          onClick={onEdit}
        />
        <MenuAction
          icon={<Trash2 size={16} />}
          label={t('common.delete')}
          onClick={onDelete}
          className="delete"
        />
      </div>,
      document.body,
    );
};
