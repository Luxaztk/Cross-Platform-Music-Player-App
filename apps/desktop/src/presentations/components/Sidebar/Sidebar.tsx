import React from 'react';
import { EditModal } from '../EditModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import type { Playlist } from '@music/types';
import { type SidebarProps } from './types';
import { useSidebar } from './useSidebar';
import { LibrarySection } from './components/LibrarySection';
import { PlaylistSection } from './components/PlaylistSection';
import { SidebarMini } from './components/SidebarMini';
import './Sidebar.scss';

const Sidebar: React.FC<SidebarProps> = React.memo(({ isCollapsed, onToggle }) => {
    const {
        state,
        playlists,
        refs,
        actions,
        utils
    } = useSidebar();

    const { t, appIcon } = utils;

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Expanded View */}
            {!isCollapsed && (
                <nav className="sidebar-nav">
                    <LibrarySection
                        isVisible={true}
                        activeMenuId={state.activeMenuId}
                        menuPlacement={state.menuPlacement}
                        menuRef={refs.menuRef}
                        onToggleMenu={actions.toggleMenu}
                        onImportFiles={actions.onImportFiles}
                        onImportFolder={actions.onImportFolder}
                        onToggleSidebar={onToggle}
                        appIcon={appIcon}
                        t={t}
                    />

                    <PlaylistSection
                        isVisible={true}
                        playlists={playlists.sorted}
                        query={state.playlistQuery}
                        isSearchExpanded={state.isSearchExpanded}
                        isDebouncing={state.isDebouncing}
                        sortMode={state.sortMode}
                        isSortMenuOpen={state.isSortMenuOpen}
                        activeMenuId={state.activeMenuId}
                        menuPlacement={state.menuPlacement}
                        menuRef={refs.menuRef}
                        sortMenuRef={refs.sortMenuRef}
                        searchInputRef={refs.searchInputRef}
                        onQueryChange={actions.setPlaylistQuery}
                        onSearchToggle={actions.handleSearchToggle}
                        onSearchBlur={actions.handleSearchBlur}
                        onToggleSortMenu={actions.setIsSortMenuOpen}
                        onSortChange={(mode) => {
                            actions.setSortMode(mode);
                            actions.setIsSortMenuOpen(false);
                        }}
                        onCreatePlaylist={actions.onCreatePlaylist}
                        onToggleMenu={actions.toggleMenu}
                        onEditPlaylist={actions.onEditPlaylist}
                        onDeletePlaylist={actions.onDeletePlaylist}
                        appIcon={appIcon}
                        t={t}
                    />
                </nav>
            )}

            {/* Collapsed View */}
            <SidebarMini
                isVisible={isCollapsed}
                playlists={playlists.sorted}
                onToggle={onToggle}
                onCreatePlaylist={actions.onCreatePlaylist}
                appIcon={appIcon}
                t={t}
            />

            {/* Modals */}
            {state.editingPlaylist && (
                <EditModal
                    isOpen={true}
                    type="playlist"
                    data={state.editingPlaylist}
                    onClose={() => actions.setEditingPlaylist(null)}
                    onSave={async (updatedData: Partial<Playlist>) => {
                        await actions.handleUpdatePlaylist({ ...state.editingPlaylist!, ...updatedData });
                        actions.setEditingPlaylist(null);
                    }}
                />
            )}

            <DeleteConfirmationModal
                isOpen={!!state.deletingPlaylist}
                onClose={() => actions.setDeletingPlaylist(null)}
                onConfirm={actions.confirmDeletePlaylist}
                title={t('modal.deletePlaylistTitle')}
                message={t('modal.deletePlaylistQuestion')}
                itemName={state.deletingPlaylist?.name}
            />
        </aside>
    );
});

export default Sidebar;
