import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Global mock for electronAPI
const electronAPIMock = {
  getSettings: vi.fn().mockResolvedValue({
    general: { language: 'vi', notifications: true },
    appearance: { theme: 'midnight' },
    audio: { deviceId: 'default' },
    downloads: { downloadPath: 'C:/Music', autoImportPaths: [], bitrate: '320' }
  }),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  selectDirectory: vi.fn().mockResolvedValue('C:/NewPath'),
  scanMissingFiles: vi.fn().mockResolvedValue(undefined),
  onThemeChanged: vi.fn().mockReturnValue(() => {}),
  onUpdateAvailable: vi.fn().mockReturnValue(() => {}),
  onUpdateNotAvailable: vi.fn().mockReturnValue(() => {}),
  onUpdateError: vi.fn().mockReturnValue(() => {}),
  onUpdateDownloaded: vi.fn().mockReturnValue(() => {}),
  checkForUpdates: vi.fn().mockResolvedValue(undefined),
  quitAndInstallUpdate: vi.fn().mockResolvedValue(undefined),
};

// @ts-expect-error - mock global electronAPI for testing
window.electronAPI = electronAPIMock;

// Mock for ResizeObserver which is missing in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

interface MockAudioContextType {
  createOscillator: unknown;
  createGain: unknown;
  currentTime: number;
  destination: unknown;
  close: unknown;
}

// Mock for window.AudioContext
const mockAudioContext = vi.fn().mockImplementation(function (this: MockAudioContextType) {
  this.createOscillator = vi.fn().mockReturnValue({
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });
  this.createGain = vi.fn().mockReturnValue({
    gain: { 
      setValueAtTime: vi.fn(), 
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn() 
    },
    connect: vi.fn(),
  });
  this.currentTime = 0;
  this.destination = {};
  this.close = vi.fn().mockResolvedValue(undefined);
  return this;
});

window.AudioContext = mockAudioContext as unknown as typeof window.AudioContext;
// @ts-expect-error - mock global webkitAudioContext for testing
window.webkitAudioContext = mockAudioContext;
global.AudioContext = mockAudioContext;

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ChevronDown: () => 'ChevronDown',
    RotateCcw: () => 'RotateCcw',
    Languages: () => 'Languages',
    Volume2: () => 'Volume2',
    Play: () => 'Play',
    Download: () => 'Download',
    FolderOpen: () => 'FolderOpen',
    Plus: () => 'Plus',
    Trash2: () => 'Trash2',
    RefreshCcw: () => 'RefreshCcw',
    Settings: () => 'Settings',
    Palette: () => 'Palette',
    Info: () => 'Info',
    Save: () => 'Save',
    Check: () => 'Check',
  };
});

// Mock standard translate function if used via window
// (Assuming t is usually provided by LanguageProvider, but just in case)
