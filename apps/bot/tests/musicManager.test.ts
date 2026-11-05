import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  type AudioPlayerError,
  type AudioResource,
  type VoiceConnection,
} from '@discordjs/voice';
import type { VoiceBasedChannel } from 'discord.js';
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

  it('suppresses the transient Idle event while seeking and keeps the absolute playback position', async () => {
    manager.currentTrack = mockTrack1;
    const resource = {
      playbackDuration: 5_000,
      volume: { setVolume: vi.fn() },
    } as unknown as AudioResource<TrackMetadata>;
    const cleanup = vi.fn();
    const createAudioResource = vi.fn(async () => {
      manager.audioPlayer.emit(AudioPlayerStatus.Idle);
      return { resource, cleanup };
    });
    const play = vi.spyOn(manager.audioPlayer, 'play').mockImplementation(() => manager.audioPlayer);

    (manager as unknown as {
      streamer: { createAudioResource: typeof createAudioResource };
    }).streamer = { createAudioResource };

    const result = await manager.seekTo(60);

    expect(result).toBe(true);
    expect(manager.playNext).not.toHaveBeenCalled();
    expect(play).toHaveBeenCalledWith(resource);
    expect(manager.getPlaybackPosition()).toBe(65);
  });

  it('suppresses a stale stream error while seeking instead of advancing the queue', async () => {
    manager.currentTrack = mockTrack1;
    const resource = {
      playbackDuration: 0,
      volume: { setVolume: vi.fn() },
    } as unknown as AudioResource<TrackMetadata>;
    const createAudioResource = vi.fn(async () => {
      manager.audioPlayer.emit(
        'error',
        new Error('stale stream closed') as unknown as AudioPlayerError
      );
      return { resource, cleanup: vi.fn() };
    });
    vi.spyOn(manager.audioPlayer, 'play').mockImplementation(() => manager.audioPlayer);

    (manager as unknown as {
      streamer: { createAudioResource: typeof createAudioResource };
    }).streamer = { createAudioResource };

    expect(await manager.seekTo(60)).toBe(true);
    expect(manager.playNext).not.toHaveBeenCalled();
  });

  it('rejoins an existing disconnected connection for the last voice channel', () => {
    const rejoin = vi.fn(() => true);
    const voiceConnection = {
      state: { status: VoiceConnectionStatus.Disconnected },
      joinConfig: { channelId: 'voice-123' },
      rejoin,
    } as unknown as VoiceConnection;
    const lastVoiceChannel = {
      id: 'voice-123',
      guild: { id: 'guild-123' },
    } as unknown as VoiceBasedChannel;

    Object.assign(manager as unknown as {
      voiceConnection: VoiceConnection | null;
      lastVoiceChannel: VoiceBasedChannel | null;
    }, { voiceConnection, lastVoiceChannel });

    expect(manager.ensureVoiceConnection()).toBe(true);
    expect(rejoin).toHaveBeenCalledTimes(1);
  });

  it('skips directly to the next track without re-adding the current track in track loop mode', async () => {
    manager.currentTrack = mockTrack1;
    manager.queue = [mockTrack2];
    manager.loopMode = 'track';
    vi.spyOn(manager.audioPlayer, 'stop').mockReturnValue(true);

    const result = await manager.skip();

    expect(result).toBe(true);
    expect(manager.queue.map((track) => track.id)).toEqual(['track-2']);
    expect(manager.playNext).toHaveBeenCalledTimes(1);
  });

  it('restarts the current track when previous is unavailable', async () => {
    manager.currentTrack = mockTrack1;
    manager.previousTrack = null;
    const seekTo = vi.spyOn(manager, 'seekTo').mockResolvedValue(true);

    const result = await manager.playPrev();

    expect(result).toBe(true);
    expect(seekTo).toHaveBeenCalledWith(0);
  });

  it('supports removing, jumping to, and clearing queue items', async () => {
    manager.currentTrack = mockTrack1;
    manager.queue = [mockTrack1, mockTrack2];
    vi.spyOn(manager.audioPlayer, 'stop').mockReturnValue(true);

    expect(manager.removeQueueItem(0)?.id).toBe('track-1');
    expect(await manager.jumpToQueueItem(0)).toBe(true);
    expect(manager.playNext).toHaveBeenCalledTimes(1);

    manager.queue = [mockTrack1, mockTrack2];
    expect(manager.clearQueue()).toBe(2);
    expect(manager.queue).toEqual([]);
  });

  it('safely destroys manager without calling stop or causing loops', () => {
    manager.currentTrack = mockTrack1;
    manager.queue = [mockTrack2];

    manager.destroy();

    expect(manager.currentTrack).toBeNull();
    expect(manager.queue).toHaveLength(0);
  });
});

