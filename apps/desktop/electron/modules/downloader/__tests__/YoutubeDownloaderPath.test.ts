import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { create as createYoutubeDl } from 'youtube-dl-exec';

type MockableProcess = Omit<NodeJS.Process, 'resourcesPath'> & {
    resourcesPath?: string;
};

const mockProcess = process as unknown as MockableProcess;

const mockedCreate = vi.mocked(createYoutubeDl);

vi.mock('youtube-dl-exec', () => ({
    create: vi.fn().mockImplementation((binaryPath: string) => ({
        _binaryPath: binaryPath,
        exec: vi.fn(),
    })),
    default: vi.fn(),
}));

vi.mock('node:fs', () => ({
    default: { existsSync: vi.fn().mockReturnValue(true) },
}));

describe('YoutubeDownloader Path Resolution', () => {
    const originalPlatform = process.platform;
    const originalResourcesPath = mockProcess.resourcesPath;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Khôi phục môi trường bằng cách dùng Object.defineProperty (cách an toàn nhất cho platform)
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            configurable: true
        });
        mockProcess.resourcesPath = originalResourcesPath;
    });

    /**
     * Helper: Thiết lập môi trường Mock
     */
    const setupMockEnvironment = (isPackaged: boolean, platform: NodeJS.Platform, resourcesPath?: string) => {
        // Mock electron động cho từng case
        vi.doMock('electron', () => ({
            app: {
                isPackaged: isPackaged,
                getAppPath: vi.fn(() => 'mocked-app-path')
            }
        }));

        // Mock platform an toàn
        Object.defineProperty(process, 'platform', {
            value: platform,
            configurable: true
        });

        // Mock resourcesPath thông qua interface đã mở rộng
        if (resourcesPath) {
            mockProcess.resourcesPath = resourcesPath;
        } else {
            delete mockProcess.resourcesPath;
        }
    };

    it('should resolve to local node_modules in development (Windows)', async () => {
        setupMockEnvironment(false, 'win32');

        const { YoutubeDownloader } = await import('../YoutubeDownloader');
        new YoutubeDownloader();

        const binName = 'yt-dlp.exe';
        const expectedPath = path.join('mocked-app-path', 'resources/bin', binName);

        expect(mockedCreate).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to local node_modules in development (POSIX)', async () => {
        setupMockEnvironment(false, 'linux');

        const { YoutubeDownloader } = await import('../YoutubeDownloader');
        new YoutubeDownloader();

        const binName = 'yt-dlp';
        const expectedPath = path.join('mocked-app-path', 'resources/bin', binName);

        expect(mockedCreate).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to app.asar.unpacked in production (Windows)', async () => {
        const mockResources = 'C:\\Program Files\\Melovista\\resources';
        setupMockEnvironment(true, 'win32', mockResources);

        const { YoutubeDownloader } = await import('../YoutubeDownloader');
        new YoutubeDownloader();

        const binName = 'yt-dlp.exe';
        const expectedPath = path.join(mockResources, 'bin', binName);

        expect(mockedCreate).toHaveBeenCalledWith(expectedPath);
    });

    it('should resolve to app.asar.unpacked in production (POSIX)', async () => {
        const mockResources = '/usr/lib/melovista/resources';
        setupMockEnvironment(true, 'linux', mockResources);

        const { YoutubeDownloader } = await import('../YoutubeDownloader');
        new YoutubeDownloader();

        const binName = 'yt-dlp';
        const expectedPath = path.join(mockResources, 'bin', binName);

        expect(mockedCreate).toHaveBeenCalledWith(expectedPath);
    });
});