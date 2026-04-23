# `expo-audio` migration + background playback checklist

This is a focused checklist for moving the player from `expo-av` to **Expo’s new Audio API (`expo-audio`)** and delivering **background playback**.

## Phase 1 — Separate “player logic” from “playback engine”

- [x] **1.1 Create a `PlayerEngine` interface**
  - Required operations:
    - `load(uri, { shouldPlay })`
    - `play()`, `pause()`, `togglePlayPause()`
    - `seekTo(ms)`
    - `setVolume(0..1)`
    - `unload()`
    - progress: `subscribe(listener)` or `getStatus()` + polling
  - **AC**: `PlayerProvider` depends only on `PlayerEngine`, not on any Expo audio module directly.

- [x] **1.2 Create an engine implementation wrapper**
  - Start with `ExpoAudioEngine` (empty skeleton).
  - **AC**: App builds even if the engine methods throw “not implemented” (behind feature flags).

## Phase 2 — Switch to `expo-audio` (foreground playback)

- [x] **2.1 Install `expo-audio`**
  - Run: `npx expo install expo-audio`
  - **AC**: Module imports successfully.

- [x] **2.2 Implement core playback with `expo-audio`**
  - `load/play/pause/seek/volume/unload`
  - **AC**: Tap a song starts playing in foreground.

- [x] **2.3 Implement progress updates**
  - Prefer engine events if available; otherwise use polling while playing.
  - **AC**: Now Playing time + seek bar stay in sync.

- [x] **2.4 Remove `expo-av`**
  - Remove dependency from `apps/mobile/package.json` and delete AV-specific code paths.
  - **AC**: No `ExponentAV` imports remain anywhere.

## Phase 3 — Background playback (Android first, then iOS)

- [ ] **3.1 Configure audio for background**
  - Configure the app for background audio (platform-specific requirements).
  - **AC**: Audio continues after pressing Home.

- [ ] **3.2 Move off Expo Go if needed**
  - Create an EAS dev build (dev client) if Expo Go cannot support the needed background behavior.
  - **AC**: Same code runs inside the dev client with background playback working.

- [ ] **3.3 Handle interruptions**
  - Calls, route changes, Bluetooth/headphones changes.
  - **AC**: Playback pauses/resumes predictably; app doesn’t crash.

## Phase 4 — Lock screen / notification controls (recommended)

- [ ] **4.1 Add system controls**
  - **AC**: System play/pause/next controls work and reflect state.

## Phase 5 — QA + hardening

- [ ] **5.1 Regression tests**
  - Import → play → seek → next/prev → background → foreground.
  - **AC**: No state desync; UI matches audio.
