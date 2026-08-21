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
    // Mock streamer
    vi.spyOn(manager as any, 'playNext').mockImplementation(async () => true);
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
    const initialOrder = manager.queue.map((t) => t.id);

    manager.shuffle();
    expect(manager.queue).toHaveLength(10);
  });
});
