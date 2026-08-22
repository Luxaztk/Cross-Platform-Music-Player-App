import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicManager } from '../src/services/MusicManager.js';
import type { TrackMetadata } from '../src/extractors/BaseExtractor.js';

describe('MusicManager Queue & State Suite', () => {
  let manager: MusicManager;

  const mockTrack1: TrackMetadata = {
    id: 'track-1',
    title: 'Song One',
    artist: 'Artist A',
    duration: 180,
    url: 'https://youtube.com/watch?v=1',
    source: 'youtube',
  };

  const mockTrack2: TrackMetadata = {
    id: 'track-2',
    title: 'Song Two',
    artist: 'Artist B',
    duration: 240,
    url: 'https://youtube.com/watch?v=2',
    source: 'youtube',
  };

  beforeEach(() => {
    manager = new MusicManager('guild-123');
    // Mock streamer playNext
    vi.spyOn(manager, 'playNext').mockResolvedValue(true);
  });

  it('enqueues single and multiple tracks properly', async () => {
    await manager.enqueue(mockTrack1);
    expect(manager.queue).toHaveLength(1);
    expect(manager.queue[0].title).toBe('Song One');

    await manager.enqueue([mockTrack2]);
    expect(manager.queue).toHaveLength(2);
  });

  it('adjusts volume and clamps correctly', () => {
    manager.setVolume(75);
    expect(manager.volume).toBe(75);

    manager.setVolume(200);
    expect(manager.volume).toBe(150);

    manager.setVolume(-10);
    expect(manager.volume).toBe(0);
  });

  it('updates loop mode properly', () => {
    expect(manager.loopMode).toBe('off');
    manager.setLoop('track');
    expect(manager.loopMode).toBe('track');
    manager.setLoop('queue');
    expect(manager.loopMode).toBe('queue');
  });

  it('shuffles queue tracks', async () => {
    const tracks: TrackMetadata[] = Array.from({ length: 10 }, (_, i) => ({
      id: `track-${i}`,
      title: `Song ${i}`,
      artist: 'Artist',
      duration: 100,
      url: `https://youtube.com/${i}`,
      source: 'youtube',
    }));

    manager.queue = [...tracks];

    manager.shuffle();
    expect(manager.queue).toHaveLength(10);
  });

  it('supports playPrev by restoring previousTrack to head of queue', async () => {
    manager.currentTrack = mockTrack2;
    manager.previousTrack = mockTrack1;
    manager.queue = [];

    const result = await manager.playPrev();
    expect(result).toBe(true);
    expect(manager.queue[0].id).toBe('track-1');
    expect(manager.queue[1].id).toBe('track-2');
  });

  it('safely destroys manager without calling stop or causing loops', () => {
    manager.currentTrack = mockTrack1;
    manager.queue = [mockTrack2];

    manager.destroy();

    expect(manager.currentTrack).toBeNull();
    expect(manager.queue).toHaveLength(0);
  });
});

