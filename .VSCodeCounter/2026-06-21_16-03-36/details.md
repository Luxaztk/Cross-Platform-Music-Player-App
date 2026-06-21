# Details

Date : 2026-06-21 16:03:36

Directory k:\\cross-platform-music-player-app

Total : 455 files,  57558 codes, 696 comments, 5399 blanks, all 63653 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.github/ISSUE_TEMPLATE/bug_report.md](/.github/ISSUE_TEMPLATE/bug_report.md) | Markdown | 10 | 0 | 3 | 13 |
| [.github/ISSUE_TEMPLATE/feature_request.md](/.github/ISSUE_TEMPLATE/feature_request.md) | Markdown | 11 | 0 | 6 | 17 |
| [.github/workflows/ci.yml](/.github/workflows/ci.yml) | YAML | 23 | 2 | 7 | 32 |
| [.prettierignore](/.prettierignore) | Ignore | 4 | 0 | 0 | 4 |
| [.prettierrc](/.prettierrc) | JSON | 19 | 0 | 0 | 19 |
| [README.md](/README.md) | Markdown | 27 | 0 | 12 | 39 |
| [apps/desktop/README.md](/apps/desktop/README.md) | Markdown | 61 | 0 | 15 | 76 |
| [apps/desktop/electron/infrastructure/FileTraceLogger.ts](/apps/desktop/electron/infrastructure/FileTraceLogger.ts) | TypeScript | 17 | 0 | 5 | 22 |
| [apps/desktop/electron/infrastructure/MainMetadataService.ts](/apps/desktop/electron/infrastructure/MainMetadataService.ts) | TypeScript | 247 | 15 | 36 | 298 |
| [apps/desktop/electron/infrastructure/MainStorageAdapter.ts](/apps/desktop/electron/infrastructure/MainStorageAdapter.ts) | TypeScript | 129 | 2 | 27 | 158 |
| [apps/desktop/electron/infrastructure/SyncHistoryService.ts](/apps/desktop/electron/infrastructure/SyncHistoryService.ts) | TypeScript | 38 | 2 | 9 | 49 |
| [apps/desktop/electron/ipc/dialog.ts](/apps/desktop/electron/ipc/dialog.ts) | TypeScript | 16 | 0 | 6 | 22 |
| [apps/desktop/electron/ipc/downloader.ts](/apps/desktop/electron/ipc/downloader.ts) | TypeScript | 117 | 3 | 23 | 143 |
| [apps/desktop/electron/ipc/library.ts](/apps/desktop/electron/ipc/library.ts) | TypeScript | 482 | 33 | 95 | 610 |
| [apps/desktop/electron/ipc/storage.ts](/apps/desktop/electron/ipc/storage.ts) | TypeScript | 54 | 0 | 17 | 71 |
| [apps/desktop/electron/main.ts](/apps/desktop/electron/main.ts) | TypeScript | 292 | 26 | 61 | 379 |
| [apps/desktop/electron/modules/auth/YouTubeAuthService.ts](/apps/desktop/electron/modules/auth/YouTubeAuthService.ts) | TypeScript | 82 | 3 | 18 | 103 |
| [apps/desktop/electron/modules/downloader/YoutubeDownloader.ts](/apps/desktop/electron/modules/downloader/YoutubeDownloader.ts) | TypeScript | 290 | 0 | 56 | 346 |
| [apps/desktop/electron/modules/downloader/__tests__/YoutubeDownloader.test.ts](/apps/desktop/electron/modules/downloader/__tests__/YoutubeDownloader.test.ts) | TypeScript | 87 | 9 | 27 | 123 |
| [apps/desktop/electron/modules/downloader/__tests__/YoutubeDownloaderPath.test.ts](/apps/desktop/electron/modules/downloader/__tests__/YoutubeDownloaderPath.test.ts) | TypeScript | 87 | 4 | 27 | 118 |
| [apps/desktop/electron/modules/lyrics/LyricsManager.ts](/apps/desktop/electron/modules/lyrics/LyricsManager.ts) | TypeScript | 122 | 1 | 18 | 141 |
| [apps/desktop/electron/modules/metadata/MetadataManager.ts](/apps/desktop/electron/modules/metadata/MetadataManager.ts) | TypeScript | 156 | 4 | 29 | 189 |
| [apps/desktop/electron/modules/metadata/__tests__/MetadataManager.test.ts](/apps/desktop/electron/modules/metadata/__tests__/MetadataManager.test.ts) | TypeScript | 56 | 8 | 19 | 83 |
| [apps/desktop/electron/preload.ts](/apps/desktop/electron/preload.ts) | TypeScript | 207 | 7 | 11 | 225 |
| [apps/desktop/electron/utils/ffmpegPath.ts](/apps/desktop/electron/utils/ffmpegPath.ts) | TypeScript | 15 | 1 | 4 | 20 |
| [apps/desktop/electron/utils/fileState.ts](/apps/desktop/electron/utils/fileState.ts) | TypeScript | 39 | 9 | 9 | 57 |
| [apps/desktop/electron/workers/metadata.worker.ts](/apps/desktop/electron/workers/metadata.worker.ts) | TypeScript | 183 | 7 | 23 | 213 |
| [apps/desktop/eslint.config.js](/apps/desktop/eslint.config.js) | JavaScript | 26 | 0 | 2 | 28 |
| [apps/desktop/index.html](/apps/desktop/index.html) | HTML | 13 | 0 | 4 | 17 |
| [apps/desktop/package.json](/apps/desktop/package.json) | JSON | 114 | 0 | 1 | 115 |
| [apps/desktop/public/favicon.svg](/apps/desktop/public/favicon.svg) | XML | 1 | 0 | 0 | 1 |
| [apps/desktop/public/icons.svg](/apps/desktop/public/icons.svg) | XML | 24 | 0 | 1 | 25 |
| [apps/desktop/src/App.css](/apps/desktop/src/App.css) | CSS | 0 | 0 | 1 | 1 |
| [apps/desktop/src/App.scss](/apps/desktop/src/App.scss) | SCSS | 5 | 0 | 1 | 6 |
| [apps/desktop/src/App.tsx](/apps/desktop/src/App.tsx) | TypeScript JSX | 22 | 0 | 3 | 25 |
| [apps/desktop/src/application/context/HotkeysContext.ts](/apps/desktop/src/application/context/HotkeysContext.ts) | TypeScript | 12 | 0 | 4 | 16 |
| [apps/desktop/src/application/context/HotkeysProvider.tsx](/apps/desktop/src/application/context/HotkeysProvider.tsx) | TypeScript JSX | 14 | 0 | 2 | 16 |
| [apps/desktop/src/application/hooks/DownloadContext.ts](/apps/desktop/src/application/hooks/DownloadContext.ts) | TypeScript | 37 | 4 | 10 | 51 |
| [apps/desktop/src/application/hooks/SettingsContext.ts](/apps/desktop/src/application/hooks/SettingsContext.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [apps/desktop/src/application/hooks/index.ts](/apps/desktop/src/application/hooks/index.ts) | TypeScript | 14 | 0 | 1 | 15 |
| [apps/desktop/src/application/hooks/useClusteredSearch.ts](/apps/desktop/src/application/hooks/useClusteredSearch.ts) | TypeScript | 40 | 2 | 7 | 49 |
| [apps/desktop/src/application/hooks/useDebounce.ts](/apps/desktop/src/application/hooks/useDebounce.ts) | TypeScript | 22 | 1 | 6 | 29 |
| [apps/desktop/src/application/hooks/useDownload.ts](/apps/desktop/src/application/hooks/useDownload.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [apps/desktop/src/application/hooks/useGlobalHotkeys.ts](/apps/desktop/src/application/hooks/useGlobalHotkeys.ts) | TypeScript | 182 | 2 | 22 | 206 |
| [apps/desktop/src/application/hooks/useLanguage.ts](/apps/desktop/src/application/hooks/useLanguage.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [apps/desktop/src/application/hooks/useLibrary.ts](/apps/desktop/src/application/hooks/useLibrary.ts) | TypeScript | 4 | 0 | 3 | 7 |
| [apps/desktop/src/application/hooks/useLocalFilter.ts](/apps/desktop/src/application/hooks/useLocalFilter.ts) | TypeScript | 70 | 4 | 15 | 89 |
| [apps/desktop/src/application/hooks/useNotification.ts](/apps/desktop/src/application/hooks/useNotification.ts) | TypeScript | 22 | 0 | 6 | 28 |
| [apps/desktop/src/application/hooks/useRecentSearches.ts](/apps/desktop/src/application/hooks/useRecentSearches.ts) | TypeScript | 60 | 5 | 13 | 78 |
| [apps/desktop/src/application/hooks/useSearch.ts](/apps/desktop/src/application/hooks/useSearch.ts) | TypeScript | 108 | 9 | 15 | 132 |
| [apps/desktop/src/application/hooks/useSettings.ts](/apps/desktop/src/application/hooks/useSettings.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [apps/desktop/src/application/hooks/useTheme.ts](/apps/desktop/src/application/hooks/useTheme.ts) | TypeScript | 7 | 0 | 2 | 9 |
| [apps/desktop/src/application/providers/DownloadProvider.tsx](/apps/desktop/src/application/providers/DownloadProvider.tsx) | TypeScript JSX | 296 | 6 | 45 | 347 |
| [apps/desktop/src/application/providers/PlayerWithLibrary.tsx](/apps/desktop/src/application/providers/PlayerWithLibrary.tsx) | TypeScript JSX | 21 | 0 | 4 | 25 |
| [apps/desktop/src/application/providers/SettingsProvider.tsx](/apps/desktop/src/application/providers/SettingsProvider.tsx) | TypeScript JSX | 55 | 0 | 10 | 65 |
| [apps/desktop/src/application/providers/index.ts](/apps/desktop/src/application/providers/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/application/utils/index.ts](/apps/desktop/src/application/utils/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/application/utils/searchUtils.ts](/apps/desktop/src/application/utils/searchUtils.ts) | TypeScript | 74 | 5 | 16 | 95 |
| [apps/desktop/src/electron.d.ts](/apps/desktop/src/electron.d.ts) | TypeScript | 108 | 4 | 7 | 119 |
| [apps/desktop/src/infrastructure/repositories/ElectronLibraryRepository.ts](/apps/desktop/src/infrastructure/repositories/ElectronLibraryRepository.ts) | TypeScript | 107 | 4 | 29 | 140 |
| [apps/desktop/src/infrastructure/repositories/index.ts](/apps/desktop/src/infrastructure/repositories/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/infrastructure/services/ElectronStorageAdapter.ts](/apps/desktop/src/infrastructure/services/ElectronStorageAdapter.ts) | TypeScript | 53 | 0 | 18 | 71 |
| [apps/desktop/src/infrastructure/services/index.ts](/apps/desktop/src/infrastructure/services/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/main.tsx](/apps/desktop/src/main.tsx) | TypeScript JSX | 43 | 1 | 3 | 47 |
| [apps/desktop/src/presentations/components/CleanupResolutionModal/CleanupResolutionModal.scss](/apps/desktop/src/presentations/components/CleanupResolutionModal/CleanupResolutionModal.scss) | SCSS | 215 | 2 | 34 | 251 |
| [apps/desktop/src/presentations/components/CleanupResolutionModal/CleanupResolutionModal.tsx](/apps/desktop/src/presentations/components/CleanupResolutionModal/CleanupResolutionModal.tsx) | TypeScript JSX | 89 | 0 | 8 | 97 |
| [apps/desktop/src/presentations/components/CleanupResolutionModal/index.ts](/apps/desktop/src/presentations/components/CleanupResolutionModal/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/CleanupResolutionModal/useCleanupResolution.ts](/apps/desktop/src/presentations/components/CleanupResolutionModal/useCleanupResolution.ts) | TypeScript | 50 | 0 | 6 | 56 |
| [apps/desktop/src/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.scss](/apps/desktop/src/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.scss) | SCSS | 150 | 0 | 22 | 172 |
| [apps/desktop/src/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.tsx](/apps/desktop/src/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.tsx) | TypeScript JSX | 77 | 0 | 8 | 85 |
| [apps/desktop/src/presentations/components/DeleteConfirmationModal/index.ts](/apps/desktop/src/presentations/components/DeleteConfirmationModal/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.scss](/apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.scss) | SCSS | 430 | 0 | 66 | 496 |
| [apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.tsx](/apps/desktop/src/presentations/components/DownloaderModal/DownloaderModal.tsx) | TypeScript JSX | 143 | 0 | 18 | 161 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/AuthState.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/AuthState.tsx) | TypeScript JSX | 15 | 0 | 3 | 18 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/DownloaderFooter.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/DownloaderFooter.tsx) | TypeScript JSX | 113 | 0 | 7 | 120 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/InputState.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/InputState.tsx) | TypeScript JSX | 57 | 0 | 3 | 60 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/LoadingState.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/LoadingState.tsx) | TypeScript JSX | 14 | 0 | 3 | 17 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/PreviewList.tsx](/apps/desktop/src/presentations/components/DownloaderModal/components/PreviewList.tsx) | TypeScript JSX | 43 | 0 | 6 | 49 |
| [apps/desktop/src/presentations/components/DownloaderModal/components/index.ts](/apps/desktop/src/presentations/components/DownloaderModal/components/index.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [apps/desktop/src/presentations/components/DownloaderModal/index.ts](/apps/desktop/src/presentations/components/DownloaderModal/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/DownloaderModal/useDownloaderModal.ts](/apps/desktop/src/presentations/components/DownloaderModal/useDownloaderModal.ts) | TypeScript | 84 | 3 | 13 | 100 |
| [apps/desktop/src/presentations/components/DownloaderUI/DownloadPreviewCard.scss](/apps/desktop/src/presentations/components/DownloaderUI/DownloadPreviewCard.scss) | SCSS | 282 | 0 | 43 | 325 |
| [apps/desktop/src/presentations/components/DownloaderUI/DownloadPreviewCard.tsx](/apps/desktop/src/presentations/components/DownloaderUI/DownloadPreviewCard.tsx) | TypeScript JSX | 79 | 0 | 8 | 87 |
| [apps/desktop/src/presentations/components/DownloaderUI/DownloadProgressBar.tsx](/apps/desktop/src/presentations/components/DownloaderUI/DownloadProgressBar.tsx) | TypeScript JSX | 25 | 0 | 2 | 27 |
| [apps/desktop/src/presentations/components/DownloaderUI/DuplicateWarningBanner.tsx](/apps/desktop/src/presentations/components/DownloaderUI/DuplicateWarningBanner.tsx) | TypeScript JSX | 27 | 0 | 4 | 31 |
| [apps/desktop/src/presentations/components/DownloaderUI/index.ts](/apps/desktop/src/presentations/components/DownloaderUI/index.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [apps/desktop/src/presentations/components/Dropdown/CustomDropdown.scss](/apps/desktop/src/presentations/components/Dropdown/CustomDropdown.scss) | SCSS | 116 | 0 | 19 | 135 |
| [apps/desktop/src/presentations/components/Dropdown/CustomDropdown.tsx](/apps/desktop/src/presentations/components/Dropdown/CustomDropdown.tsx) | TypeScript JSX | 135 | 0 | 17 | 152 |
| [apps/desktop/src/presentations/components/Dropdown/index.ts](/apps/desktop/src/presentations/components/Dropdown/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.scss](/apps/desktop/src/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.scss) | SCSS | 146 | 0 | 22 | 168 |
| [apps/desktop/src/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.tsx](/apps/desktop/src/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.tsx) | TypeScript JSX | 73 | 0 | 8 | 81 |
| [apps/desktop/src/presentations/components/DuplicateResolutionModal/index.ts](/apps/desktop/src/presentations/components/DuplicateResolutionModal/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/DuplicateResolutionModal/useDuplicateResolution.ts](/apps/desktop/src/presentations/components/DuplicateResolutionModal/useDuplicateResolution.ts) | TypeScript | 51 | 0 | 6 | 57 |
| [apps/desktop/src/presentations/components/EditModal/EditModal.scss](/apps/desktop/src/presentations/components/EditModal/EditModal.scss) | SCSS | 194 | 0 | 29 | 223 |
| [apps/desktop/src/presentations/components/EditModal/EditModal.tsx](/apps/desktop/src/presentations/components/EditModal/EditModal.tsx) | TypeScript JSX | 132 | 0 | 11 | 143 |
| [apps/desktop/src/presentations/components/EditModal/index.ts](/apps/desktop/src/presentations/components/EditModal/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/EditModal/useEditModal.ts](/apps/desktop/src/presentations/components/EditModal/useEditModal.ts) | TypeScript | 116 | 3 | 11 | 130 |
| [apps/desktop/src/presentations/components/ErrorBoundary/ErrorBoundary.tsx](/apps/desktop/src/presentations/components/ErrorBoundary/ErrorBoundary.tsx) | TypeScript JSX | 64 | 1 | 9 | 74 |
| [apps/desktop/src/presentations/components/ErrorBoundary/index.ts](/apps/desktop/src/presentations/components/ErrorBoundary/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.scss](/apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.scss) | SCSS | 73 | 0 | 8 | 81 |
| [apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.tsx](/apps/desktop/src/presentations/components/GlobalDragDrop/GlobalDragDrop.tsx) | TypeScript JSX | 123 | 7 | 19 | 149 |
| [apps/desktop/src/presentations/components/GlobalDragDrop/index.ts](/apps/desktop/src/presentations/components/GlobalDragDrop/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/Header/Header.scss](/apps/desktop/src/presentations/components/Header/Header.scss) | SCSS | 266 | 0 | 33 | 299 |
| [apps/desktop/src/presentations/components/Header/Header.tsx](/apps/desktop/src/presentations/components/Header/Header.tsx) | TypeScript JSX | 81 | 0 | 9 | 90 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/SearchOverlay.scss](/apps/desktop/src/presentations/components/Header/SearchOverlay/SearchOverlay.scss) | SCSS | 334 | 0 | 49 | 383 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/SearchOverlay.tsx](/apps/desktop/src/presentations/components/Header/SearchOverlay/SearchOverlay.tsx) | TypeScript JSX | 197 | 0 | 13 | 210 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/components/RecentSearches.tsx](/apps/desktop/src/presentations/components/Header/SearchOverlay/components/RecentSearches.tsx) | TypeScript JSX | 72 | 0 | 3 | 75 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/components/SongResultItem.tsx](/apps/desktop/src/presentations/components/Header/SearchOverlay/components/SongResultItem.tsx) | TypeScript JSX | 106 | 0 | 9 | 115 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/index.ts](/apps/desktop/src/presentations/components/Header/SearchOverlay/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/types.ts](/apps/desktop/src/presentations/components/Header/SearchOverlay/types.ts) | TypeScript | 45 | 0 | 5 | 50 |
| [apps/desktop/src/presentations/components/Header/SearchOverlay/useSearchOverlay.ts](/apps/desktop/src/presentations/components/Header/SearchOverlay/useSearchOverlay.ts) | TypeScript | 92 | 2 | 11 | 105 |
| [apps/desktop/src/presentations/components/Header/components/ProfileMenu.tsx](/apps/desktop/src/presentations/components/Header/components/ProfileMenu.tsx) | TypeScript JSX | 92 | 0 | 3 | 95 |
| [apps/desktop/src/presentations/components/Header/components/SearchInput.tsx](/apps/desktop/src/presentations/components/Header/components/SearchInput.tsx) | TypeScript JSX | 34 | 0 | 3 | 37 |
| [apps/desktop/src/presentations/components/Header/index.ts](/apps/desktop/src/presentations/components/Header/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/Header/types.ts](/apps/desktop/src/presentations/components/Header/types.ts) | TypeScript | 79 | 0 | 6 | 85 |
| [apps/desktop/src/presentations/components/Header/useHeader.tsx](/apps/desktop/src/presentations/components/Header/useHeader.tsx) | TypeScript JSX | 303 | 3 | 20 | 326 |
| [apps/desktop/src/presentations/components/HotkeysModal/HotkeysModal.scss](/apps/desktop/src/presentations/components/HotkeysModal/HotkeysModal.scss) | SCSS | 216 | 0 | 28 | 244 |
| [apps/desktop/src/presentations/components/HotkeysModal/HotkeysModal.tsx](/apps/desktop/src/presentations/components/HotkeysModal/HotkeysModal.tsx) | TypeScript JSX | 120 | 3 | 8 | 131 |
| [apps/desktop/src/presentations/components/HotkeysModal/index.ts](/apps/desktop/src/presentations/components/HotkeysModal/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/Language/LanguageContext.ts](/apps/desktop/src/presentations/components/Language/LanguageContext.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [apps/desktop/src/presentations/components/Language/LanguageProvider.tsx](/apps/desktop/src/presentations/components/Language/LanguageProvider.tsx) | TypeScript JSX | 37 | 1 | 8 | 46 |
| [apps/desktop/src/presentations/components/Language/index.ts](/apps/desktop/src/presentations/components/Language/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/presentations/components/Layout/MainLayout.scss](/apps/desktop/src/presentations/components/Layout/MainLayout.scss) | SCSS | 41 | 2 | 6 | 49 |
| [apps/desktop/src/presentations/components/Layout/MainLayout.tsx](/apps/desktop/src/presentations/components/Layout/MainLayout.tsx) | TypeScript JSX | 54 | 2 | 10 | 66 |
| [apps/desktop/src/presentations/components/Layout/index.ts](/apps/desktop/src/presentations/components/Layout/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/Library/LibraryProvider.tsx](/apps/desktop/src/presentations/components/Library/LibraryProvider.tsx) | TypeScript JSX | 107 | 1 | 16 | 124 |
| [apps/desktop/src/presentations/components/Library/SyncHistoryModal.scss](/apps/desktop/src/presentations/components/Library/SyncHistoryModal.scss) | SCSS | 243 | 0 | 38 | 281 |
| [apps/desktop/src/presentations/components/Library/SyncHistoryModal.tsx](/apps/desktop/src/presentations/components/Library/SyncHistoryModal.tsx) | TypeScript JSX | 122 | 1 | 12 | 135 |
| [apps/desktop/src/presentations/components/Library/index.ts](/apps/desktop/src/presentations/components/Library/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/presentations/components/LyricsView/LyricsPanel.scss](/apps/desktop/src/presentations/components/LyricsView/LyricsPanel.scss) | SCSS | 467 | 1 | 66 | 534 |
| [apps/desktop/src/presentations/components/LyricsView/LyricsPanel.tsx](/apps/desktop/src/presentations/components/LyricsView/LyricsPanel.tsx) | TypeScript JSX | 77 | 0 | 7 | 84 |
| [apps/desktop/src/presentations/components/LyricsView/components/EmptyLyrics.tsx](/apps/desktop/src/presentations/components/LyricsView/components/EmptyLyrics.tsx) | TypeScript JSX | 31 | 0 | 4 | 35 |
| [apps/desktop/src/presentations/components/LyricsView/components/LyricsContent.tsx](/apps/desktop/src/presentations/components/LyricsView/components/LyricsContent.tsx) | TypeScript JSX | 36 | 0 | 2 | 38 |
| [apps/desktop/src/presentations/components/LyricsView/components/LyricsHeader.tsx](/apps/desktop/src/presentations/components/LyricsView/components/LyricsHeader.tsx) | TypeScript JSX | 50 | 0 | 4 | 54 |
| [apps/desktop/src/presentations/components/LyricsView/components/LyricsSearch.tsx](/apps/desktop/src/presentations/components/LyricsView/components/LyricsSearch.tsx) | TypeScript JSX | 54 | 0 | 4 | 58 |
| [apps/desktop/src/presentations/components/LyricsView/index.ts](/apps/desktop/src/presentations/components/LyricsView/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/LyricsView/types.ts](/apps/desktop/src/presentations/components/LyricsView/types.ts) | TypeScript | 72 | 0 | 7 | 79 |
| [apps/desktop/src/presentations/components/LyricsView/useLyricsPanel.ts](/apps/desktop/src/presentations/components/LyricsView/useLyricsPanel.ts) | TypeScript | 122 | 2 | 18 | 142 |
| [apps/desktop/src/presentations/components/Notification/Notification.scss](/apps/desktop/src/presentations/components/Notification/Notification.scss) | SCSS | 94 | 0 | 10 | 104 |
| [apps/desktop/src/presentations/components/Notification/Notification.tsx](/apps/desktop/src/presentations/components/Notification/Notification.tsx) | TypeScript JSX | 62 | 0 | 11 | 73 |
| [apps/desktop/src/presentations/components/Notification/NotificationProvider.tsx](/apps/desktop/src/presentations/components/Notification/NotificationProvider.tsx) | TypeScript JSX | 38 | 1 | 6 | 45 |
| [apps/desktop/src/presentations/components/Notification/index.ts](/apps/desktop/src/presentations/components/Notification/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/presentations/components/PlayerBar/PlayerBar.scss](/apps/desktop/src/presentations/components/PlayerBar/PlayerBar.scss) | SCSS | 504 | 1 | 74 | 579 |
| [apps/desktop/src/presentations/components/PlayerBar/PlayerBar.tsx](/apps/desktop/src/presentations/components/PlayerBar/PlayerBar.tsx) | TypeScript JSX | 102 | 0 | 16 | 118 |
| [apps/desktop/src/presentations/components/PlayerBar/QueuePanel.tsx](/apps/desktop/src/presentations/components/PlayerBar/QueuePanel.tsx) | TypeScript JSX | 138 | 3 | 19 | 160 |
| [apps/desktop/src/presentations/components/PlayerBar/components/NowPlaying.tsx](/apps/desktop/src/presentations/components/PlayerBar/components/NowPlaying.tsx) | TypeScript JSX | 31 | 0 | 4 | 35 |
| [apps/desktop/src/presentations/components/PlayerBar/components/PlaybackControls.tsx](/apps/desktop/src/presentations/components/PlayerBar/components/PlaybackControls.tsx) | TypeScript JSX | 72 | 0 | 8 | 80 |
| [apps/desktop/src/presentations/components/PlayerBar/components/ProgressBar.tsx](/apps/desktop/src/presentations/components/PlayerBar/components/ProgressBar.tsx) | TypeScript JSX | 34 | 0 | 4 | 38 |
| [apps/desktop/src/presentations/components/PlayerBar/components/VolumeControl.tsx](/apps/desktop/src/presentations/components/PlayerBar/components/VolumeControl.tsx) | TypeScript JSX | 37 | 0 | 4 | 41 |
| [apps/desktop/src/presentations/components/PlayerBar/index.ts](/apps/desktop/src/presentations/components/PlayerBar/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/presentations/components/PlayerBar/types.ts](/apps/desktop/src/presentations/components/PlayerBar/types.ts) | TypeScript | 85 | 0 | 9 | 94 |
| [apps/desktop/src/presentations/components/PlayerBar/usePlayerBar.ts](/apps/desktop/src/presentations/components/PlayerBar/usePlayerBar.ts) | TypeScript | 120 | 1 | 16 | 137 |
| [apps/desktop/src/presentations/components/Sidebar/Sidebar.scss](/apps/desktop/src/presentations/components/Sidebar/Sidebar.scss) | SCSS | 465 | 0 | 67 | 532 |
| [apps/desktop/src/presentations/components/Sidebar/Sidebar.tsx](/apps/desktop/src/presentations/components/Sidebar/Sidebar.tsx) | TypeScript JSX | 87 | 3 | 9 | 99 |
| [apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/DidYouKnow.scss](/apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/DidYouKnow.scss) | SCSS | 87 | 0 | 13 | 100 |
| [apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/DidYouKnow.tsx](/apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/DidYouKnow.tsx) | TypeScript JSX | 63 | 0 | 11 | 74 |
| [apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/index.ts](/apps/desktop/src/presentations/components/Sidebar/components/DidYouKnow/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/Sidebar/components/PlaylistItem.tsx](/apps/desktop/src/presentations/components/Sidebar/components/PlaylistItem.tsx) | TypeScript JSX | 53 | 0 | 3 | 56 |
| [apps/desktop/src/presentations/components/Sidebar/components/PlaylistSection.tsx](/apps/desktop/src/presentations/components/Sidebar/components/PlaylistSection.tsx) | TypeScript JSX | 175 | 0 | 9 | 184 |
| [apps/desktop/src/presentations/components/Sidebar/components/SidebarMini.tsx](/apps/desktop/src/presentations/components/Sidebar/components/SidebarMini.tsx) | TypeScript JSX | 45 | 0 | 6 | 51 |
| [apps/desktop/src/presentations/components/Sidebar/components/index.ts](/apps/desktop/src/presentations/components/Sidebar/components/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/desktop/src/presentations/components/Sidebar/index.ts](/apps/desktop/src/presentations/components/Sidebar/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/desktop/src/presentations/components/Sidebar/types.ts](/apps/desktop/src/presentations/components/Sidebar/types.ts) | TypeScript | 111 | 0 | 9 | 120 |
| [apps/desktop/src/presentations/components/Sidebar/useSidebar.ts](/apps/desktop/src/presentations/components/Sidebar/useSidebar.ts) | TypeScript | 174 | 1 | 21 | 196 |
| [apps/desktop/src/presentations/components/SongPickerModal/SongPickerModal.scss](/apps/desktop/src/presentations/components/SongPickerModal/SongPickerModal.scss) | SCSS | 252 | 0 | 37 | 289 |
| [apps/desktop/src/presentations/components/SongPickerModal/SongPickerModal.tsx](/apps/desktop/src/presentations/components/SongPickerModal/SongPickerModal.tsx) | TypeScript JSX | 125 | 6 | 13 | 144 |
| [apps/desktop/src/presentations/components/SongPickerModal/index.ts](/apps/desktop/src/presentations/components/SongPickerModal/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/SongPickerModal/useSongPicker.ts](/apps/desktop/src/presentations/components/SongPickerModal/useSongPicker.ts) | TypeScript | 58 | 2 | 8 | 68 |
| [apps/desktop/src/presentations/components/Theme/ThemeProvider.scss](/apps/desktop/src/presentations/components/Theme/ThemeProvider.scss) | SCSS | 335 | 0 | 73 | 408 |
| [apps/desktop/src/presentations/components/Theme/ThemeProvider.tsx](/apps/desktop/src/presentations/components/Theme/ThemeProvider.tsx) | TypeScript JSX | 38 | 1 | 9 | 48 |
| [apps/desktop/src/presentations/components/Theme/index.ts](/apps/desktop/src/presentations/components/Theme/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/Tooltip/SmartTooltip.tsx](/apps/desktop/src/presentations/components/Tooltip/SmartTooltip.tsx) | TypeScript JSX | 85 | 3 | 14 | 102 |
| [apps/desktop/src/presentations/components/Tooltip/index.ts](/apps/desktop/src/presentations/components/Tooltip/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/components/UpdateNotification/UpdateNotification.scss](/apps/desktop/src/presentations/components/UpdateNotification/UpdateNotification.scss) | SCSS | 70 | 0 | 11 | 81 |
| [apps/desktop/src/presentations/components/UpdateNotification/UpdateNotification.tsx](/apps/desktop/src/presentations/components/UpdateNotification/UpdateNotification.tsx) | TypeScript JSX | 63 | 2 | 10 | 75 |
| [apps/desktop/src/presentations/components/UpdateNotification/index.ts](/apps/desktop/src/presentations/components/UpdateNotification/index.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/desktop/src/presentations/components/index.ts](/apps/desktop/src/presentations/components/index.ts) | TypeScript | 22 | 0 | 1 | 23 |
| [apps/desktop/src/presentations/constants/DownloadConstants.ts](/apps/desktop/src/presentations/constants/DownloadConstants.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [apps/desktop/src/presentations/constants/IconSizes.ts](/apps/desktop/src/presentations/constants/IconSizes.ts) | TypeScript | 22 | 0 | 2 | 24 |
| [apps/desktop/src/presentations/constants/SettingsConstants.ts](/apps/desktop/src/presentations/constants/SettingsConstants.ts) | TypeScript | 35 | 0 | 2 | 37 |
| [apps/desktop/src/presentations/constants/index.ts](/apps/desktop/src/presentations/constants/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [apps/desktop/src/presentations/debug/downloaderMockups.ts](/apps/desktop/src/presentations/debug/downloaderMockups.ts) | TypeScript | 50 | 2 | 8 | 60 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.scss](/apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.scss) | SCSS | 669 | 1 | 104 | 774 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/PlaylistDetailPage.tsx) | TypeScript JSX | 166 | 0 | 14 | 180 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/BulkActionsBar.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/BulkActionsBar.tsx) | TypeScript JSX | 47 | 0 | 3 | 50 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.scss](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.scss) | SCSS | 89 | 0 | 13 | 102 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/EmptyState.tsx) | TypeScript JSX | 39 | 0 | 6 | 45 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FilterChips.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FilterChips.tsx) | TypeScript JSX | 33 | 0 | 4 | 37 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FloatingBadge.scss](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FloatingBadge.scss) | SCSS | 32 | 0 | 4 | 36 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FloatingBadge.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/FloatingBadge.tsx) | TypeScript JSX | 51 | 2 | 8 | 61 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/PlaylistHeader.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/PlaylistHeader.tsx) | TypeScript JSX | 107 | 0 | 5 | 112 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongListHeader.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongListHeader.tsx) | TypeScript JSX | 28 | 0 | 2 | 30 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongRow.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongRow.tsx) | TypeScript JSX | 160 | 5 | 11 | 176 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongRowContextMenu.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/SongRowContextMenu.tsx) | TypeScript JSX | 142 | 1 | 13 | 156 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/components/VirtualSongList.tsx](/apps/desktop/src/presentations/pages/PlaylistDetailPage/components/VirtualSongList.tsx) | TypeScript JSX | 76 | 0 | 2 | 78 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistData.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistData.ts) | TypeScript | 167 | 0 | 17 | 184 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistMenu.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistMenu.ts) | TypeScript | 66 | 2 | 7 | 75 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistSelection.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistSelection.ts) | TypeScript | 66 | 1 | 12 | 79 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistVirtualization.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/hooks/usePlaylistVirtualization.ts) | TypeScript | 40 | 0 | 12 | 52 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/index.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/types.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/types.ts) | TypeScript | 130 | 0 | 8 | 138 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/usePlaylistDetail.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/usePlaylistDetail.ts) | TypeScript | 205 | 8 | 19 | 232 |
| [apps/desktop/src/presentations/pages/PlaylistDetailPage/utils.ts](/apps/desktop/src/presentations/pages/PlaylistDetailPage/utils.ts) | TypeScript | 14 | 0 | 1 | 15 |
| [apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.scss](/apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.scss) | SCSS | 1,312 | 0 | 211 | 1,523 |
| [apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.tsx](/apps/desktop/src/presentations/pages/SettingsPage/SettingsPage.tsx) | TypeScript JSX | 120 | 2 | 10 | 132 |
| [apps/desktop/src/presentations/pages/SettingsPage/components/SettingsSearch.tsx](/apps/desktop/src/presentations/pages/SettingsPage/components/SettingsSearch.tsx) | TypeScript JSX | 29 | 0 | 4 | 33 |
| [apps/desktop/src/presentations/pages/SettingsPage/components/index.ts](/apps/desktop/src/presentations/pages/SettingsPage/components/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/desktop/src/presentations/pages/SettingsPage/index.ts](/apps/desktop/src/presentations/pages/SettingsPage/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/AppearanceSection.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/AppearanceSection.tsx) | TypeScript JSX | 60 | 0 | 8 | 68 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/AudioSection.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/AudioSection.tsx) | TypeScript JSX | 188 | 8 | 30 | 226 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/AutoImportSettings.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/AutoImportSettings.tsx) | TypeScript JSX | 37 | 0 | 3 | 40 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool.tsx) | TypeScript JSX | 184 | 0 | 11 | 195 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/MaintenanceSettings.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/MaintenanceSettings.tsx) | TypeScript JSX | 40 | 0 | 3 | 43 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/PathSettings.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/PathSettings.tsx) | TypeScript JSX | 31 | 1 | 5 | 37 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/QualitySettings.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/QualitySettings.tsx) | TypeScript JSX | 60 | 0 | 6 | 66 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/YoutubeAuth.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/components/YoutubeAuth.tsx) | TypeScript JSX | 37 | 0 | 3 | 40 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/constants.ts](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/constants.ts) | TypeScript | 20 | 0 | 2 | 22 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/index.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/index.tsx) | TypeScript JSX | 160 | 1 | 14 | 175 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/types.ts](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/types.ts) | TypeScript | 81 | 0 | 10 | 91 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/useDownloadSection.ts](/apps/desktop/src/presentations/pages/SettingsPage/sections/DownloadSection/useDownloadSection.ts) | TypeScript | 115 | 2 | 20 | 137 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/GeneralSection.tsx](/apps/desktop/src/presentations/pages/SettingsPage/sections/GeneralSection.tsx) | TypeScript JSX | 274 | 5 | 27 | 306 |
| [apps/desktop/src/presentations/pages/SettingsPage/sections/index.ts](/apps/desktop/src/presentations/pages/SettingsPage/sections/index.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/AppearanceSection.utils.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/AppearanceSection.utils.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/AudioSection.utils.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/AudioSection.utils.ts) | TypeScript | 5 | 0 | 3 | 8 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/DownloadSection.utils.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/DownloadSection.utils.ts) | TypeScript | 26 | 0 | 5 | 31 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/GeneralSection.utils.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/GeneralSection.utils.ts) | TypeScript | 9 | 0 | 3 | 12 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/Settings.utils.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/Settings.utils.ts) | TypeScript | 16 | 0 | 3 | 19 |
| [apps/desktop/src/presentations/pages/SettingsPage/utils/index.ts](/apps/desktop/src/presentations/pages/SettingsPage/utils/index.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [apps/desktop/src/tests/components/Header/SearchOverlay.test.tsx](/apps/desktop/src/tests/components/Header/SearchOverlay.test.tsx) | TypeScript JSX | 48 | 3 | 6 | 57 |
| [apps/desktop/src/tests/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.test.tsx](/apps/desktop/src/tests/presentations/components/DeleteConfirmationModal/DeleteConfirmationModal.test.tsx) | TypeScript JSX | 96 | 1 | 26 | 123 |
| [apps/desktop/src/tests/presentations/components/DownloaderModal/DownloaderModal.test.tsx](/apps/desktop/src/tests/presentations/components/DownloaderModal/DownloaderModal.test.tsx) | TypeScript JSX | 128 | 3 | 24 | 155 |
| [apps/desktop/src/tests/presentations/components/Dropdown/CustomDropdown.test.tsx](/apps/desktop/src/tests/presentations/components/Dropdown/CustomDropdown.test.tsx) | TypeScript JSX | 38 | 2 | 12 | 52 |
| [apps/desktop/src/tests/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.test.tsx](/apps/desktop/src/tests/presentations/components/DuplicateResolutionModal/DuplicateResolutionModal.test.tsx) | TypeScript JSX | 97 | 12 | 32 | 141 |
| [apps/desktop/src/tests/presentations/components/EditModal/EditModal.test.tsx](/apps/desktop/src/tests/presentations/components/EditModal/EditModal.test.tsx) | TypeScript JSX | 148 | 4 | 43 | 195 |
| [apps/desktop/src/tests/presentations/components/ErrorBoundary/ErrorBoundary.test.tsx](/apps/desktop/src/tests/presentations/components/ErrorBoundary/ErrorBoundary.test.tsx) | TypeScript JSX | 66 | 6 | 16 | 88 |
| [apps/desktop/src/tests/presentations/components/Header/Header.test.tsx](/apps/desktop/src/tests/presentations/components/Header/Header.test.tsx) | TypeScript JSX | 139 | 8 | 34 | 181 |
| [apps/desktop/src/tests/presentations/components/HotkeysModal/HotkeysModal.test.tsx](/apps/desktop/src/tests/presentations/components/HotkeysModal/HotkeysModal.test.tsx) | TypeScript JSX | 59 | 4 | 21 | 84 |
| [apps/desktop/src/tests/presentations/components/Language/LanguageProvider.test.tsx](/apps/desktop/src/tests/presentations/components/Language/LanguageProvider.test.tsx) | TypeScript JSX | 121 | 8 | 25 | 154 |
| [apps/desktop/src/tests/presentations/components/Library/LibraryProvider.test.tsx](/apps/desktop/src/tests/presentations/components/Library/LibraryProvider.test.tsx) | TypeScript JSX | 78 | 3 | 14 | 95 |
| [apps/desktop/src/tests/presentations/components/Library/SyncHistoryModal.test.tsx](/apps/desktop/src/tests/presentations/components/Library/SyncHistoryModal.test.tsx) | TypeScript JSX | 95 | 6 | 21 | 122 |
| [apps/desktop/src/tests/presentations/components/LyricsView/LyricsPanel.test.tsx](/apps/desktop/src/tests/presentations/components/LyricsView/LyricsPanel.test.tsx) | TypeScript JSX | 79 | 4 | 19 | 102 |
| [apps/desktop/src/tests/presentations/components/Notification/Notification.test.tsx](/apps/desktop/src/tests/presentations/components/Notification/Notification.test.tsx) | TypeScript JSX | 105 | 2 | 24 | 131 |
| [apps/desktop/src/tests/presentations/components/PlayerBar/PlayerBar.test.tsx](/apps/desktop/src/tests/presentations/components/PlayerBar/PlayerBar.test.tsx) | TypeScript JSX | 138 | 2 | 30 | 170 |
| [apps/desktop/src/tests/presentations/components/Sidebar/Sidebar.test.tsx](/apps/desktop/src/tests/presentations/components/Sidebar/Sidebar.test.tsx) | TypeScript JSX | 132 | 4 | 35 | 171 |
| [apps/desktop/src/tests/presentations/pages/PlaylistDetailPage/components/SongRow.test.tsx](/apps/desktop/src/tests/presentations/pages/PlaylistDetailPage/components/SongRow.test.tsx) | TypeScript JSX | 115 | 1 | 27 | 143 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AppearanceSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AppearanceSection.test.tsx) | TypeScript JSX | 31 | 3 | 7 | 41 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AudioSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/AudioSection.test.tsx) | TypeScript JSX | 55 | 1 | 9 | 65 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/DownloadSection.test.tsx) | TypeScript JSX | 109 | 3 | 19 | 131 |
| [apps/desktop/src/tests/presentations/pages/SettingsPage/sections/GeneralSection.test.tsx](/apps/desktop/src/tests/presentations/pages/SettingsPage/sections/GeneralSection.test.tsx) | TypeScript JSX | 54 | 6 | 13 | 73 |
| [apps/desktop/src/tests/setup.ts](/apps/desktop/src/tests/setup.ts) | TypeScript | 76 | 8 | 9 | 93 |
| [apps/desktop/src/tests/utils/searchUtils.test.ts](/apps/desktop/src/tests/utils/searchUtils.test.ts) | TypeScript | 14 | 0 | 4 | 18 |
| [apps/desktop/src/vite-env.d.ts](/apps/desktop/src/vite-env.d.ts) | TypeScript | 16 | 1 | 5 | 22 |
| [apps/desktop/tsconfig.app.json](/apps/desktop/tsconfig.app.json) | JSON | 63 | 0 | 7 | 70 |
| [apps/desktop/tsconfig.json](/apps/desktop/tsconfig.json) | JSON with Comments | 11 | 0 | 1 | 12 |
| [apps/desktop/tsconfig.node.json](/apps/desktop/tsconfig.node.json) | JSON | 50 | 0 | 5 | 55 |
| [apps/desktop/vite.config.ts](/apps/desktop/vite.config.ts) | TypeScript | 84 | 5 | 3 | 92 |
| [apps/mobile/...README.md](/apps/mobile/...README.md) | Markdown | 15 | 0 | 6 | 21 |
| [apps/mobile/app.json](/apps/mobile/app.json) | JSON | 64 | 0 | 1 | 65 |
| [apps/mobile/assets/expo.icon/Assets/expo-symbol 2.svg](/apps/mobile/assets/expo.icon/Assets/expo-symbol%202.svg) | XML | 3 | 0 | 1 | 4 |
| [apps/mobile/assets/expo.icon/icon.json](/apps/mobile/assets/expo.icon/icon.json) | JSON | 35 | 0 | 1 | 36 |
| [apps/mobile/babel.config.js](/apps/mobile/babel.config.js) | JavaScript | 6 | 0 | 1 | 7 |
| [apps/mobile/eas.json](/apps/mobile/eas.json) | JSON | 21 | 0 | 1 | 22 |
| [apps/mobile/eslint.config.mjs](/apps/mobile/eslint.config.mjs) | JavaScript | 8 | 1 | 2 | 11 |
| [apps/mobile/metro.config.js](/apps/mobile/metro.config.js) | JavaScript | 4 | 1 | 3 | 8 |
| [apps/mobile/package.json](/apps/mobile/package.json) | JSON | 65 | 0 | 1 | 66 |
| [apps/mobile/src/app/(tabs)/_layout.tsx](/apps/mobile/src/app/(tabs)/_layout.tsx) | TypeScript JSX | 21 | 0 | 2 | 23 |
| [apps/mobile/src/app/(tabs)/library.tsx](/apps/mobile/src/app/(tabs)/library.tsx) | TypeScript JSX | 603 | 0 | 50 | 653 |
| [apps/mobile/src/app/(tabs)/playlists.tsx](/apps/mobile/src/app/(tabs)/playlists.tsx) | TypeScript JSX | 407 | 0 | 29 | 436 |
| [apps/mobile/src/app/(tabs)/search.tsx](/apps/mobile/src/app/(tabs)/search.tsx) | TypeScript JSX | 387 | 7 | 28 | 422 |
| [apps/mobile/src/app/(tabs)/settings.tsx](/apps/mobile/src/app/(tabs)/settings.tsx) | TypeScript JSX | 247 | 0 | 16 | 263 |
| [apps/mobile/src/app/_layout.tsx](/apps/mobile/src/app/_layout.tsx) | TypeScript JSX | 60 | 6 | 10 | 76 |
| [apps/mobile/src/app/index.tsx](/apps/mobile/src/app/index.tsx) | TypeScript JSX | 8 | 0 | 3 | 11 |
| [apps/mobile/src/app/now-playing.tsx](/apps/mobile/src/app/now-playing.tsx) | TypeScript JSX | 376 | 6 | 29 | 411 |
| [apps/mobile/src/app/playlist/[id].tsx](/apps/mobile/src/app/playlist/%5Bid%5D.tsx) | TypeScript JSX | 752 | 3 | 50 | 805 |
| [apps/mobile/src/application/index.ts](/apps/mobile/src/application/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/mobile/src/application/library/LibraryProvider.tsx](/apps/mobile/src/application/library/LibraryProvider.tsx) | TypeScript JSX | 270 | 2 | 44 | 316 |
| [apps/mobile/src/application/library/importAudio.ts](/apps/mobile/src/application/library/importAudio.ts) | TypeScript | 75 | 2 | 18 | 95 |
| [apps/mobile/src/application/library/index.ts](/apps/mobile/src/application/library/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/mobile/src/application/player/PlayerProvider.tsx](/apps/mobile/src/application/player/PlayerProvider.tsx) | TypeScript JSX | 488 | 24 | 87 | 599 |
| [apps/mobile/src/application/player/PlayerService.ts](/apps/mobile/src/application/player/PlayerService.ts) | TypeScript | 57 | 3 | 17 | 77 |
| [apps/mobile/src/application/player/engine/ExpoAudioEngine.ts](/apps/mobile/src/application/player/engine/ExpoAudioEngine.ts) | TypeScript | 141 | 4 | 29 | 174 |
| [apps/mobile/src/application/player/engine/types.ts](/apps/mobile/src/application/player/engine/types.ts) | TypeScript | 30 | 0 | 9 | 39 |
| [apps/mobile/src/application/player/index.ts](/apps/mobile/src/application/player/index.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [apps/mobile/src/application/player/states/AudioPlayerState.ts](/apps/mobile/src/application/player/states/AudioPlayerState.ts) | TypeScript | 119 | 7 | 32 | 158 |
| [apps/mobile/src/infrastructure/storage/MobileStorageAdapter.ts](/apps/mobile/src/infrastructure/storage/MobileStorageAdapter.ts) | TypeScript | 135 | 2 | 26 | 163 |
| [apps/mobile/src/infrastructure/storage/composePlaylists.ts](/apps/mobile/src/infrastructure/storage/composePlaylists.ts) | TypeScript | 7 | 1 | 2 | 10 |
| [apps/mobile/src/infrastructure/storage/index.ts](/apps/mobile/src/infrastructure/storage/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [apps/mobile/src/infrastructure/storage/json.ts](/apps/mobile/src/infrastructure/storage/json.ts) | TypeScript | 8 | 0 | 1 | 9 |
| [apps/mobile/src/infrastructure/storage/keys.ts](/apps/mobile/src/infrastructure/storage/keys.ts) | TypeScript | 7 | 0 | 3 | 10 |
| [apps/mobile/src/presentations/components/AppShell/AppShellProvider.tsx](/apps/mobile/src/presentations/components/AppShell/AppShellProvider.tsx) | TypeScript JSX | 86 | 1 | 16 | 103 |
| [apps/mobile/src/presentations/components/AppShell/index.ts](/apps/mobile/src/presentations/components/AppShell/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [apps/mobile/src/presentations/components/BottomNav.tsx](/apps/mobile/src/presentations/components/BottomNav.tsx) | TypeScript JSX | 145 | 0 | 13 | 158 |
| [apps/mobile/src/presentations/components/Language/LanguageProvider.tsx](/apps/mobile/src/presentations/components/Language/LanguageProvider.tsx) | TypeScript JSX | 43 | 0 | 11 | 54 |
| [apps/mobile/src/presentations/components/Language/index.ts](/apps/mobile/src/presentations/components/Language/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [apps/mobile/src/presentations/components/Language/storage.ts](/apps/mobile/src/presentations/components/Language/storage.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [apps/mobile/src/presentations/components/NameModal.tsx](/apps/mobile/src/presentations/components/NameModal.tsx) | TypeScript JSX | 125 | 0 | 10 | 135 |
| [apps/mobile/src/presentations/components/Notification/NotificationProvider.tsx](/apps/mobile/src/presentations/components/Notification/NotificationProvider.tsx) | TypeScript JSX | 129 | 0 | 20 | 149 |
| [apps/mobile/src/presentations/components/Notification/index.ts](/apps/mobile/src/presentations/components/Notification/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/mobile/src/presentations/components/Notification/types.ts](/apps/mobile/src/presentations/components/Notification/types.ts) | TypeScript | 8 | 0 | 2 | 10 |
| [apps/mobile/src/presentations/components/PlaylistActions.tsx](/apps/mobile/src/presentations/components/PlaylistActions.tsx) | TypeScript JSX | 156 | 0 | 10 | 166 |
| [apps/mobile/src/presentations/components/PlaylistRow.tsx](/apps/mobile/src/presentations/components/PlaylistRow.tsx) | TypeScript JSX | 92 | 0 | 8 | 100 |
| [apps/mobile/src/presentations/components/SidebarMenu.tsx](/apps/mobile/src/presentations/components/SidebarMenu.tsx) | TypeScript JSX | 454 | 1 | 42 | 497 |
| [apps/mobile/src/presentations/components/Theme/ThemeProvider.tsx](/apps/mobile/src/presentations/components/Theme/ThemeProvider.tsx) | TypeScript JSX | 60 | 1 | 17 | 78 |
| [apps/mobile/src/presentations/components/Theme/index.ts](/apps/mobile/src/presentations/components/Theme/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [apps/mobile/src/presentations/components/Theme/storage.ts](/apps/mobile/src/presentations/components/Theme/storage.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [apps/mobile/src/presentations/components/Theme/tokens.ts](/apps/mobile/src/presentations/components/Theme/tokens.ts) | TypeScript | 124 | 2 | 19 | 145 |
| [apps/mobile/src/presentations/components/TopBar.tsx](/apps/mobile/src/presentations/components/TopBar.tsx) | TypeScript JSX | 157 | 0 | 16 | 173 |
| [apps/mobile/src/presentations/player/PlayerBar.tsx](/apps/mobile/src/presentations/player/PlayerBar.tsx) | TypeScript JSX | 189 | 6 | 13 | 208 |
| [apps/mobile/src/presentations/player/QueueModal.tsx](/apps/mobile/src/presentations/player/QueueModal.tsx) | TypeScript JSX | 200 | 0 | 11 | 211 |
| [apps/mobile/src/presentations/player/format.ts](/apps/mobile/src/presentations/player/format.ts) | TypeScript | 6 | 0 | 1 | 7 |
| [apps/mobile/tsconfig.json](/apps/mobile/tsconfig.json) | JSON with Comments | 21 | 0 | 1 | 22 |
| [docs/Bao_Cao_MVP_Draft.md](/docs/Bao_Cao_MVP_Draft.md) | Markdown | 54 | 0 | 20 | 74 |
| [docs/__BTL_yêu_cầu.md](/docs/__BTL_y%C3%AAu_c%E1%BA%A7u.md) | Markdown | 28 | 0 | 4 | 32 |
| [docs/__DESKTOP_Bao_Cao_BTL_MeloVista.md](/docs/__DESKTOP_Bao_Cao_BTL_MeloVista.md) | Markdown | 53 | 0 | 20 | 73 |
| [docs/__DESKTOP_architecture_report.md](/docs/__DESKTOP_architecture_report.md) | Markdown | 52 | 0 | 15 | 67 |
| [docs/__MOBILE_audio_improv_plan.md](/docs/__MOBILE_audio_improv_plan.md) | Markdown | 45 | 0 | 18 | 63 |
| [docs/__MOBILE_playback_modes.md](/docs/__MOBILE_playback_modes.md) | Markdown | 28 | 0 | 6 | 34 |
| [docs/__MOBILE_roadmap.md](/docs/__MOBILE_roadmap.md) | Markdown | 128 | 0 | 54 | 182 |
| [docs/__MOBILE_storage_schema.md](/docs/__MOBILE_storage_schema.md) | Markdown | 67 | 0 | 34 | 101 |
| [docs/__MOBILE_ui_desc.md](/docs/__MOBILE_ui_desc.md) | Markdown | 135 | 0 | 21 | 156 |
| [docs/__PROJECT_REPORT.md](/docs/__PROJECT_REPORT.md) | Markdown | 83 | 0 | 17 | 100 |
| [docs/__PROJECT_architecture_report.md](/docs/__PROJECT_architecture_report.md) | Markdown | 45 | 0 | 17 | 62 |
| [docs/____ROADMAP.md](/docs/____ROADMAP.md) | Markdown | 185 | 0 | 49 | 234 |
| [eslint.config.js](/eslint.config.js) | JavaScript | 45 | 6 | 4 | 55 |
| [package-lock.json](/package-lock.json) | JSON | 21,779 | 0 | 1 | 21,780 |
| [package.json](/package.json) | JSON | 49 | 0 | 1 | 50 |
| [packages/brand/README.md](/packages/brand/README.md) | Markdown | 46 | 0 | 15 | 61 |
| [packages/brand/colors/colors.json](/packages/brand/colors/colors.json) | JSON | 44 | 0 | 1 | 45 |
| [packages/brand/colors/colors.scss](/packages/brand/colors/colors.scss) | SCSS | 19 | 4 | 4 | 27 |
| [packages/brand/package.json](/packages/brand/package.json) | JSON | 6 | 0 | 1 | 7 |
| [packages/brand/typography/fonts.scss](/packages/brand/typography/fonts.scss) | SCSS | 16 | 3 | 3 | 22 |
| [packages/brand/typography/typography.json](/packages/brand/typography/typography.json) | JSON | 27 | 0 | 1 | 28 |
| [packages/brand/typography/typography.scss](/packages/brand/typography/typography.scss) | SCSS | 20 | 4 | 5 | 29 |
| [packages/core/index.ts](/packages/core/index.ts) | TypeScript | 0 | 0 | 1 | 1 |
| [packages/core/package.json](/packages/core/package.json) | JSON | 19 | 0 | 1 | 20 |
| [packages/core/src/index.ts](/packages/core/src/index.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [packages/core/src/interfaces/ILibraryRepository.ts](/packages/core/src/interfaces/ILibraryRepository.ts) | TypeScript | 27 | 0 | 2 | 29 |
| [packages/core/src/interfaces/IMetadataService.ts](/packages/core/src/interfaces/IMetadataService.ts) | TypeScript | 20 | 0 | 4 | 24 |
| [packages/core/src/interfaces/IStorageAdapter.ts](/packages/core/src/interfaces/IStorageAdapter.ts) | TypeScript | 17 | 0 | 2 | 19 |
| [packages/core/src/interfaces/index.ts](/packages/core/src/interfaces/index.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [packages/core/src/services/LibraryService.ts](/packages/core/src/services/LibraryService.ts) | TypeScript | 557 | 49 | 111 | 717 |
| [packages/core/src/services/__tests__/LibraryService.test.ts](/packages/core/src/services/__tests__/LibraryService.test.ts) | TypeScript | 378 | 21 | 87 | 486 |
| [packages/core/src/usecases/AddSongsToPlaylistUseCase.ts](/packages/core/src/usecases/AddSongsToPlaylistUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/CreatePlaylistUseCase.ts](/packages/core/src/usecases/CreatePlaylistUseCase.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [packages/core/src/usecases/DeletePlaylistUseCase.ts](/packages/core/src/usecases/DeletePlaylistUseCase.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [packages/core/src/usecases/DeleteSongUseCase.ts](/packages/core/src/usecases/DeleteSongUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/DeleteSongsUseCase.ts](/packages/core/src/usecases/DeleteSongsUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/GetLibraryUseCase.ts](/packages/core/src/usecases/GetLibraryUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/GetLyricsUseCase.ts](/packages/core/src/usecases/GetLyricsUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/GetPlaylistByIdUseCase.ts](/packages/core/src/usecases/GetPlaylistByIdUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/GetPlaylistsUseCase.ts](/packages/core/src/usecases/GetPlaylistsUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/ImportFilesUseCase.ts](/packages/core/src/usecases/ImportFilesUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/ImportFolderUseCase.ts](/packages/core/src/usecases/ImportFolderUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/PatchSongUseCase.ts](/packages/core/src/usecases/PatchSongUseCase.ts) | TypeScript | 11 | 0 | 2 | 13 |
| [packages/core/src/usecases/RemoveSongsFromPlaylistUseCase.ts](/packages/core/src/usecases/RemoveSongsFromPlaylistUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/SaveLyricsUseCase.ts](/packages/core/src/usecases/SaveLyricsUseCase.ts) | TypeScript | 10 | 0 | 3 | 13 |
| [packages/core/src/usecases/ScanMissingFilesUseCase.ts](/packages/core/src/usecases/ScanMissingFilesUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/SearchLyricsUseCase.ts](/packages/core/src/usecases/SearchLyricsUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/UpdatePlaylistUseCase.ts](/packages/core/src/usecases/UpdatePlaylistUseCase.ts) | TypeScript | 11 | 0 | 4 | 15 |
| [packages/core/src/usecases/UpdateSongUseCase.ts](/packages/core/src/usecases/UpdateSongUseCase.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [packages/core/src/usecases/__tests__/LibraryUseCases.test.ts](/packages/core/src/usecases/__tests__/LibraryUseCases.test.ts) | TypeScript | 16 | 0 | 4 | 20 |
| [packages/core/src/usecases/__tests__/PlaylistUseCases.test.ts](/packages/core/src/usecases/__tests__/PlaylistUseCases.test.ts) | TypeScript | 55 | 0 | 8 | 63 |
| [packages/core/src/usecases/__tests__/SongUseCases.test.ts](/packages/core/src/usecases/__tests__/SongUseCases.test.ts) | TypeScript | 40 | 0 | 7 | 47 |
| [packages/core/src/usecases/index.ts](/packages/core/src/usecases/index.ts) | TypeScript | 18 | 0 | 1 | 19 |
| [packages/core/src/utils/LyricsParser.ts](/packages/core/src/utils/LyricsParser.ts) | TypeScript | 29 | 0 | 7 | 36 |
| [packages/core/src/utils/Mutex.ts](/packages/core/src/utils/Mutex.ts) | TypeScript | 34 | 3 | 5 | 42 |
| [packages/core/src/utils/__tests__/Mutex.test.ts](/packages/core/src/utils/__tests__/Mutex.test.ts) | TypeScript | 64 | 4 | 20 | 88 |
| [packages/core/src/utils/__tests__/artists.test.ts](/packages/core/src/utils/__tests__/artists.test.ts) | TypeScript | 38 | 0 | 7 | 45 |
| [packages/core/src/utils/__tests__/lyrics.test.ts](/packages/core/src/utils/__tests__/lyrics.test.ts) | TypeScript | 56 | 2 | 12 | 70 |
| [packages/core/src/utils/__tests__/youtube.test.ts](/packages/core/src/utils/__tests__/youtube.test.ts) | TypeScript | 34 | 0 | 8 | 42 |
| [packages/core/src/utils/artists.ts](/packages/core/src/utils/artists.ts) | TypeScript | 14 | 0 | 3 | 17 |
| [packages/core/src/utils/index.ts](/packages/core/src/utils/index.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [packages/core/src/utils/lyrics.ts](/packages/core/src/utils/lyrics.ts) | TypeScript | 36 | 0 | 6 | 42 |
| [packages/core/src/utils/youtube.ts](/packages/core/src/utils/youtube.ts) | TypeScript | 26 | 3 | 6 | 35 |
| [packages/core/tsconfig.json](/packages/core/tsconfig.json) | JSON with Comments | 9 | 0 | 1 | 10 |
| [packages/core/vitest.config.ts](/packages/core/vitest.config.ts) | TypeScript | 14 | 0 | 2 | 16 |
| [packages/hooks/README.md](/packages/hooks/README.md) | Markdown | 4 | 0 | 4 | 8 |
| [packages/hooks/index.ts](/packages/hooks/index.ts) | TypeScript | 1 | 0 | 2 | 3 |
| [packages/hooks/package.json](/packages/hooks/package.json) | JSON | 17 | 0 | 1 | 18 |
| [packages/hooks/src/LibraryContext.ts](/packages/hooks/src/LibraryContext.ts) | TypeScript | 4 | 0 | 5 | 9 |
| [packages/hooks/src/PlayerContext.ts](/packages/hooks/src/PlayerContext.ts) | TypeScript | 3 | 0 | 5 | 8 |
| [packages/hooks/src/UIContext.ts](/packages/hooks/src/UIContext.ts) | TypeScript | 3 | 0 | 5 | 8 |
| [packages/hooks/src/constants/index.ts](/packages/hooks/src/constants/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [packages/hooks/src/constants/lyrics.ts](/packages/hooks/src/constants/lyrics.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [packages/hooks/src/index.ts](/packages/hooks/src/index.ts) | TypeScript | 14 | 0 | 5 | 19 |
| [packages/hooks/src/providers/LibraryProvider.tsx](/packages/hooks/src/providers/LibraryProvider.tsx) | TypeScript JSX | 352 | 21 | 65 | 438 |
| [packages/hooks/src/providers/PlayerProvider.tsx](/packages/hooks/src/providers/PlayerProvider.tsx) | TypeScript JSX | 358 | 10 | 65 | 433 |
| [packages/hooks/src/providers/UIProvider.tsx](/packages/hooks/src/providers/UIProvider.tsx) | TypeScript JSX | 12 | 0 | 11 | 23 |
| [packages/hooks/src/tests/LibraryProvider.test.tsx](/packages/hooks/src/tests/LibraryProvider.test.tsx) | TypeScript JSX | 250 | 4 | 72 | 326 |
| [packages/hooks/src/types/audio.ts](/packages/hooks/src/types/audio.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [packages/hooks/src/types/index.ts](/packages/hooks/src/types/index.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [packages/hooks/src/types/library.ts](/packages/hooks/src/types/library.ts) | TypeScript | 55 | 0 | 5 | 60 |
| [packages/hooks/src/types/player.ts](/packages/hooks/src/types/player.ts) | TypeScript | 42 | 0 | 8 | 50 |
| [packages/hooks/src/types/ui.ts](/packages/hooks/src/types/ui.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [packages/hooks/src/useAudioDevices.ts](/packages/hooks/src/useAudioDevices.ts) | TypeScript | 60 | 1 | 14 | 75 |
| [packages/hooks/src/useLibrary.ts](/packages/hooks/src/useLibrary.ts) | TypeScript | 18 | 0 | 4 | 22 |
| [packages/hooks/src/useLyricSync.ts](/packages/hooks/src/useLyricSync.ts) | TypeScript | 43 | 1 | 9 | 53 |
| [packages/hooks/src/useLyrics.ts](/packages/hooks/src/useLyrics.ts) | TypeScript | 105 | 13 | 26 | 144 |
| [packages/hooks/src/usePlayer.ts](/packages/hooks/src/usePlayer.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [packages/hooks/src/useUI.ts](/packages/hooks/src/useUI.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [packages/hooks/tsconfig.json](/packages/hooks/tsconfig.json) | JSON with Comments | 17 | 0 | 2 | 19 |
| [packages/hooks/vitest.config.ts](/packages/hooks/vitest.config.ts) | TypeScript | 16 | 0 | 2 | 18 |
| [packages/i18n/index.ts](/packages/i18n/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [packages/i18n/package.json](/packages/i18n/package.json) | JSON | 13 | 0 | 1 | 14 |
| [packages/i18n/src/desktop.ts](/packages/i18n/src/desktop.ts) | TypeScript | 726 | 0 | 2 | 728 |
| [packages/i18n/src/index.ts](/packages/i18n/src/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [packages/i18n/src/mobile.ts](/packages/i18n/src/mobile.ts) | TypeScript | 278 | 0 | 5 | 283 |
| [packages/i18n/tsconfig.json](/packages/i18n/tsconfig.json) | JSON with Comments | 13 | 0 | 1 | 14 |
| [packages/player/README.md](/packages/player/README.md) | Markdown | 4 | 0 | 4 | 8 |
| [packages/player/index.ts](/packages/player/index.ts) | TypeScript | 0 | 0 | 1 | 1 |
| [packages/player/package.json](/packages/player/package.json) | JSON | 19 | 0 | 1 | 20 |
| [packages/player/src/AudioEngine.ts](/packages/player/src/AudioEngine.ts) | TypeScript | 234 | 16 | 38 | 288 |
| [packages/player/src/__tests__/AudioEngine.test.ts](/packages/player/src/__tests__/AudioEngine.test.ts) | TypeScript | 242 | 8 | 54 | 304 |
| [packages/player/src/index.ts](/packages/player/src/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [packages/player/vitest.config.ts](/packages/player/vitest.config.ts) | TypeScript | 14 | 0 | 2 | 16 |
| [packages/types/index.ts](/packages/types/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [packages/types/package.json](/packages/types/package.json) | JSON | 7 | 0 | 1 | 8 |
| [packages/types/src/index.ts](/packages/types/src/index.ts) | TypeScript | 117 | 0 | 17 | 134 |
| [packages/ui/README.md](/packages/ui/README.md) | Markdown | 5 | 0 | 4 | 9 |
| [packages/ui/index.ts](/packages/ui/index.ts) | TypeScript | 0 | 0 | 1 | 1 |
| [packages/ui/package.json](/packages/ui/package.json) | JSON | 7 | 0 | 1 | 8 |
| [packages/ui/src/Icon.tsx](/packages/ui/src/Icon.tsx) | TypeScript JSX | 36 | 0 | 6 | 42 |
| [packages/ui/src/Icon.web.tsx](/packages/ui/src/Icon.web.tsx) | TypeScript JSX | 38 | 0 | 5 | 43 |
| [packages/ui/src/index.ts](/packages/ui/src/index.ts) | TypeScript | 1 | 0 | 1 | 2 |
| [packages/utils/README.md](/packages/utils/README.md) | Markdown | 7 | 0 | 5 | 12 |
| [packages/utils/package.json](/packages/utils/package.json) | JSON | 15 | 0 | 1 | 16 |
| [packages/utils/src/__tests__/formatTime.test.ts](/packages/utils/src/__tests__/formatTime.test.ts) | TypeScript | 21 | 2 | 5 | 28 |
| [packages/utils/src/array.ts](/packages/utils/src/array.ts) | TypeScript | 13 | 0 | 1 | 14 |
| [packages/utils/src/errorHandler.ts](/packages/utils/src/errorHandler.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [packages/utils/src/formatTime.ts](/packages/utils/src/formatTime.ts) | TypeScript | 8 | 0 | 3 | 11 |
| [packages/utils/src/index.ts](/packages/utils/src/index.ts) | TypeScript | 7 | 0 | 0 | 7 |
| [packages/utils/src/logger.ts](/packages/utils/src/logger.ts) | TypeScript | 36 | 3 | 8 | 47 |
| [packages/utils/src/normalize.ts](/packages/utils/src/normalize.ts) | TypeScript | 27 | 1 | 3 | 31 |
| [packages/utils/src/path.ts](/packages/utils/src/path.ts) | TypeScript | 10 | 0 | 0 | 10 |
| [packages/utils/src/string.ts](/packages/utils/src/string.ts) | TypeScript | 12 | 0 | 1 | 13 |
| [packages/utils/vitest.config.ts](/packages/utils/vitest.config.ts) | TypeScript | 14 | 0 | 2 | 16 |
| [scratch/test_regex.js](/scratch/test_regex.js) | JavaScript | 4 | 0 | 1 | 5 |
| [scripts/check-i18n-keys.js](/scripts/check-i18n-keys.js) | JavaScript | 120 | 8 | 24 | 152 |
| [scripts/deploy.js](/scripts/deploy.js) | JavaScript | 109 | 19 | 32 | 160 |
| [scripts/ghost-css-variables.js](/scripts/ghost-css-variables.js) | JavaScript | 68 | 3 | 15 | 86 |
| [test/manual-verification/duplicates/test_smart_fingerprint.js](/test/manual-verification/duplicates/test_smart_fingerprint.js) | JavaScript | 55 | 5 | 11 | 71 |
| [test/manual-verification/fingerprinting/check_hash_v2.js](/test/manual-verification/fingerprinting/check_hash_v2.js) | JavaScript | 48 | 5 | 12 | 65 |
| [test/manual-verification/fingerprinting/pcm_test.js](/test/manual-verification/fingerprinting/pcm_test.js) | JavaScript | 34 | 5 | 8 | 47 |
| [test/manual-verification/fingerprinting/sim.js](/test/manual-verification/fingerprinting/sim.js) | JavaScript | 6 | 0 | 1 | 7 |
| [test/manual-verification/fingerprinting/v2_final_verification.js](/test/manual-verification/fingerprinting/v2_final_verification.js) | JavaScript | 60 | 2 | 10 | 72 |
| [test/manual-verification/legacy/check_hash.js](/test/manual-verification/legacy/check_hash.js) | JavaScript | 39 | 0 | 10 | 49 |
| [test/manual-verification/legacy/download_fpcalc.bat](/test/manual-verification/legacy/download_fpcalc.bat) | Batch | 8 | 0 | 1 | 9 |
| [test/manual-verification/legacy/download_fpcalc.js](/test/manual-verification/legacy/download_fpcalc.js) | JavaScript | 43 | 2 | 9 | 54 |
| [test/manual-verification/legacy/final_verification.js](/test/manual-verification/legacy/final_verification.js) | JavaScript | 23 | 2 | 9 | 34 |
| [test/manual-verification/legacy/find_culprit.bat](/test/manual-verification/legacy/find_culprit.bat) | Batch | 3 | 0 | 1 | 4 |
| [test/manual-verification/metadata/test_id3.js](/test/manual-verification/metadata/test_id3.js) | JavaScript | 19 | 1 | 6 | 26 |
| [test/manual-verification/metadata/test_id3_read.js](/test/manual-verification/metadata/test_id3_read.js) | JavaScript | 17 | 0 | 6 | 23 |
| [test/manual-verification/metadata/test_persistence.js](/test/manual-verification/metadata/test_persistence.js) | JavaScript | 44 | 3 | 12 | 59 |
| [tsconfig.base.json](/tsconfig.base.json) | JSON | 31 | 0 | 4 | 35 |
| [tsconfig.json](/tsconfig.json) | JSON with Comments | 46 | 0 | 2 | 48 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)