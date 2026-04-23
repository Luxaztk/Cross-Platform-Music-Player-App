# Expo Mobile Roadmap (offline-only)

This roadmap is for building a **mobile version of the desktop app** using:

- **Expo (React Native)**
- **Offline-only**
- **Pick files via Document Picker**
- **Persist with AsyncStorage**
- **Play audio with Expo’s new Audio API (`expo-audio`)**
- **Background playback is required** (so plan for an EAS dev build / config work)

Use this file as a checklist. Each item has **acceptance criteria (AC)** so “done” is unambiguous.

---

## Epic A — Create Expo app + monorepo wiring

- [x] **A1: Create Expo app (TypeScript)**
  - **AC**: `npx expo start` boots on Android device/emulator.
  - **AC**: A simple “Hello Melovista Mobile” screen renders.

- [x] **A2: Monorepo wiring to reuse shared packages**
  - **AC**: App imports types from `@music/types` successfully (no TS path hacks in random places).
  - **AC**: `tsc` typechecks the mobile app.

- [x] **A3: Baseline tooling**
  - **AC**: ESLint runs for mobile code.
  - **AC**: Formatting is consistent (use prettier).

---

## Epic B — App shell parity (navigation + global providers)

- [x] **B1: Navigation skeleton**
  - Tabs or stack screens for: **Library**, **Playlists**, **Settings**
  - **AC**: You can navigate between screens; each screen has a placeholder header/title.

- [x] **B2: Theme system**
  - **AC**: Theme toggle changes colors across the whole app.
  - **AC**: Theme selection persists after restart.

- [x] **B3: Language/i18n system**
  - **AC**: Language toggle updates visible strings.
  - **AC**: Language selection persists after restart.

- [x] **B4: Global notifications**
  - **AC**: Any screen can trigger a toast/snackbar.

---

## Epic C — Data layer (AsyncStorage schema + adapters)

- [x] **C1: Storage schema + versioning**
  - Define keys (suggested):
    - `storageVersion`
    - `songsById`
    - `playlistsById`
    - `libraryPlaylist`
    - `playerState`
    - `recentSearches`
  - **AC**: On first boot, schema initializes cleanly.
  - **AC**: If `storageVersion` changes, a migration function runs (even if it’s a no-op initially).

- [x] **C2: Implement `MobileStorageAdapter`**
  - Reads/writes library, songs, playlists, playerState, recentSearches.
  - **AC**: Manual test proves save → kill app → reopen → data is still correct.

- [x] **C3: Implement `MobileLibraryRepository`**
  - Playlist CRUD, song CRUD (as needed), “get playlist detail” composition.
  - **AC**: Create/rename/delete playlist works and persists.

- [x] **C4: Hook/provider wiring**
  - **AC**: UI doesn’t call AsyncStorage directly; it goes through adapters/repositories.

---

## Epic D — Import audio (Document Picker → local library)

- [x] **D1: Import entry points**
  - **AC**: “Import” button opens Document Picker.
  - **AC**: Cancelling import does not error.

- [x] **D2: Copy files into app-controlled storage**
  - **Why**: external URIs can break; copying makes offline playback stable.
  - **AC**: After reboot, imported songs are still playable.

- [x] **D3: Create Song records (MVP metadata)**
  - Title from filename (strip extension, normalize whitespace).
  - Artist/album default placeholders.
  - **AC**: Imported songs appear in Library list with reasonable titles.

- [x] **D4: Duplicate handling (MVP)**
  - Dedupe strategy (pick one):
    - Destination path match
    - `(filename + size)` if available
  - **AC**: Importing the same file twice does not create duplicates (or prompts clearly).

- [x] **D5: Persist import results**
  - **AC**: Imported library persists after app restart.

---

## Epic E — Playback (`expo-audio`) + queue + persistence (+ background)

- [x] **E0: Engine abstraction (to keep UI stable while swapping engines)**
  - Define a `PlayerEngine` interface and keep `PlayerProvider`/UI independent from the underlying playback module.
  - **AC**: Player UI/Provider compiles and runs with a “no-op engine” or the current engine implementation.

- [x] **E1: Implement `expo-audio` engine (foreground playback first)**
  - load/unload, play/pause, seek, progress updates.
  - **AC**: Tap a song → it plays; pause works; seek works; progress updates.

- [x] **E2: Queue + history model**
  - Enqueue, next/prev, history list.
  - **AC**: Next/prev always picks a valid song and updates UI.

- [x] **E3: Player UI**
  - Player bar + “Now Playing” screen (recommended).
  - **AC**: UI stays in sync with progress/time.

- [x] **E4: Persist player state**
  - Save current song + queue; optionally last position.
  - **AC**: Reopen app → current song/queue restored.

- [ ] **E5: Background playback**
  - Configure app + audio mode for background playback (Android + iOS).
  - Likely requires an **EAS dev build** (Expo Go is often limiting for background behavior).
  - **AC**: Start a song → press Home → audio continues; return to app and UI stays in sync.

- [ ] **E6: Lock screen / notification controls (optional but recommended)**
  - **AC**: Play/pause/next controls available from system UI (where supported).

---

## Epic F — Core screens parity (MVP UX)

- [x] **F1: Library screen**
  - Sort A–Z.
  - **AC**: 200+ songs scroll smoothly.

- [x] **F2: Playlists list screen**
  - Create/rename/delete.
  - **AC**: All operations persist.

- [x] **F3: Playlist detail screen**
  - Add/remove songs to playlist.
  - Play from playlist.
  - **AC**: “Play playlist” uses playlist order (or a defined sort).

---

## Epic G — Search + recent searches

- [x] **G1: Global search screen**
    - Search songs by title/artist/album.
    - Search playlists by name.
    - **AC**: Fast filtering, instant results. quickly (no noticeable lag for 500 songs).

- [x] **G2: Recent searches**
    - **AC**: Recent searches show and persist; clear works.

---

## Epic H — Hardening + performance + builds

- [x] **H1: Missing-file handling**
  - **AC**: If an audio file is missing/unreadable, app shows a recoverable error and can remove the entry.

- [x] **H2: Performance pass**
  - **AC**: 1k songs list remains usable on mid-range Android.

- [x] **H3: EAS build setup**
  - **AC**: You can produce an installable preview build.

---

## Out of scope for MVP (explicitly postponed)

- Cover art extraction / full tag parsing
- Writing metadata back into user files
- Online download features
