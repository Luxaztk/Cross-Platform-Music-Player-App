import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YoutubeDownloader } from '../YoutubeDownloader';
import youtubedl from 'youtube-dl-exec';
import { EventEmitter } from 'events';

vi.mock('youtube-dl-exec', () => {
    const mockFunc: any = vi.fn().mockResolvedValue({
        id: '123',
        title: 'Test Title',
        duration: 180,
        channel: 'Test Channel'
    });
    mockFunc.exec = vi.fn();
    return { default: mockFunc };
});

describe('YoutubeDownloader', () => {
  let downloader: YoutubeDownloader;

  beforeEach(() => {
    vi.clearAllMocks();
    downloader = new YoutubeDownloader();
  });

  it('should get info from url', async () => {
    const info = await downloader.getInfo('https://youtube.com/v123');
    expect(info.id).toBe('123');
    expect(info.title).toBe('Test Title');
    expect(youtubedl).toHaveBeenCalled();
  });

  it('should download audio and emit progress', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    
    (youtubedl.exec as any).mockReturnValue(mockProcess);

    const progressSpy = vi.fn();
    downloader.on('progress', progressSpy);

    const downloadPromise = downloader.downloadAudio('url', 'out.mp3');

    // Simulate stdout progress
    mockProcess.stdout.emit('data', Buffer.from('[download]  10.5% of 5.00MiB at  1.20MiB/s ETA 00:03'));
    expect(progressSpy).toHaveBeenCalledWith(10.5);

    // Simulate completion
    mockProcess.emit('close', 0);

    const result = await downloadPromise;
    expect(result).toBe('out.mp3');
  });

  it('should reject on process error', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    (youtubedl.exec as any).mockReturnValue(mockProcess);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('error', new Error('Spawn failed'));

    await expect(promise).rejects.toThrow('Spawn failed');
  });

  it('should reject on non-zero exit code', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    (youtubedl.exec as any).mockReturnValue(mockProcess);

    const promise = downloader.downloadAudio('url', 'out.mp3');
    mockProcess.emit('close', 1);

    await expect(promise).rejects.toThrow('yt-dlp exited with code 1');
  });
});
