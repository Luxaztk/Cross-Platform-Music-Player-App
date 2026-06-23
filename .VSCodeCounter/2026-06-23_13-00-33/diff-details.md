# Diff Details

Date : 2026-06-23 13:00:33

Directory k:\\cross-platform-music-player-app

Total : 101 files,  4142 codes, 134 comments, 841 blanks, all 5117 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [README.md](/README.md) | Markdown | 37 | 0 | 14 | 51 |
| [apps/desktop/electron/ipc/library.ts](/apps/desktop/electron/ipc/library.ts) | TypeScript | 16 | 3 | 3 | 22 |
| [apps/desktop/electron/main.ts](/apps/desktop/electron/main.ts) | TypeScript | 30 | 4 | 5 | 39 |
| [apps/desktop/electron/preload.ts](/apps/desktop/electron/preload.ts) | TypeScript | 8 | 0 | 0 | 8 |
| [apps/desktop/src/application/providers/DownloadProvider.tsx](/apps/desktop/src/application/providers/DownloadProvider.tsx) | TypeScript JSX | 14 | 0 | 3 | 17 |
| [apps/desktop/src/electron.d.ts](/apps/desktop/src/electron.d.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.scss](/apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.scss) | SCSS | 45 | 0 | 10 | 55 |
| [apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.tsx](/apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.tsx) | TypeScript JSX | 27 | 0 | 2 | 29 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/InputState.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/InputState.tsx) | TypeScript JSX | 3 | 0 | 0 | 3 |
| [apps/desktop/src/presentations/components/DownloaderModal/useDownloaderModal.ts](/apps/desktop/src/presentations/components/DownloaderModal/useDownloaderModal.ts) | TypeScript | 0 | 2 | 0 | 2 |
| [apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.tsx](/apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.tsx) | TypeScript JSX | -13 | 0 | -1 | -14 |
| [apps/desktop/src/presentations/components/Header/Header.scss](/apps/desktop/src/presentations/components/Header/Header.scss) | SCSS | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/Header/Header.tsx](/apps/desktop/src/presentations/components/Header/Header.tsx) | TypeScript JSX | -1 | 2 | 0 | 1 |
| [apps/desktop/src/presentations/components/Header/components/SearchInput.tsx](/apps/desktop/src/presentations/components/Header/components/SearchInput.tsx) | TypeScript JSX | -1 | 0 | 0 | -1 |
| [apps/desktop/src/presentations/components/Header/types.ts](/apps/desktop/src/presentations/components/Header/types.ts) | TypeScript | -1 | 0 | 0 | -1 |
| [apps/desktop/src/presentations/components/Header/useHeader.tsx](/apps/desktop/src/presentations/components/Header/useHeader.tsx) | TypeScript JSX | 16 | 0 | 3 | 19 |
| [apps/desktop/src/presentations/components/Language/LanguageProvider.tsx](/apps/desktop/src/presentations/components/Language/LanguageProvider.tsx) | TypeScript JSX | 6 | 0 | 1 | 7 |
| [apps/desktop/src/presentations/components/Library/LibraryProvider.tsx](/apps/desktop/src/presentations/components/Library/LibraryProvider.tsx) | TypeScript JSX | 36 | 2 | 6 | 44 |
| [apps/desktop/src/presentations/components/LyricsView/LyricsPanel.tsx](/apps/desktop/src/presentations/components/LyricsView/LyricsPanel.tsx) | TypeScript JSX | -3 | 0 | 0 | -3 |
| [apps/desktop/src/presentations/components/LyricsView/components/index.ts](/apps/desktop/src/presentations/components/LyricsView/components/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/desktop/src/presentations/components/PlayerBar/PlayerBar.tsx](/apps/desktop/src/presentations/components/PlayerBar/PlayerBar.tsx) | TypeScript JSX | -3 | 0 | 0 | -3 |
| [apps/desktop/src/presentations/components/PlayerBar/components/index.ts](/apps/desktop/src/presentations/components/PlayerBar/components/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.tsx) | TypeScript JSX | 4 | 0 | 1 | 5 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.scss](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.scss) | SCSS | 5 | 0 | 1 | 6 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.tsx) | TypeScript JSX | 11 | 0 | 0 | 11 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/VirtualSongList.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/VirtualSongList.tsx) | TypeScript JSX | 29 | 3 | 3 | 35 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistData.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistData.ts) | TypeScript | -10 | 0 | 1 | -9 |
| [apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.scss](/apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.scss) | SCSS | 202 | 0 | 33 | 235 |
| [apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.tsx](/apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.tsx) | TypeScript JSX | 59 | 0 | 3 | 62 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.tsx) | TypeScript JSX | 10 | 0 | 1 | 11 |
| [apps/desktop/src/tests/application/hooks/useClusteredSearch.test.ts](/apps/desktop/src/tests/application/hooks/useClusteredSearch.test.ts) | TypeScript | 72 | 2 | 19 | 93 |
| [apps/desktop/src/tests/application/hooks/useDebounce.test.ts](/apps/desktop/src/tests/application/hooks/useDebounce.test.ts) | TypeScript | 53 | 11 | 17 | 81 |
| [apps/desktop/src/tests/application/hooks/useGlobalHotkeys.test.ts](/apps/desktop/src/tests/application/hooks/useGlobalHotkeys.test.ts) | TypeScript | 194 | 5 | 52 | 251 |
| [apps/desktop/src/tests/application/hooks/useLocalFilter.test.ts](/apps/desktop/src/tests/application/hooks/useLocalFilter.test.ts) | TypeScript | 73 | 7 | 16 | 96 |
| [apps/desktop/src/tests/application/hooks/useRecentSearches.test.ts](/apps/desktop/src/tests/application/hooks/useRecentSearches.test.ts) | TypeScript | 167 | 3 | 55 | 225 |
| [apps/desktop/src/tests/application/hooks/useSearch.test.ts](/apps/desktop/src/tests/application/hooks/useSearch.test.ts) | TypeScript | 73 | 4 | 22 | 99 |
| [apps/desktop/src/tests/components/Header/SearchOverlay.test.tsx](/apps/desktop/src/tests/components/Header/SearchOverlay.test.tsx) | TypeScript JSX | -48 | -3 | -6 | -57 |
| [apps/desktop/src/tests/domain/PlaybackIterator.test.tsx](/apps/desktop/src/tests/domain/PlaybackIterator.test.tsx) | TypeScript JSX | 88 | 13 | 24 | 125 |
| [apps/desktop/src/tests/infrastructure/repositories/ElectronLibraryRepository.test.ts](/apps/desktop/src/tests/infrastructure/repositories/ElectronLibraryRepository.test.ts) | TypeScript | 209 | 2 | 40 | 251 |
| [apps/desktop/src/tests/infrastructure/services/ElectronStorageAdapter.test.ts](/apps/desktop/src/tests/infrastructure/services/ElectronStorageAdapter.test.ts) | TypeScript | 123 | 1 | 28 | 152 |
| [apps/desktop/src/tests/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.test.tsx](/apps/desktop/src/tests/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.test.tsx) | TypeScript JSX | 114 | -11 | 0 | 103 |
| [apps/desktop/src/tests/presentations/components/GlobalDragDrop/GlobalDragDrop.test.tsx](/apps/desktop/src/tests/presentations/components/GlobalDragDrop/GlobalDragDrop.test.tsx) | TypeScript JSX | 142 | 1 | 42 | 185 |
| [apps/desktop/src/tests/presentations/components/Header/SearchOverlay.test.tsx](/apps/desktop/src/tests/presentations/components/Header/SearchOverlay.test.tsx) | TypeScript JSX | 197 | 8 | 41 | 246 |
| [apps/desktop/src/tests/presentations/components/Layout/MainLayout.test.tsx](/apps/desktop/src/tests/presentations/components/Layout/MainLayout.test.tsx) | TypeScript JSX | 159 | 3 | 40 | 202 |
| [apps/desktop/src/tests/presentations/components/PlayerBar/PlayerBar.test.tsx](/apps/desktop/src/tests/presentations/components/PlayerBar/PlayerBar.test.tsx) | TypeScript JSX | 3 | 0 | 1 | 4 |
| [apps/desktop/src/tests/presentations/components/PlayerBar/QueuePanel.test.tsx](/apps/desktop/src/tests/presentations/components/PlayerBar/QueuePanel.test.tsx) | TypeScript JSX | 203 | 17 | 41 | 261 |
| [apps/desktop/src/tests/presentations/components/SongPickerModal/SongPickerModal.test.tsx](/apps/desktop/src/tests/presentations/components/SongPickerModal/SongPickerModal.test.tsx) | TypeScript JSX | 133 | 9 | 38 | 180 |
| [apps/desktop/src/tests/presentations/components/Theme/ThemeProvider.test.tsx](/apps/desktop/src/tests/presentations/components/Theme/ThemeProvider.test.tsx) | TypeScript JSX | 93 | 1 | 23 | 117 |
| [apps/desktop/src/tests/presentations/components/Tooltip/SmartTooltip.test.tsx](/apps/desktop/src/tests/presentations/components/Tooltip/SmartTooltip.test.tsx) | TypeScript JSX | 92 | 6 | 28 | 126 |
| [apps/desktop/src/tests/presentations/components/UpdateNotification/UpdateNotification.test.tsx](/apps/desktop/src/tests/presentations/components/UpdateNotification/UpdateNotification.test.tsx) | TypeScript JSX | 105 | 6 | 32 | 143 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AudioSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AudioSection.test.tsx) | TypeScript JSX | 88 | 3 | 22 | 113 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection/DownloadSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection/DownloadSection.test.tsx) | TypeScript JSX | 218 | 0 | 33 | 251 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.test.tsx) | TypeScript JSX | 247 | 3 | 41 | 291 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/GeneralSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/GeneralSection.test.tsx) | TypeScript JSX | 133 | -2 | 30 | 161 |
| [apps/desktop/src/vite-env.d.ts](/apps/desktop/src/vite-env.d.ts) | TypeScript | 2 | 0 | -1 | 1 |
| [apps/desktop/vite.config.ts](/apps/desktop/vite.config.ts) | TypeScript | 8 | 0 | 0 | 8 |
| [apps/mobile/src/app/(tabs)/playlists.tsx](/apps/mobile/src/app/(tabs)/playlists.tsx) | TypeScript JSX | -11 | 0 | 3 | -8 |
| [apps/mobile/src/app/now-playing.tsx](/apps/mobile/src/app/now-playing.tsx) | TypeScript JSX | 36 | 1 | 2 | 39 |
| [apps/mobile/src/app/playlist/[id].tsx](/apps/mobile/src/app/playlist/%5Bid%5D.tsx) | TypeScript JSX | -16 | 13 | -1 | -4 |
| [apps/mobile/src/application/library/LibraryProvider.tsx](/apps/mobile/src/application/library/LibraryProvider.tsx) | TypeScript JSX | 28 | 0 | 4 | 32 |
| [apps/mobile/src/application/player/PlayerProvider.tsx](/apps/mobile/src/application/player/PlayerProvider.tsx) | TypeScript JSX | 8 | 0 | 1 | 9 |
| [apps/mobile/src/presentations/components/PlaylistActions.tsx](/apps/mobile/src/presentations/components/PlaylistActions.tsx) | TypeScript JSX | 71 | 2 | 5 | 78 |
| [apps/mobile/src/presentations/components/PlaylistRow.tsx](/apps/mobile/src/presentations/components/PlaylistRow.tsx) | TypeScript JSX | 6 | 0 | 0 | 6 |
| [apps/mobile/src/presentations/components/SongActions.tsx](/apps/mobile/src/presentations/components/SongActions.tsx) | TypeScript JSX | 224 | 7 | 17 | 248 |
| [apps/mobile/src/presentations/components/TopBar.tsx](/apps/mobile/src/presentations/components/TopBar.tsx) | TypeScript JSX | 1 | 0 | 1 | 2 |
| [apps/mobile/src/presentations/player/PlayerBar.tsx](/apps/mobile/src/presentations/player/PlayerBar.tsx) | TypeScript JSX | -1 | 1 | 0 | 0 |
| [apps/mobile/src/presentations/player/QueueModal.tsx](/apps/mobile/src/presentations/player/QueueModal.tsx) | TypeScript JSX | 25 | 3 | 2 | 30 |
| [docs/Bao_Cao_MVP_Draft.md](/docs/Bao_Cao_MVP_Draft.md) | Markdown | -54 | 0 | -20 | -74 |
| [docs/__DESKTOP_Bao_Cao_BTL_MeloVista.md](/docs/__DESKTOP_Bao_Cao_BTL_MeloVista.md) | Markdown | -53 | 0 | -20 | -73 |
| [docs/__DESKTOP_architecture_report.md](/docs/__DESKTOP_architecture_report.md) | Markdown | -52 | 0 | -15 | -67 |
| [docs/__MOBILE_audio_improv_plan.md](/docs/__MOBILE_audio_improv_plan.md) | Markdown | -45 | 0 | -18 | -63 |
| [docs/__MOBILE_playback_modes.md](/docs/__MOBILE_playback_modes.md) | Markdown | -28 | 0 | -6 | -34 |
| [docs/__MOBILE_roadmap.md](/docs/__MOBILE_roadmap.md) | Markdown | -128 | 0 | -54 | -182 |
| [docs/__MOBILE_storage_schema.md](/docs/__MOBILE_storage_schema.md) | Markdown | -67 | 0 | -34 | -101 |
| [docs/__MOBILE_ui_desc.md](/docs/__MOBILE_ui_desc.md) | Markdown | -135 | 0 | -21 | -156 |
| [docs/____ROADMAP.md](/docs/____ROADMAP.md) | Markdown | 13 | 0 | 3 | 16 |
| [docs/desktop/_DESKTOP_analysis.md](/docs/desktop/_DESKTOP_analysis.md) | Markdown | 33 | 0 | 11 | 44 |
| [docs/desktop/__DESKTOP_Bao_Cao_BTL_MeloVista.md](/docs/desktop/__DESKTOP_Bao_Cao_BTL_MeloVista.md) | Markdown | 53 | 0 | 20 | 73 |
| [docs/desktop/__DESKTOP_architecture_report.md](/docs/desktop/__DESKTOP_architecture_report.md) | Markdown | 52 | 0 | 15 | 67 |
| [docs/mobile/__MOBILE_UI_implementation_plan.md](/docs/mobile/__MOBILE_UI_implementation_plan.md) | Markdown | 106 | 0 | 35 | 141 |
| [docs/mobile/__MOBILE_audio_improv_plan.md](/docs/mobile/__MOBILE_audio_improv_plan.md) | Markdown | 45 | 0 | 18 | 63 |
| [docs/mobile/__MOBILE_playback_modes.md](/docs/mobile/__MOBILE_playback_modes.md) | Markdown | 28 | 0 | 6 | 34 |
| [docs/mobile/__MOBILE_roadmap.md](/docs/mobile/__MOBILE_roadmap.md) | Markdown | 128 | 0 | 54 | 182 |
| [docs/mobile/__MOBILE_storage_schema.md](/docs/mobile/__MOBILE_storage_schema.md) | Markdown | 67 | 0 | 34 | 101 |
| [docs/mobile/__MOBILE_ui_desc.md](/docs/mobile/__MOBILE_ui_desc.md) | Markdown | 145 | 0 | 21 | 166 |
| [packages/brand/dev-avt/index.ts](/packages/brand/dev-avt/index.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [packages/core/src/services/LibraryService.ts](/packages/core/src/services/LibraryService.ts) | TypeScript | 15 | 0 | 2 | 17 |
| [packages/core/src/services/__tests__/LibraryService.test.ts](/packages/core/src/services/__tests__/LibraryService.test.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [packages/hooks/src/providers/LibraryProvider.tsx](/packages/hooks/src/providers/LibraryProvider.tsx) | TypeScript JSX | 18 | 0 | 0 | 18 |
| [packages/hooks/src/providers/PlayerProvider.tsx](/packages/hooks/src/providers/PlayerProvider.tsx) | TypeScript JSX | 11 | 3 | 1 | 15 |
| [packages/hooks/src/types/library.ts](/packages/hooks/src/types/library.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [packages/i18n/package.json](/packages/i18n/package.json) | JSON | 4 | 0 | 0 | 4 |
| [packages/i18n/src/desktop.ts](/packages/i18n/src/desktop.ts) | TypeScript | 30 | 0 | 0 | 30 |
| [packages/i18n/src/mobile.ts](/packages/i18n/src/mobile.ts) | TypeScript | 33 | 0 | 3 | 36 |
| [packages/player/src/AudioEngine.ts](/packages/player/src/AudioEngine.ts) | TypeScript | 19 | 2 | 3 | 24 |
| [packages/types/package.json](/packages/types/package.json) | JSON | 4 | 0 | 0 | 4 |
| [packages/types/src/index.ts](/packages/types/src/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [packages/ui/package.json](/packages/ui/package.json) | JSON | 4 | 0 | 0 | 4 |
| [scripts/check-i18n-keys.js](/scripts/check-i18n-keys.js) | JavaScript | 23 | -3 | 0 | 20 |
| [tsconfig.json](/tsconfig.json) | JSON with Comments | 2 | 0 | 0 | 2 |
| [vitest.config.ts](/vitest.config.ts) | TypeScript | 15 | 0 | 2 | 17 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details