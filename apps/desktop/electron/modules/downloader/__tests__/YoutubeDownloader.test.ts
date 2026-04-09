import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { YoutubeDownloader } from '../YoutubeDownloader';
import youtubedl from 'youtube-dl-exec';
import { EventEmitter } from 'events';

// --- BƯỚC 1: ĐỊNH NGHĨA KIỂU DỮ LIỆU CHO MOCK ---

// Giả lập cấu trúc của ChildProcess (phần chúng ta thực sự sử dụng)
interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

// Định nghĩa kiểu cho hàm mock chính của youtube-dl-exec
type MockYtDlFunc = Mock & { exec: Mock };

// --- BƯỚC 2: MOCK MODULES ---

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: vi.fn(),
  },
}));

vi.mock('youtube-dl-exec', () => {
  // Thay vì dùng (mockMain as any), chúng ta tạo object đúng cấu trúc ngay từ đầu
  const mockMain = vi.fn() as MockYtDlFunc;
  mockMain.exec = vi.fn();

  return {
    default: mockMain,
    create: vi.fn().mockReturnValue(mockMain),
  };
});

const mockedYtDl = youtubedl as unknown as MockYtDlFunc;

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
    mockedYtDl.exec.mockReturnValue(mockProcess);

    const progressSpy = vi.fn();
    downloader.on('progress', progressSpy);

    const downloadPromise = downloader.downloadAudio('url', 'out.mp3');

    mockProcess.stdout.emit('data', Buffer.from('[download]  10.5% of 5.00MiB'));
    expect(progressSpy).toHaveBeenCalledWith(10.5);

    mockProcess.emit('close', 0);
    const result = await downloadPromise;
    expect(result).toBe('out.mp3');
  });

  it('should reject on process error', async () => {
    // FIX: Sử dụng helper đúng kiểu dữ liệu
    const mockProcess = createMockProcess();
    mockedYtDl.exec.mockReturnValue(mockProcess);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('error', new Error('Spawn failed'));

    await expect(promise).rejects.toThrow('Spawn failed');
  });

  it('should reject on non-zero exit code', async () => {
    // FIX: Sử dụng helper đúng kiểu dữ liệu
    const mockProcess = createMockProcess();
    mockedYtDl.exec.mockReturnValue(mockProcess);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('close', 1);

    await expect(promise).rejects.toThrow('yt-dlp exited with code 1');
  });
});