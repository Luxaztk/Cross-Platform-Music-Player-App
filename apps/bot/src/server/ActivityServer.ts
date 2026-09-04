import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express, { type Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import type { BotClient } from '../services/BotClient.js';
import type { LoopMode, MusicManager } from '../services/MusicManager.js';
import type { TrackMetadata } from '../extractors/BaseExtractor.js';

export interface ActivityMessage {
  type: 'JOIN_GUILD' | 'PAUSE_RESUME' | 'SKIP' | 'PREV_TRACK' | 'STOP' | 'SET_VOLUME' | 'SET_LOOP' | 'TOGGLE_SHUFFLE' | 'GET_STATE' | 'PLAY_TRACK' | 'SEEK';
  guildId: string;
  query?: string;
  volume?: number;
  loopMode?: LoopMode;
  seekSec?: number;
}

// DEP-C2 FIX: Giới hạn kích thước hàng đợi để ngăn abuse (spam /play playlist 10.000 bài)
const MAX_QUEUE_SIZE = 500;

export interface ClientConnection {
  ws: WebSocket;
  guildId?: string;
  lastPlayRequestTime?: number;
}

export class ActivityServer {
  private app: Express;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientConnection> = new Set();
  private botClient: BotClient | null = null;

  constructor(botClient?: BotClient) {
    this.botClient = botClient || null;
    this.app = express();

    // Robust static path resolution for embedded web app
    const cwd = process.cwd();
    let publicPath = path.resolve(cwd, 'apps/bot/public');
    if (!fs.existsSync(publicPath)) {
      publicPath = path.resolve(cwd, 'public');
    }
    if (!fs.existsSync(publicPath)) {
      publicPath = path.resolve(cwd, '../public');
    }

    this.app.use(express.static(publicPath));
    this.app.use(express.json());

    // Health check & status endpoint (DEP-C1: Bổ sung metrics giám sát hệ thống)
    this.app.get('/api/health', (_req, res) => {
      const memory = process.memoryUsage();
      res.json({
        status: 'ok',
        botReady: !!this.botClient?.user,
        activeGuilds: this.botClient?.musicManagers.size || 0,
        wsClients: this.clients.size,
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        },
        timestamp: Date.now(),
      });
    });

    // Image proxy endpoint to bypass Discord CSP & Referrer restrictions
    // BUG-07 FIX: Whitelist hostname để ngăn SSRF attack
    const ALLOWED_IMAGE_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com', 'i9.ytimg.com', 'lh3.googleusercontent.com']);

    this.app.get('/api/proxy-image', async (req, res) => {
      const imageUrl = req.query.url as string;
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).send('Missing url parameter');
      }

      // Kiểm tra hostname hợp lệ
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(imageUrl);
      } catch {
        return res.status(400).send('Invalid url parameter');
      }

      if (!ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
        return res.status(403).send(`Hostname not allowed: ${parsedUrl.hostname}`);
      }

      try {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (!response.ok) {
          return res.status(response.status).send('Failed to fetch image');
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        // Chỉ cho phép serve image content-type
        if (!contentType.startsWith('image/')) {
          return res.status(400).send('Response is not an image');
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
      } catch (err) {
        console.error('[ActivityServer Proxy Image Error]', err);
        res.status(500).send('Proxy error');
      }
    });

    // Fallback for SPA routing
    this.app.use((_req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
          // IMP-B5 FIX: Thêm Content-Type rõ ràng cho fallback HTML string
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.status(200).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>MeloVista Activity Server</title>
              </head>
              <body style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                <div style="text-align:center;">
                  <h1 style="color:#10b981;">🎵 MeloVista Embedded Activity Server</h1>
                  <p>Web Server is active and listening for Discord Embedded Activity App connections.</p>
                </div>
              </body>
            </html>
          `);
        }
      });
    });
  }

  public setBotClient(client: BotClient): void {
    this.botClient = client;
  }

  private subscribedManagers = new WeakSet<MusicManager>();

  private hasConnectedClients(guildId: string): boolean {
    for (const client of this.clients) {
      if (client.guildId === guildId && client.ws.readyState === WebSocket.OPEN) {
        return true;
      }
    }
    return false;
  }

  private ensureManagerListener(guildId: string, musicManager: MusicManager): void {
    if (!this.subscribedManagers.has(musicManager)) {
      this.subscribedManagers.add(musicManager);
      const listener = () => {
        if (this.hasConnectedClients(guildId)) {
          this.broadcastGuildState(guildId, musicManager);
        }
      };
      musicManager.on('stateChange', listener);
      musicManager.once('destroy', () => {
        musicManager.off('stateChange', listener);
      });
    }
  }

  private tickerInterval: ReturnType<typeof setInterval> | null = null;

  public start(port: number = 36970): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      this.wss = new WebSocketServer({ server: this.server });

      // BUG-A6 FIX: Ngăn chặn Ticker 1s Broadcast Storm
      // 1. Nếu không có client WebSocket nào kết nối (clients.size === 0), ticker bỏ qua toàn bộ
      // 2. Chỉ broadcast cho guild có client kết nối thực tế (hasConnectedClients)
      this.tickerInterval = setInterval(() => {
        if (!this.botClient || this.clients.size === 0) return;

        for (const [guildId, musicManager] of this.botClient.musicManagers.entries()) {
          this.ensureManagerListener(guildId, musicManager);
          if (
            this.hasConnectedClients(guildId) &&
            musicManager.currentTrack &&
            musicManager.audioPlayer.state.status !== 'idle'
          ) {
            this.broadcastGuildState(guildId, musicManager);
          }
        }
      }, 1000);

      this.wss.on('connection', (ws: WebSocket) => {
        const conn: ClientConnection = { ws };
        this.clients.add(conn);

        ws.on('message', async (data: Buffer | string) => {
          try {
            const msg: ActivityMessage = JSON.parse(data.toString());
            await this.handleClientMessage(conn, msg);
          } catch (err) {
            console.error('[ActivityServer] Lỗi xử lý message:', err);
          }
        });

        ws.on('close', () => {
          this.clients.delete(conn);
        });

        ws.on('error', () => {
          this.clients.delete(conn);
        });
      });

      this.server.listen(port, () => {
        console.log(`[ActivityServer] HTTP & WebSocket Server đang lắng nghe tại: http://localhost:${port}`);
        resolve(port);
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      // BUG-04 FIX: Dọn tickerInterval để tránh memory leak
      if (this.tickerInterval) {
        clearInterval(this.tickerInterval);
        this.tickerInterval = null;
      }

      for (const client of this.clients) {
        client.ws.close();
      }
      this.clients.clear();

      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }

      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public broadcastState(guildId: string, stateData: Record<string, unknown>): void {
    const payload = JSON.stringify({
      type: 'STATE_UPDATE',
      guildId,
      state: stateData,
    });

    for (const client of this.clients) {
      if (client.guildId === guildId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(payload);
        } catch (err) {
          console.error('[ActivityServer] broadcastState error — removing dead connection:', err);
          this.clients.delete(client);
        }
      }
    }
  }

  private async handleClientMessage(conn: ClientConnection, msg: ActivityMessage): Promise<void> {
    if (!msg.guildId) return;

    const guildId =
      msg.guildId === 'default' && this.botClient?.guilds.cache.first()
        ? this.botClient.guilds.cache.first()!.id
        : msg.guildId;

    conn.guildId = guildId;

    if (!this.botClient) {
      if (msg.type === 'JOIN_GUILD' || msg.type === 'GET_STATE') {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(
            JSON.stringify({
              type: 'STATE_UPDATE',
              guildId,
              state: { currentTrack: null, queue: [], volume: 100, loopMode: 'off', isShuffle: false, isPaused: false },
            })
          );
        }
      }
      return;
    }

    const musicManager = this.botClient.getMusicManager(guildId);
    this.ensureManagerListener(guildId, musicManager);

    switch (msg.type) {
      case 'JOIN_GUILD': {
        this.sendStateToClient(conn, musicManager);
        break;
      }

      case 'PAUSE_RESUME': {
        if (!musicManager.currentTrack) return;
        const targetGuild = this.botClient.guilds.cache.get(guildId) || this.botClient.guilds.cache.first();
        musicManager.ensureVoiceConnection(targetGuild);

        const isPaused = musicManager.audioPlayer.state.status === 'paused';
        if (isPaused) {
          musicManager.resume();
        } else {
          musicManager.pause();
        }
        this.broadcastGuildState(guildId, musicManager);
        break;
      }

      case 'SKIP': {
        const targetGuild = this.botClient.guilds.cache.get(guildId) || this.botClient.guilds.cache.first();
        musicManager.ensureVoiceConnection(targetGuild);
        musicManager.skip();
        this.broadcastGuildState(guildId, musicManager);
        break;
      }

      case 'STOP': {
        musicManager.stop();
        this.broadcastGuildState(guildId, musicManager);
        break;
      }

      case 'SET_VOLUME': {
        if (typeof msg.volume === 'number') {
          musicManager.setVolume(msg.volume);
          this.broadcastGuildState(guildId, musicManager);
        }
        break;
      }

      case 'SET_LOOP': {
        if (msg.loopMode) {
          musicManager.setLoop(msg.loopMode);
          this.broadcastGuildState(guildId, musicManager);
        }
        break;
      }

      case 'TOGGLE_SHUFFLE': {
        musicManager.toggleShuffle();
        this.broadcastGuildState(guildId, musicManager);
        break;
      }

      case 'PLAY_TRACK': {
        if (msg.query && this.botClient) {
          const query = msg.query.trim();
          if (!query) break;

          // E-08: Rate limit / Cooldown kiểm soát spam (1000ms mỗi client)
          const now = Date.now();
          if (conn.lastPlayRequestTime && now - conn.lastPlayRequestTime < 1000) {
            this.sendToClient(conn, {
              type: 'ERROR',
              message: 'Vui lòng chờ giây lát trước khi yêu cầu bài hát tiếp theo.',
            });
            break;
          }
          conn.lastPlayRequestTime = now;

          // DEP-C2 FIX: Kiểm tra giới hạn queue trước khi enqueue
          if (musicManager.queue.length >= MAX_QUEUE_SIZE) {
            this.sendToClient(conn, {
              type: 'ERROR',
              message: `Hàng đợi đã đầy (tối đa ${MAX_QUEUE_SIZE} bài). Vui lòng dùng /stop để xóa hàng đợi.`,
            });
            break;
          }

          const targetGuild = this.botClient.guilds.cache.get(guildId) || this.botClient.guilds.cache.first();
          musicManager.ensureVoiceConnection(targetGuild);

          this.botClient.streamer
            .getTrackInfo(query, 'Discord Activity User')
            .then(async (result) => {
              if (result.tracks && result.tracks.length > 0) {
                await musicManager.enqueue(result.tracks);
                this.broadcastGuildState(guildId, musicManager);
              } else {
                // E-03: Báo lỗi nếu không tìm thấy bài hát
                this.sendToClient(conn, {
                  type: 'ERROR',
                  message: `Không tìm thấy bài hát phù hợp cho: "${query}"`,
                });
                this.broadcastGuildState(guildId, musicManager);
              }
            })
            .catch((err: unknown) => {
              const errMsg = err instanceof Error ? err.message : String(err);
              console.error('[ActivityServer] Play error:', errMsg);
              // E-03: Gửi thông báo lỗi cho client Activity
              this.sendToClient(conn, {
                type: 'ERROR',
                message: `Lỗi khi phát bài hát: ${errMsg}`,
              });
              this.broadcastGuildState(guildId, musicManager);
            });
        }
        break;
      }

      case 'GET_STATE': {
        this.sendStateToClient(conn, musicManager);
        break;
      }

      // DESIGN-07: Ph\u00e1t l\u1ea1i b\u00e0i tr\u01b0\u1edbc (Prev Track)
      case 'PREV_TRACK': {
        const targetGuild = this.botClient.guilds.cache.get(guildId) || this.botClient.guilds.cache.first();
        musicManager.ensureVoiceConnection(targetGuild);
        await musicManager.playPrev();
        this.broadcastGuildState(guildId, musicManager);
        break;
      }

      // DESIGN-06: Seek \u0111\u1ebfn v\u1ecb tr\u00ed c\u1ee5 th\u1ec3 trong b\u00e0i
      case 'SEEK': {
        if (typeof msg.seekSec === 'number' && msg.seekSec >= 0) {
          await musicManager.seekTo(msg.seekSec);
          this.broadcastGuildState(guildId, musicManager);
        }
        break;
      }

      default:
        break;
    }
  }

  private formatTrack(track: TrackMetadata | null) {
    if (!track) return null;
    const rawThumb = track.thumbnail || (track as unknown as { coverArt?: string }).coverArt || (track.id ? `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` : '');
    const coverArt = rawThumb.startsWith('http')
      ? `/api/proxy-image?url=${encodeURIComponent(rawThumb)}`
      : rawThumb;
    return {
      ...track,
      coverArt,
      thumbnail: coverArt,
    };
  }

  private sendToClient(conn: ClientConnection, data: Record<string, unknown>): void {
    if (conn.ws.readyState === WebSocket.OPEN) {
      try {
        conn.ws.send(JSON.stringify(data));
      } catch (err) {
        console.error('[ActivityServer] sendToClient error:', err);
      }
    }
  }

  private sendStateToClient(conn: ClientConnection, musicManager: MusicManager): void {
    if (conn.ws.readyState !== WebSocket.OPEN) return;
    const statePayload = {
      type: 'STATE_UPDATE',
      guildId: musicManager.guildId,
      state: {
        currentTrack: this.formatTrack(musicManager.currentTrack),
        queue: musicManager.queue.map((t) => this.formatTrack(t)),
        volume: musicManager.volume,
        loopMode: musicManager.loopMode,
        isShuffle: musicManager.isShuffle,
        isPaused: musicManager.audioPlayer.state.status === 'paused',
        progressSec: musicManager.getPlaybackPosition(),
        durationSec: musicManager.currentTrack?.duration || 0,
      },
    };
    // BUG-A3 FIX: Wrap ws.send() trong try/catch để ngăn unhandled exception
    // khi client disconnect giữa chừng sau khi readyState đã pass check
    try {
      conn.ws.send(JSON.stringify(statePayload));
    } catch (err) {
      console.error('[ActivityServer] sendStateToClient error — removing dead connection:', err);
      this.clients.delete(conn);
    }
  }

  private broadcastGuildState(guildId: string, musicManager: MusicManager): void {
    this.broadcastState(guildId, {
      currentTrack: this.formatTrack(musicManager.currentTrack),
      queue: musicManager.queue.map((t) => this.formatTrack(t)),
      volume: musicManager.volume,
      loopMode: musicManager.loopMode,
      isShuffle: musicManager.isShuffle,
      isPaused: musicManager.audioPlayer.state.status === 'paused',
      progressSec: musicManager.getPlaybackPosition(),
      durationSec: musicManager.currentTrack?.duration || 0,
    });
  }
}
