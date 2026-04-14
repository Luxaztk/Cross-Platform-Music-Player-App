export type LanguageCode = 'en' | 'vi'

export type Translations = {
  tabs: {
    library: string
    search: string
    playlists: string
    settings: string
  }
  common: {
    placeholder: string
    savedToDevice: string
    loadingPreference: string
  }
  settings: {
    title: string
    darkMode: string
    language: string
    english: string
    vietnamese: string
  }
  library: {
    title: string
    importSongs: string
    importCanceled: string
    importPicked: (count: number) => string
    importSuccess: (count: number) => string
    importSuccessWithSkipped: (imported: number, skipped: number) => string
    importFailed: string
    playbackUnavailable: string
    playbackFailed: string
    deleteSong: string
    confirmDeleteSong: (title: string) => string
    songDeleted: (title: string) => string
    fileNotFound: string
    fileNotFoundMessage: string
    removeFromLibrary: string
  }
  playlists: {
    title: string
    create: string
    rename: string
    delete: string
    emptyState: string
    confirmDelete: (name: string) => string
    cancel: string
    songCount: (count: number) => string
    created: (name: string) => string
    renamed: (name: string) => string
    deleted: (name: string) => string
    enterName: string
    addSongs: string
    removeSong: string
    playAll: string
    emptyPlaylist: string
    songsAdded: (count: number) => string
    songsRemoved: (count: number) => string
  }
  search: {
    placeholder: string
    noResults: string
    songs: string
    playlists: string
    clear: string
    recentSearches: string
    clearAll: string
  }
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    tabs: {
      library: 'Library',
      search: 'Search',
      playlists: 'Playlists',
      settings: 'Settings',
    },
    common: {
      placeholder: 'Placeholder screen',
      savedToDevice: 'Saved to device',
      loadingPreference: 'Loading preference…',
    },
    settings: {
      title: 'Settings',
      darkMode: 'Dark mode',
      language: 'Language',
      english: 'English',
      vietnamese: 'Vietnamese',
    },
    library: {
      title: 'Library',
      importSongs: 'Import songs',
      importCanceled: 'Import canceled',
      importPicked: (count) => `Picked ${count} file(s)`,
      importSuccess: (count) => `Imported ${count} song(s)`,
      importSuccessWithSkipped: (imported, skipped) =>
        `Imported ${imported} song(s) • Skipped ${skipped} duplicate(s)`,
      importFailed: 'Import failed',
      playbackUnavailable: 'Audio playback is not available in this client.',
      playbackFailed: 'Could not start playback.',
      deleteSong: 'Delete from Library',
      confirmDeleteSong: (title) => `Delete "${title}" from your library?`,
      songDeleted: (title) => `Deleted "${title}"`,
      fileNotFound: 'File not found',
      fileNotFoundMessage: 'The audio file for this song is missing or has been moved.',
      removeFromLibrary: 'Remove from Library',
    },
    playlists: {
      title: 'Playlists',
      create: 'New Playlist',
      rename: 'Rename',
      delete: 'Delete',
      emptyState: 'No playlists yet — tap + to create one',
      confirmDelete: (name) => `Delete "${name}"?`,
      cancel: 'Cancel',
      songCount: (count) => `${count} song${count !== 1 ? 's' : ''}`,
      created: (name) => `Created "${name}"`,
      renamed: (name) => `Renamed to "${name}"`,
      deleted: (name) => `Deleted "${name}"`,
      enterName: 'Playlist name',
      addSongs: 'Add songs',
      removeSong: 'Remove',
      playAll: 'Play All',
      emptyPlaylist: 'This playlist is empty. Add some songs!',
      songsAdded: (count) => `Added ${count} song(s)`,
      songsRemoved: (count) => `Removed ${count} song(s)`,
    },
    search: {
      placeholder: 'Songs, artists, or playlists',
      noResults: 'No results matching your query',
      songs: 'Songs',
      playlists: 'Playlists',
      clear: 'Clear',
      recentSearches: 'Recent searches',
      clearAll: 'Clear all history',
    },
  },
  vi: {
    tabs: {
      library: 'Thư viện',
      search: 'Tìm kiếm',
      playlists: 'Playlist',
      settings: 'Cài đặt',
    },
    common: {
      placeholder: 'Màn hình tạm',
      savedToDevice: 'Đã lưu trên thiết bị',
      loadingPreference: 'Đang tải tùy chọn…',
    },
    settings: {
      title: 'Cài đặt',
      darkMode: 'Chế độ tối',
      language: 'Ngôn ngữ',
      english: 'Tiếng Anh',
      vietnamese: 'Tiếng Việt',
    },
    library: {
      title: 'Thư viện',
      importSongs: 'Nhập bài hát',
      importCanceled: 'Đã hủy nhập',
      importPicked: (count) => `Đã chọn ${count} tệp`,
      importSuccess: (count) => `Đã nhập ${count} bài`,
      importSuccessWithSkipped: (imported, skipped) =>
        `Đã nhập ${imported} bài • Bỏ qua ${skipped} trùng`,
      importFailed: 'Nhập thất bại',
      playbackUnavailable: 'Thiết bị/ứng dụng hiện tại không hỗ trợ phát nhạc.',
      playbackFailed: 'Không thể bắt đầu phát nhạc.',
      deleteSong: 'Xóa khỏi thư viện',
      confirmDeleteSong: (title) => `Xóa "${title}" khỏi thư viện của bạn?`,
      songDeleted: (title) => `Đã xóa "${title}"`,
      fileNotFound: 'Không tìm thấy tệp',
      fileNotFoundMessage: 'Tệp âm thanh của bài hát này bị thiếu hoặc đã bị di chuyển.',
      removeFromLibrary: 'Xóa khỏi thư viện',
    },
    playlists: {
      title: 'Playlist',
      create: 'Tạo playlist',
      rename: 'Đổi tên',
      delete: 'Xóa',
      emptyState: 'Chưa có playlist — nhấn + để tạo',
      confirmDelete: (name) => `Xóa "${name}"?`,
      cancel: 'Hủy',
      songCount: (count) => `${count} bài`,
      created: (name) => `Đã tạo "${name}"`,
      renamed: (name) => `Đã đổi tên thành "${name}"`,
      deleted: (name) => `Đã xóa "${name}"`,
      enterName: 'Tên playlist',
      addSongs: 'Thêm bài hát',
      removeSong: 'Xóa',
      playAll: 'Phát tất cả',
      emptyPlaylist: 'Playlist này chưa có bài hát nào. Thêm ngay!',
      songsAdded: (count) => `Đã thêm ${count} bài`,
      songsRemoved: (count) => `Đã xóa ${count} bài`,
    },
    search: {
      placeholder: 'Bài hát, nghệ sĩ hoặc playlist',
      noResults: 'Không tìm thấy kết quả',
      songs: 'Bài hát',
      playlists: 'Playlist',
      clear: 'Xóa',
      recentSearches: 'Tìm kiếm gần đây',
      clearAll: 'Xóa tất cả lịch sử',
    },
  },
}
