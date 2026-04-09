import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';

// Top-level mock for youtube-dl-exec remains as it captures the path across tests
vi.mock('youtube-dl-exec', () => ({
    create: vi.fn().mockImplementation((binaryPath: string) => {
        return {
            _binaryPath: binaryPath,
            exec: vi.fn(),
        };
    }),
    default: vi.fn(),
}));

describe('YoutubeDownloader Path Resolution', () => {
    const originalPlatform = process.platform;
    const originalResourcesPath = (process as any).resourcesPath;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore process properties
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
        if (originalResourcesPath) {
            (process as any).resourcesPath = originalResourcesPath;
        } else {
            delete (process as any).resourcesPath;
        }
    });

    /**
     * Helper to set up the mock environment and return the capture-able create function
     */
    const setupMockEnvironment = (isPackaged: boolean, platform: string, resourcesPath?: string) => {
        // 1. Dynamically mock electron for this specific test case
        vi.doMock('electron', () => ({
            app: {
                isPackaged: isPackaged,
                getAppPath: vi.fn(() => 'mocked-app-path')
            }
        }));

        // 2. Mock process.platform
        Object.defineProperty(process, 'platform', {
            value: platform,
            configurable: true
        });

        // 3. Mock resourcesPath
        if (resourcesPath) {
            (process as any).resourcesPath = resourcesPath;
        }
    };

    it('should resolve to local node_modules in development (Windows)', async () => {
        setupMockEnvironment(false, 'win32');

        // Import module AFTER the mock is set
        await import('../YoutubeDownloader');
        const { create } = await import('youtube-dl-exec');

        const expectedPath = path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin', 'yt-dlp.exe');
        expect(create).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to local node_modules in development (POSIX)', async () => {
        setupMockEnvironment(false, 'linux');

        await import('../YoutubeDownloader');
        const { create } = await import('youtube-dl-exec');

        const expectedPath = path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin', 'yt-dlp');
        expect(create).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to app.asar.unpacked in production (Windows)', async () => {
        const mockResources = 'C:\\Program Files\\Melovista\\resources';
        setupMockEnvironment(true, 'win32', mockResources);

        await import('../YoutubeDownloader');
        const { create } = await import('youtube-dl-exec');

        const expectedPath = path.join(mockResources, 'app.asar.unpacked/node_modules/youtube-dl-exec/bin', 'yt-dlp.exe');
        expect(create).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to app.asar.unpacked in production (POSIX)', async () => {
        const mockResources = '/usr/lib/melovista/resources';
        setupMockEnvironment(true, 'linux', mockResources);

        await import('../YoutubeDownloader');
        const { create } = await import('youtube-dl-exec');

        const expectedPath = path.join(mockResources, 'app.asar.unpacked/node_modules/youtube-dl-exec/bin', 'yt-dlp');
        expect(create).toHaveBeenCalledWith(expectedPath);
    });
});
