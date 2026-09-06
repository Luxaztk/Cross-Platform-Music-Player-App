import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YoutubeDownloader } from '../YoutubeDownloader';
import { EventEmitter } from 'events';
import { spawn, type ChildProcess } from 'node:child_process';

// --- BƯỚC 1: ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO MOCK ---

// Giả lập cấu trúc của ChildProcess (phần chúng ta thực sự sử dụng)
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

// --- BƯỚC 2: MOCK MODULES ---

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: vi.fn().mockReturnValue('/mock/app/path'),
    getPath: vi.fn().mockImplementation((name: string) => `/mock/${name}`),
  },
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn().mockReturnValue(true) },
}));

vi.mock('../../../utils/fileState', () => ({
  waitForFileUnlock: vi.fn().mockResolvedValue(undefined),
}));

const mockedSpawn = vi.mocked(spawn);

describe('YoutubeDownloader', () => {
  let downloader: YoutubeDownloader;

  // Helper để tạo một mock process sạch sẽ và đúng kiểu dữ liệu
  const createMockProcess = (): MockChildProcess => {
    const proc = new EventEmitter() as MockChildProcess;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    return proc;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    downloader = new YoutubeDownloader();
  });

  it('should get info from url', async () => {
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

    const infoPromise = downloader.getInfo('https://youtube.com/v123');

    const fakeJson = JSON.stringify({
      id: '123',
      title: 'Test Title',
      duration: 180,
      uploader: 'Test Channel',
      thumbnail: 'https://example.com/thumb.jpg',
    });

    mockProcess.stdout.emit('data', Buffer.from(fakeJson));
    mockProcess.emit('close', 0);

    const info = await infoPromise;
    expect(info.id).toBe('123');
    expect(info.title).toBe('Test Title');
    expect(info.artist).toBe('Test Channel');
  });

  it('should download audio and emit progress', async () => {
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

    const progressSpy = vi.fn();
    downloader.on('progress', progressSpy);

    const downloadPromise = downloader.downloadAudio('mock-id', 'url', 'out.mp3');

    mockProcess.stdout.emit('data', Buffer.from('[download]  10.5% of 5.00MiB'));
    expect(progressSpy).toHaveBeenCalledWith({ id: 'mock-id', percent: 10.5, stage: 'downloading' });

    mockProcess.emit('close', 0);
    const result = await downloadPromise;
    expect(result).toBe('out.mp3');
    
    // Verify that the correct flags are passed to yt-dlp
    const calledArgs = mockedSpawn.mock.calls[0][1];
    expect(calledArgs).toContain('--force-overwrites');
    expect(calledArgs).toContain('--embed-thumbnail');
    expect(calledArgs).toContain('--convert-thumbnails');
    expect(calledArgs).toContain('jpg');
    expect(calledArgs).toContain('--embed-metadata');
    
    expect(mockedSpawn).toHaveBeenCalledWith(
      expect.any(String), 
      expect.any(Array), 
      expect.objectContaining({ 
        shell: false, 
        stdio: ['ignore', 'pipe', 'pipe'] 
      })
    );
  });

  it('should emit converting stage on [ExtractAudio] or [ffmpeg] log', async () => {
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

    const progressSpy = vi.fn();
    downloader.on('progress', progressSpy);

    downloader.downloadAudio('mock-id-converting', 'url', 'out.mp3');

    mockProcess.stdout.emit('data', Buffer.from('[ExtractAudio] Destination: out.mp3'));
    expect(progressSpy).toHaveBeenCalledWith({ 
      id: 'mock-id-converting', 
      percent: 100, 
      stage: 'converting' 
    });

    mockProcess.stdout.emit('data', Buffer.from('[ffmpeg] Post-processing audio...'));
    expect(progressSpy).toHaveBeenCalledWith({ 
      id: 'mock-id-converting', 
      percent: 100, 
      stage: 'converting' 
    });
  });

  it('should reject on process error', async () => {
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

    const promise = downloader.downloadAudio('mock-id', 'url', 'out.mp3');
    mockProcess.emit('error', new Error('Spawn failed'));

    await expect(promise).rejects.toThrow('Spawn failed');
  });

  it('should reject on non-zero exit code', async () => {
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

    const promise = downloader.downloadAudio('mock-id', 'url', 'out.mp3');
    mockProcess.emit('close', 1);

    await expect(promise).rejects.toThrow('yt-dlp exited with code 1');
  });
});