# Mobile UI Implementation Roadmap

This plan outlines the steps to bring the Melovista mobile app in line with the UI description provided in `docs/__MOBILE_ui_desc.md`. The goal is to achieve a modern, Spotify-like aesthetic with a consistent persistent layout and a full feature set for playlists and song management.

## User Review Required

> [!IMPORTANT]
> The roadmap assumes we want to move away from the default Expo Router tab headers in favor of a truly persistent, custom `TopBar` that can handle navigation and the sidebar menu globally.

> [!NOTE]
> The "Sidebar menu" is currently missing and will be a core part of Phase 1.

## Proposed Changes

### Phase 1: Core Layout & Global Components
Establish the persistent UI structure.

#### [NEW] [TopBar.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/components/TopBar.tsx)
- Create a persistent top bar component with:
  - Left: "Import songs" or "Go back" icon button.
  - Center: Dynamic page name.
  - Right: "Search" and "Sidebar menu" icon buttons.
- Handle responsive safe area insets.

#### [NEW] [SidebarMenu.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/components/SidebarMenu.tsx)
- Create an overlay sidebar component.
- Links to Home, Search, and Settings.
- Display app logo, name, and version.

#### [MODIFY] [_layout.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/_layout.tsx)
- Integrate `TopBar` and `SidebarMenu`.
- Manage `SidebarMenu` visibility state.
- Ensure proper layering (Sidebar over everything).

#### [MODIFY] [PlayerBar.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/player/PlayerBar.tsx)
- Move progress bar to the top edge.
- Set progress bar as non-seekable.
- Adjust layout: Cover -> Info (Title/Artist) -> Play/Pause -> Next.

---

### Phase 2: Home & Playlist Management
Focus on the library view and playlist interactions.

#### [MODIFY] [library.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/(tabs)/library.tsx)
- Implement "All songs" as a fixed first playlist.
- Ensure alphabetical sorting for other playlists.
- Update playlist row design (Cover | Name/Count | Actions).

#### [NEW] [PlaylistActions.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/components/PlaylistActions.tsx)
- Common bottom sheet or modal for playlist actions (Rename, Delete, Duplicate, Play Next, etc.).

---

### Phase 3: Playlist Details & Songs
Enhance the individual playlist view.

#### [MODIFY] [[id].tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/playlist/[id].tsx)
- Header with song count and total duration.
- Song list with sorting options.
- Song rows with cover, title, artist, duration, and action button.

#### [NEW] [SongActions.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/components/SongActions.tsx)
- Common modal for song actions (Edit metadata, Add to playlist, Play next, etc.).

---

### Phase 4: Now Playing & Queue
Polish the immersive playback experience.

#### [MODIFY] [now-playing.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/now-playing.tsx)
- Implement the custom top bar with downwards chevron.
- Add "Lyrics" and "Add to playlist" buttons.
- Refine layout (large cover image).

#### [MODIFY] [QueueModal.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/presentations/player/QueueModal.tsx)
- Implement swipe-up behavior to reveal full queue.
- Add "Clear queue" functionality.
- Implement drag-and-drop reordering for queue items.

---

### Phase 5: Search & Settings
Finalize secondary screens.

#### [MODIFY] [search.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/(tabs)/search.tsx)
- Add Filter & Sort bar.
- Ensure it uses the specific Search top bar configuration.

#### [MODIFY] [settings.tsx](file:///d:/MELOVISTA_DEV/apps/mobile/src/app/(tabs)/settings.tsx)
- Implement Theme and Language selectors.
- Ensure `PlayerBar` is hidden on this screen.

---

## Task checklist
# Mobile UI Overhaul Tasks

- [X] **Phase 1: Core Layout & Global Components**
    - [X] Create `TopBar.tsx` component
    - [X] Create `SidebarMenu.tsx` component
    - [X] Create `AppShellProvider` context (sidebar state + import handler)
    - [X] Update `_layout.tsx` to integrate `TopBar` and `SidebarMenu`
    - [X] Update `(tabs)/_layout.tsx` to hide default headers and tab bar
    - [X] Update `PlayerBar.tsx` layout and progress bar
    - [X] Add translation strings for new UI elements
    - [ ] Install `lucide-react-native` and replace existing icons to use Lucide icons
- [ ] **Phase 2: Home & Playlist Management**
    - [ ] Ensure "All songs" default playlist
    - [ ] Update `library.tsx` playlist row design
    - [ ] Create `PlaylistActions.tsx` modal
- [ ] **Phase 3: Playlist Details & Songs**
    - [ ] Update `[id].tsx` header and song list design
    - [ ] Create `SongActions.tsx` modal
- [ ] **Phase 4: Now Playing & Queue**
    - [ ] Refine `now-playing.tsx` layout
    - [ ] Implement swipe-up behavior in `QueueModal.tsx`
    - [ ] Add "Clear queue" and drag-and-drop to `QueueModal.tsx`
- [ ] **Phase 5: Search & Settings**
    - [ ] Update `search.tsx` with filter/sort bar
    - [ ] Implement Theme/Language selectors in `settings.tsx`
    - [ ] Hide `PlayerBar` on Settings screen


---

## Verification Plan

### Automated Tests
- N/A (Focus on manual visual verification for UI changes).

### Manual Verification
- Verify persistent `TopBar` and `PlayerBar` across all screens.
- Test `SidebarMenu` opening/closing and navigation.
- Verify "All songs" playlist behavior.
- Test `Now Playing` transition and Queue swipe-up.
- Check Safe Area compliance on devices with notches.
