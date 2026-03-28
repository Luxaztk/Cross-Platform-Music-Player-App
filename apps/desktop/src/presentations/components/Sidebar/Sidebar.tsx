import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Music, ListMusic, Plus, ChevronLeft, ChevronRight, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useLibrary } from '../../../application/hooks';
import { ICON_SIZES } from '../../constants/IconSizes';
import { useLanguage } from '../Language';
import { EditModal } from '../EditModal';
import './Sidebar.scss';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { playlists, handleCreatePlaylist, handleDeletePlaylist, handleUpdatePlaylist } = useLibrary();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [menuPlacement, setMenuPlacement] = React.useState<'top' | 'bottom'>('bottom');
  const [editingPlaylist, setEditingPlaylist] = React.useState<any | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const onCreatePlaylist = async () => {
    const nextNum = playlists.filter(p => p.id !== '0').length + 1;
    const playlistName = t('sidebar.createPlaylist') + ` #${nextNum}`;
    const newPlaylist = await handleCreatePlaylist(playlistName);
    if (newPlaylist) {
      navigate(`/playlist/${newPlaylist.id}`);
    }
  };

  const onEditPlaylist = (e: React.MouseEvent, playlist: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlaylist(playlist);
    setActiveMenuId(null);
  };

  const onDeletePlaylist = async (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this playlist?')) {
      const success = await handleDeletePlaylist(playlistId);
      if (success) {
        setActiveMenuId(null);
        // If we are currently on the deleted playlist page, navigate home
        if (window.location.hash.includes(`/playlist/${playlistId}`)) {
          navigate('/playlist/0');
        }
      }
    }
  };

  const toggleMenu = (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeMenuId === playlistId) {
      setActiveMenuId(null);
    } else {
      // Calculate placement
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 120; // Estimated height for edit/delete menu

      setMenuPlacement(spaceBelow < menuHeight ? 'top' : 'bottom');
      setActiveMenuId(playlistId);
    }
  };

  // Filter out library playlist (id=0) for the Playlists section
  const customPlaylists = playlists.filter(p => String(p.id) !== '0');

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {!isCollapsed && (
        <nav className="sidebar-nav">
          <div className="nav-section-library">
            <div className="library-header">
              <button className="sidebar-toggle-btn" onClick={onToggle} title={t('common.edit')}>
                <ChevronLeft size={ICON_SIZES.SMALL} />
              </button>
              <h3>{t('sidebar.yourLibrary')}</h3>
            </div>
            <ul>
              <li>
                <NavLink
                  to="/playlist/0"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${activeMenuId === '0' ? 'menu-open' : ''}`}
                >
                  <Music className="icon" size={ICON_SIZES.SMALL} />
                  <span className="text">{t('sidebar.allSongs')}</span>
                  <button className="more-btn" onClick={(e) => e.preventDefault()} title={t('header.settings')}>
                    <MoreVertical size={ICON_SIZES.TINY} />
                  </button>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="nav-section-playlists">
            <div className="section-header">
              <h3>{t('sidebar.playlists')}</h3>
              <button className="add-playlist-btn" title={t('sidebar.createPlaylist')} onClick={onCreatePlaylist}>
                <Plus size={ICON_SIZES.SMALL} />
              </button>
            </div>
            {customPlaylists.length === 0 ? (
              <div className="empty-playlists">
                <p>{t('sidebar.noPlaylists')}</p>
                <button className="create-first-btn" onClick={onCreatePlaylist}>{t('sidebar.createFirst')}</button>
              </div>
            ) : (
              <ul>
                {customPlaylists.map(playlist => (
                  <li key={playlist.id} className={activeMenuId === playlist.id ? 'menu-open' : ''}>
                    <NavLink
                      to={`/playlist/${playlist.id}`}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                      <ListMusic className="icon" size={ICON_SIZES.SMALL} />
                      <span className="text">{playlist.name}</span>
                      <div className="col-more">
                        <button
                          className={`more-btn ${activeMenuId === playlist.id ? 'active' : ''}`}
                          onClick={(e) => toggleMenu(e, playlist.id)}
                          title={t('header.settings')}
                        >
                          <MoreVertical size={ICON_SIZES.TINY} />
                        </button>

                        {activeMenuId === playlist.id && (
                          <div className={`more-menu ${menuPlacement === 'top' ? 'open-up' : 'open-down'}`} ref={menuRef}>
                            <button className="menu-item" onClick={(e) => onEditPlaylist(e, playlist)}>
                              <Edit2 size={14} />
                              <span>{t('common.edit')}</span>
                            </button>
                            <button className="menu-item delete" onClick={(e) => onDeletePlaylist(e, playlist.id)}>
                              <Trash2 size={14} />
                              <span>{t('common.delete')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      )}

      {isCollapsed && (
        <nav className="sidebar-nav mini">
          <button className="nav-item mini" onClick={onToggle} title={t('common.edit')}>
            <ChevronRight size={ICON_SIZES.MEDIUM} />
          </button>
          <NavLink to="/playlist/0" className="nav-item mini" title={t('sidebar.allSongs')}>
            <Music size={ICON_SIZES.MEDIUM} />
          </NavLink>
          <button className="nav-item mini accent" title={t('sidebar.createPlaylist')} onClick={onCreatePlaylist}>
            <Plus size={ICON_SIZES.MEDIUM} />
          </button>
        </nav>
      )}

      {editingPlaylist && (
        <EditModal
          isOpen={true}
          type="playlist"
          data={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSave={async (updatedData) => {
            await handleUpdatePlaylist({ ...editingPlaylist, ...updatedData });
            setEditingPlaylist(null);
          }}
        />
      )}
    </aside>
  );
};

export default Sidebar;
