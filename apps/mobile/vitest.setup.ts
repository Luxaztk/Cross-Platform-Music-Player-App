import { vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    getAllKeys: vi.fn(),
    multiGet: vi.fn(),
    multiSet: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

// Mock expo-av
vi.mock('expo-av', () => ({
  Audio: {
    Sound: vi.fn().mockImplementation(() => ({
      loadAsync: vi.fn(),
      unloadAsync: vi.fn(),
      playAsync: vi.fn(),
      pauseAsync: vi.fn(),
      stopAsync: vi.fn(),
      setPositionAsync: vi.fn(),
      setVolumeAsync: vi.fn(),
      setOnPlaybackStatusUpdate: vi.fn(),
    })),
    setAudioModeAsync: vi.fn(),
  },
}));

// Mock expo-document-picker
vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(),
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

// Mock expo-router
vi.mock('expo-router', () => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
}));

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  Paths: {
    cache: 'mock-cache-path',
    document: 'mock-document-path',
  },
  Directory: vi.fn().mockImplementation(function (this: any, parent: any, name: string) {
    this.uri = typeof parent === 'object' ? `${parent.uri}/${name}` : `${parent}/${name}`;
    this.exists = true;
    this.create = vi.fn();
  }),
  File: vi.fn().mockImplementation(function (this: any, pathOrDir: any, name?: string) {
    this.uri = typeof pathOrDir === 'object' && name ? `${pathOrDir.uri}/${name}` : String(pathOrDir);
    this.exists = true;
    this.size = 1024;
    this.info = vi.fn().mockReturnValue({ exists: true });
    this.write = vi.fn();
    this.delete = vi.fn();
  }),
}));
