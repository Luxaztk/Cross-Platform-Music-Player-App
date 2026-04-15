import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { YoutubeDownloader } from '../YoutubeDownloader';
import youtubedl from 'youtube-dl-exec';
import { EventEmitter } from 'events';
import { spawn } from 'node:child_process';

// --- BƯỚC 1: ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO MOCK ---

// Giả lập cấu trúc của ChildProcess (phần chúng ta thực sự sử dụng)
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

// Định nghĩa kiểu cho hàm mock chính của youtube-dl-exec
type MockYtDlFunc = Mock;

// --- BƯỚC 2: MOCK MODULES ---

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: vi.fn().mockReturnValue('/mock/app/path'),
  },
}));

vi.mock('youtube-dl-exec', () => {
  const mockMain = vi.fn() as MockYtDlFunc;
  return {
    default: mockMain,
    create: vi.fn().mockReturnValue(mockMain),
  };
});

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn().mockReturnValue(true) },
}));

const mockedYtDl = youtubedl as unknown as MockYtDlFunc;
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
    mockedYtDl.mockResolvedValue({
      id: '123',
      title: 'Test Title',
      duration: 180,
      channel: 'Test Channel'
    });

    const info = await downloader.getInfo('https://youtube.com/v123');
    expect(info.id).toBe('123');
    expect(mockedYtDl).toHaveBeenCalledWith('https://youtube.com/v123', expect.any(Object));
  });

  it('should download audio and emit progress', async () => {
    // FIX: Không dùng 'as any' nữa
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as any);

    const progressSpy = vi.fn();
    downloader.on('progress', progressSpy);

    const downloadPromise = downloader.downloadAudio('url', 'out.mp3');

    mockProcess.stdout.emit('data', Buffer.from('[download]  10.5% of 5.00MiB'));
    expect(progressSpy).toHaveBeenCalledWith(10.5);

    mockProcess.emit('close', 0);
    const result = await downloadPromise;
    expect(result).toBe('out.mp3');
    
    // Verify that the correct flags are passed to yt-dlp
    const calledArgs = mockedSpawn.mock.calls[0][1];
    expect(calledArgs).toContain('--embed-thumbnail');
    expect(calledArgs).toContain('--convert-thumbnails');
    expect(calledArgs).toContain('jpg');
    expect(calledArgs).toContain('--embed-metadata');
    
    expect(mockedSpawn).toHaveBeenCalledWith(expect.any(String), expect.any(Array), { shell: false });
  });

  it('should reject on process error', async () => {
    // FIX: Sử dụng helper đúng kiểu dữ liệu
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as any);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('error', new Error('Spawn failed'));

    await expect(promise).rejects.toThrow('Spawn failed');
  });

  it('should reject on non-zero exit code', async () => {
    // FIX: Sử dụng helper đúng kiểu dữ liệu
    const mockProcess = createMockProcess();
    mockedSpawn.mockReturnValue(mockProcess as any);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('close', 1);

    await expect(promise).rejects.toThrow('yt-dlp exited with code 1');
  });
});