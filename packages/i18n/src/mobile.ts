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
    totalDuration: (h: number, m: number) => string
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
    yourLibrary: string
    allSongs: string
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
    playlistCount: (count: number) => string
    addToOtherPlaylist: string
    addToPlaylistFailed: string
    addShortened: string
    moveToOtherPlaylist: string
    removeFromThisPlaylist: string
    songLabel: string
    noOtherPlaylists: string
    songAddedToOtherPlaylist: (title: string) => string
    songMovedToOtherPlaylist: (title: string) => string
    close: string
    choose: string

    duplicate: string
    playNext: string
    addToQueue: string
    shuffle: string
    duplicated: (name: string) => string
    addedToQueue: string
    addedToPlayNext: string
    shuffling: string
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
  songs: {
    playNext: string
    addToQueue: string
    addToPlaylist: string
    moveToPlaylist: string
    removeFromPlaylist: string
    deleteFromLibrary: string
    dismissQueue: string
    addedToQueue: string
    addedToPlayNext: string
    sortBy: string
    sortTitle: string
    sortArtist: string
    sortDuration: string
    sortDateAdded: string
  }
}

export const mobileTranslations: Record<LanguageCode, Translations> = {
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
      totalDuration: (h, m) => (h > 0 ? `${h} hr ${m} min` : `${m} min`),
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
      yourLibrary: 'Your Library',
      allSongs: 'All songs',
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
      rename: 'Rename playlist',
      delete: 'Delete playlist',
      emptyState: 'No playlists yet — tap + to create one',
      confirmDelete: (name) => `Delete "${name}"?`,
      cancel: 'Cancel',
      songCount: (count) => `${count} song${count !== 1 ? 's' : ''}`,
      created: (name) => `Created "${name}"`,
      renamed: (name) => `Renamed to "${name}"`,
      deleted: (name) => `Deleted "${name}"`,
      enterName: 'Playlist name',
      addSongs: 'Add song',
      removeSong: 'Remove',
      playAll: 'Play All',
      emptyPlaylist: 'This playlist is empty. Add some songs!',
      songsAdded: (count) => `Added ${count} song(s)`,
      songsRemoved: (count) => `Removed ${count} song(s)`,
      playlistCount: (count) => `${count} playlist${count !== 1 ? 's' : ''}`,

      addToPlaylistFailed: 'Failed to add song to playlist',
      addToOtherPlaylist: 'Add to another playlist',
      addShortened: 'Add',
      moveToOtherPlaylist: 'Move to another playlist',
      removeFromThisPlaylist: 'Remove from this playlist',
      songLabel: 'Song',
      noOtherPlaylists: 'There are no other playlists to choose from.',
      songAddedToOtherPlaylist: (title) => `Added "${title}" to another playlist`,
      songMovedToOtherPlaylist: (title) => `Moved "${title}" to another playlist`,
      close: 'Close',
      choose: 'Choose',

      duplicate: 'Duplicate playlist',
      playNext: 'Play next',
      addToQueue: 'Add to queue',
      shuffle: 'Shuffle play',
      duplicated: (name) => `Duplicated to "${name}"`,
      addedToQueue: 'Playlist added to queue',
      addedToPlayNext: 'Playlist will play next',
      shuffling: 'Shuffling playlist…',
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
    songs: {
      playNext: 'Play next',
      addToQueue: 'Add to queue',
      addToPlaylist: 'Add to playlist',
      moveToPlaylist: 'Move to playlist',
      removeFromPlaylist: 'Remove from playlist',
      deleteFromLibrary: 'Delete from library',
      dismissQueue: 'Dismiss queue',
      addedToQueue: 'Added to queue',
      addedToPlayNext: 'This song will play next',
      sortBy: 'Sort by',
      sortTitle: 'Title',
      sortArtist: 'Artist',
      sortDuration: 'Duration',
      sortDateAdded: 'Date added',
    },
  },
  vi: {
    tabs: {
      library: 'Thư viện',
      search: 'Tìm kiếm',
      playlists: 'Danh sách phát',
      settings: 'Cài đặt',
    },
    common: {
      placeholder: 'Màn hình tạm',
      savedToDevice: 'Đã lưu trên thiết bị',
      loadingPreference: 'Đang tải tùy chọn…',
      totalDuration: (h, m) => (h > 0 ? `${h} giờ ${m} phút` : `${m} phút`),
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
      yourLibrary: 'Thư viện của bạn',
      allSongs: 'Tất cả bài hát',
      importSongs: 'Nhập bài hát',
      importCanceled: 'Đã hủy nhập',
      importPicked: (count) => `Đã chọn ${count} tệp`,
      importSuccess: (count) => `Đã nhập ${count} bài`,
      importSuccessWithSkipped: (imported, skipped) =>
        `Đã nhập ${imported} bài • Bỏ qua ${skipped} bài hát bị trùng`,
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
      title: 'Danh sách phát',
      create: 'Tạo danh sách phát',
      rename: 'Đổi tên danh sách',
      delete: 'Xóa danh sách',
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
      playlistCount: (count) => `${count} danh sách phát`,

      addToPlaylistFailed: 'Không thể thêm bài hát vào playlist',
      addToOtherPlaylist: 'Thêm vào playlist khác',
      addShortened: 'Thêm',
      moveToOtherPlaylist: 'Di chuyển sang playlist khác',
      removeFromThisPlaylist: 'Xóa khỏi playlist này',
      songLabel: 'Bài hát',
      noOtherPlaylists: 'Không có playlist nào khác để chọn.',
      songAddedToOtherPlaylist: (title) => `Đã thêm "${title}" vào playlist khác`,
      songMovedToOtherPlaylist: (title) => `Đã chuyển "${title}" sang playlist khác`,
      close: 'Đóng',
      choose: 'Chọn',

      duplicate: 'Sao chép playlist',
      playNext: 'Phát tiếp theo',
      addToQueue: 'Thêm vào hàng chờ',
      shuffle: 'Phát ngẫu nhiên',
      duplicated: (name) => `Đã sao chép thành "${name}"`,
      addedToQueue: 'Đã thêm playlist vào hàng chờ',
      addedToPlayNext: 'Playlist sẽ được phát tiếp theo',
      shuffling: 'Đang phát ngẫu nhiên playlist…',
    },
    search: {
      placeholder: 'Bài hát, nghệ sĩ hoặc playlist',
      noResults: 'Không tìm thấy kết quả',
      songs: 'Bài hát',
      playlists: 'Danh sách phát',
      clear: 'Xóa',
      recentSearches: 'Tìm kiếm gần đây',
      clearAll: 'Xóa tất cả lịch sử',
    },
    songs: {
      playNext: 'Phát tiếp theo',
      addToQueue: 'Thêm vào hàng đợi',
      addToPlaylist: 'Thêm vào playlist',
      moveToPlaylist: 'Di chuyển sang playlist',
      removeFromPlaylist: 'Xóa khỏi playlist',
      deleteFromLibrary: 'Xóa khỏi thư viện',
      dismissQueue: 'Xóa hàng đợi',
      addedToQueue: 'Đã thêm vào hàng đợi',
      addedToPlayNext: 'Bài hát này sẽ được phát tiếp theo',
      sortBy: 'Sắp xếp',
      sortTitle: 'Tên bài',
      sortArtist: 'Nghệ sĩ',
      sortDuration: 'Thời lượng',
      sortDateAdded: 'Ngày thêm',
    },
  },
}