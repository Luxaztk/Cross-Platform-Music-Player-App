import React from 'react';
import ReactDOM from 'react-dom';
import { Play, PlaySquare, ListPlus, FolderPlus, ChevronRight, Edit2, Trash2, Keyboard, BookmarkCheck, Shield } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import type { Song, Playlist } from '@music/types';
import { useHotkeysModal } from '@application/context/HotkeysContext';

interface MenuActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  shortcut?: string;
}

const MenuAction: React.FC<MenuActionProps> = ({ icon, label, onClick, className, shortcut }) => (
  <button className={`menu-item ${className || ''}`} onClick={onClick}>
    <div className="item-content">
      {icon}
      <span>{label}</span>
    </div>
    {shortcut && <span className="menu-shortcut">{shortcut}</span>}
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
    onEditChapters?: () => void;
    onEditPermissions?: () => void;
    onDelete: () => void;
    onSetSubMenu: (id: string | null) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
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
    onEditChapters,
    onEditPermissions,
    onDelete,
    onSetSubMenu,
    t,
    menuRef
}) => {
    const { openHotkeysModal } = useHotkeysModal();

    if (!isVisible || !song) return null;

    const menuStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 'var(--z-dropdown)',
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
          shortcut="Enter"
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
          shortcut="F2"
        />
        {onEditChapters && (
          <MenuAction
            icon={<BookmarkCheck size={ICON_SIZES.XSMALL} />}
            label={t('chapters.editTitle') || 'Chỉnh sửa mốc bài hát'}
            onClick={onEditChapters}
          />
        )}
        {onEditPermissions && (
          <MenuAction
            icon={<Shield size={ICON_SIZES.XSMALL} />}
            label={t('settings.server.editPermissionsTitle') || 'Quyền chia sẻ máy chủ...'}
            onClick={onEditPermissions}
          />
        )}
        <MenuAction
          icon={<Trash2 size={16} />}
          label={t('common.delete')}
          onClick={onDelete}
          className="delete"
          shortcut="Del"
        />

        <div className="menu-divider"></div>
        <MenuAction
          icon={<Keyboard size={ICON_SIZES.XSMALL} />}
          label={t('common.viewShortcuts')}
          onClick={openHotkeysModal}
          shortcut="Ctrl+/"
        />
      </div>,
      document.body,
    );
};
