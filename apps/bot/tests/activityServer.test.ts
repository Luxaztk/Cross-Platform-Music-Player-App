import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'node:http';
import { WebSocket } from 'ws';
import { Collection, type Guild } from 'discord.js';
import { ActivityServer, type ActivityMessage, type ClientConnection } from '../src/server/ActivityServer.js';
import { MusicManager } from '../src/services/MusicManager.js';
import type { BotClient } from '../src/services/BotClient.js';
import type { TrackMetadata } from '../src/extractors/BaseExtractor.js';

describe('ActivityServer Unit Tests', () => {
  let server: ActivityServer;
  const testPort = 3998;

  beforeAll(async () => {
    server = new ActivityServer();
    await server.start(testPort);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should respond to HTTP health check with enhanced metrics', async () => {
    const res = await new Promise<{
      status: string;
      botReady: boolean;
      activeGuilds: number;
      wsClients: number;
      uptime: number;
      memoryUsage: { heapUsedMb: number; rssMb: number };
    }>((resolve, reject) => {
      http.get(`http://localhost:${testPort}/api/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
        res.on('error', reject);
      });
    });

    expect(res.status).toBe('ok');
    expect(typeof res.activeGuilds).toBe('number');
    expect(typeof res.wsClients).toBe('number');
    expect(typeof res.uptime).toBe('number');
    expect(res.memoryUsage).toBeDefined();
    expect(typeof res.memoryUsage.heapUsedMb).toBe('number');
  });

  it('should accept WebSocket connection and respond to messages', async () => {
    const ws = new WebSocket(`ws://localhost:${testPort}`);

    const receivedMessage = await new Promise<{ type: string; guildId: string }>((resolve, reject) => {
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'JOIN_GUILD', guildId: 'test-guild-123' }));
      });

      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
        ws.close();
      });

      ws.on('error', reject);
    });

    expect(receivedMessage.type).toBe('STATE_UPDATE');
    expect(receivedMessage.guildId).toBe('test-guild-123');
  });

  it('resolves default guilds to the manager that is actively playing', () => {
    const inactiveManager = new MusicManager('guild-inactive');
    const activeManager = new MusicManager('guild-active');
    activeManager.currentTrack = {
      id: 'active-track',
      title: 'Active Song',
      artist: 'Artist',
      duration: 180,
      url: 'https://youtube.com/watch?v=active',
      source: 'youtube',
    };
    const guilds = new Collection<string, Guild>();
    guilds.set('guild-inactive', { id: 'guild-inactive' } as Guild);
    guilds.set('guild-active', { id: 'guild-active' } as Guild);
    const botClient = {
      guilds: { cache: guilds },
      musicManagers: new Map([
        ['guild-inactive', inactiveManager],
        ['guild-active', activeManager],
      ]),
      onMusicManagerCreated: () => () => {},
    } as unknown as BotClient;
    const activityServer = new ActivityServer(botClient);

    expect(activityServer.resolveGuildId('default')).toBe('guild-active');

    inactiveManager.destroy();
    activeManager.destroy();
  });

  it('routes remove, jump, and clear queue actions to the resolved guild manager', async () => {
    const track: TrackMetadata = {
      id: 'queue-track',
      title: 'Queue Song',
      artist: 'Artist',
      duration: 180,
      url: 'https://youtube.com/watch?v=queue',
      source: 'youtube',
    };
    const manager = new MusicManager('guild-queue');
    manager.queue = [track];
    const removeQueueItem = vi.spyOn(manager, 'removeQueueItem');
    const jumpToQueueItem = vi.spyOn(manager, 'jumpToQueueItem').mockResolvedValue(true);
    const clearQueue = vi.spyOn(manager, 'clearQueue');
    const guilds = new Collection<string, Guild>();
    guilds.set('guild-queue', { id: 'guild-queue' } as Guild);
    const botClient = {
      guilds: { cache: guilds },
      musicManagers: new Map([['guild-queue', manager]]),
      getMusicManager: () => manager,
      onMusicManagerCreated: () => () => {},
    } as unknown as BotClient;
    const activityServer = new ActivityServer(botClient);
    const conn = {
      ws: { readyState: WebSocket.OPEN, send: vi.fn() } as unknown as WebSocket,
    } satisfies ClientConnection;
    const handleClientMessage = (
      activityServer as unknown as {
        handleClientMessage: (connection: ClientConnection, message: ActivityMessage) => Promise<void>;
      }
    ).handleClientMessage.bind(activityServer);

    await handleClientMessage(conn, { type: 'REMOVE_QUEUE_ITEM', guildId: 'guild-queue', queueIndex: 0 });
    manager.queue = [track];
    await handleClientMessage(conn, { type: 'JUMP_TO_QUEUE_ITEM', guildId: 'guild-queue', queueIndex: 0 });
    await handleClientMessage(conn, { type: 'CLEAR_QUEUE', guildId: 'guild-queue' });

    expect(removeQueueItem).toHaveBeenCalledWith(0);
    expect(jumpToQueueItem).toHaveBeenCalledWith(0);
    expect(clearQueue).toHaveBeenCalledTimes(1);
    manager.destroy();
  });
});
