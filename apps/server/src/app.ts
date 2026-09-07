import express, { type Express } from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import type { Song, SongVisibility } from '@music/types';
import { MusicScanner } from './library/MusicScanner.js';
import { streamAudioFile } from './stream/StreamController.js';

export function createApp(scanner: MusicScanner): Express {
  const app = express();

  app.set('trust proxy', true);

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Range',
      'Content-Type',
      'Authorization',
      'X-File-Name',
      'X-Song-Title',
      'X-Song-Artist',
      'X-Song-Album',
      'X-Song-Duration',
      'X-Song-Hash',
      'X-Client-Username',
      'X-Song-Visibility',
      'X-Song-Whitelist',
      'X-Song-Metadata',
    ],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  }));

  app.use(express.json({ limit: '10mb' }));

  // Helper to get client username from headers or query
  const getClientUsername = (req: express.Request): string | undefined => {
    const fromHeader = req.headers['x-client-username'];
    const headerVal = Array.isArray(fromHeader) ? fromHeader[0] : fromHeader;
    return headerVal?.trim() || (req.query.username as string)?.trim() || undefined;
  };

  // Health check & metrics
  app.get('/api/health', (_req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'ok',
      service: 'melovista-streaming-server',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      totalSongs: scanner.getSongs().length,
      memoryUsage: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      timestamp: Date.now(),
    });
  });

  // Get all active uploaders and statistics
  app.get('/api/users', (_req, res) => {
    const users = scanner.getStorage().getUsers();
    res.json({ users });
  });

  // Get all indexed songs (filtered by client username & optional uploader filter)
  app.get('/api/songs', (req, res) => {
    // Dynamic baseUrl resolution if not set explicitly
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol;
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host');
    const dynamicBase = process.env.BASE_URL || `${protocol}://${host}`;
    scanner.setBaseUrl(dynamicBase);

    const username = getClientUsername(req);
    const filterUploaders = req.query.uploader
      ? (req.query.uploader as string).split(',').map((u) => u.trim()).filter(Boolean)
      : undefined;

    const songs = scanner.getSongs(username, filterUploaders);
    res.json(songs);
  });

  // Get specific song metadata
  app.get('/api/songs/:id', (req, res) => {
    const songId = req.params.id;
    const username = getClientUsername(req);

    // Permission gatekeeper
    const record = scanner.getStorage().getRecord(songId);
    if (record && !scanner.getStorage().canUserAccess(record, username)) {
      res.status(403).json({ error: 'Access denied: You do not have permission to view this song' });
      return;
    }

    const indexed = scanner.getIndexedSong(songId);
    if (!indexed) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    res.json(indexed.song);
  });

  // Update song permissions or metadata
  app.patch('/api/songs/:id', async (req, res) => {
    const songId = req.params.id;
    const username = getClientUsername(req);
    const record = scanner.getStorage().getRecord(songId);

    if (!record) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    if (username && record.uploader.toLowerCase() !== username.toLowerCase()) {
      res.status(403).json({ error: 'Forbidden: Only the uploader can edit song permissions' });
      return;
    }

    const visibility = req.body?.visibility;
    const whitelist = Array.isArray(req.body?.whitelist) ? req.body.whitelist : undefined;
    const songUpdates = req.body?.songUpdates;

    const updated = await scanner.getStorage().updateSongRecord(songId, {
      visibility,
      whitelist,
      songUpdates,
    });

    res.json({ success: true, song: updated?.song });
  });

  // Delete song and physical file
  app.delete('/api/songs/:id', async (req, res) => {
    const songId = req.params.id;
    const username = getClientUsername(req);

    const removed = await scanner.removeSong(songId, username);
    if (!removed.success) {
      if (removed.error) {
        res.status(403).json({ error: removed.error });
      } else {
        res.status(404).json({ error: 'Song not found' });
      }
      return;
    }

    try {
      if (removed.physicalPath && fs.existsSync(removed.physicalPath)) {
        fs.unlinkSync(removed.physicalPath);
        // Clean up empty parent directory if empty
        const parentDir = path.dirname(removed.physicalPath);
        if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
          fs.rmdirSync(parentDir);
          const grandParentDir = path.dirname(parentDir);
          if (fs.existsSync(grandParentDir) && fs.readdirSync(grandParentDir).length === 0) {
            fs.rmdirSync(grandParentDir);
          }
        }
      }
      res.json({ success: true, id: songId });
    } catch (err: unknown) {
      console.error('[DELETE /api/songs/:id Error]', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete file from disk';
      res.status(500).json({ error: msg });
    }
  });

  // Stream audio file (Direct Stream HTTP 206 Partial Content) with permission check
  app.get('/api/stream/:id', (req, res) => {
    const songId = req.params.id;
    const username = getClientUsername(req);

    // Permission check
    const record = scanner.getStorage().getRecord(songId);
    if (record && !scanner.getStorage().canUserAccess(record, username)) {
      res.status(403).json({ error: 'Access denied: You do not have permission to stream this song' });
      return;
    }

    const indexed = scanner.getIndexedSong(songId);
    if (!indexed) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }
    streamAudioFile(req, res, indexed.physicalPath);
  });

  // Serve cover art
  app.get('/api/cover/:id', (req, res) => {
    const songId = req.params.id;
    const cover = scanner.getCover(songId);
    if (!cover) {
      res.status(404).json({ error: 'Cover art not found' });
      return;
    }
    res.setHeader('Content-Type', cover.mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(cover.buffer);
  });

  // Trigger library rescan
  app.post('/api/scan', async (req, res) => {
    const targetDir = req.body?.directory || process.env.MUSIC_DIR;
    if (!targetDir) {
      res.status(400).json({ error: 'Missing directory path parameter' });
      return;
    }

    try {
      const scannedCount = await scanner.scanDirectory(targetDir);
      res.json({ success: true, count: scannedCount });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan directory';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Library Diff API (Fingerprint + Metadata match)
  app.post('/api/library/diff', (req, res) => {
    const clientSongs = req.body?.songs;
    if (!Array.isArray(clientSongs)) {
      res.status(400).json({ error: 'Missing or invalid songs array' });
      return;
    }

    const toUploadIds: string[] = [];
    const alreadyExists: Array<{ localId: string; serverId: string; matchReason: 'HASH' | 'METADATA' }> = [];

    for (const clientSong of clientSongs) {
      if (!clientSong || typeof clientSong !== 'object') continue;
      const match = scanner.findMatch({
        title: clientSong.title || '',
        artist: clientSong.artist || '',
        duration: clientSong.duration,
        hash: clientSong.hash,
        fileSize: clientSong.fileSize,
      });

      if (match.matched && match.song) {
        alreadyExists.push({
          localId: clientSong.localId,
          serverId: match.song.id,
          matchReason: match.matchReason || 'HASH',
        });
      } else {
        toUploadIds.push(clientSong.localId);
      }
    }

    res.json({ toUploadIds, alreadyExists });
  });

  // Stream Upload Audio File
  app.post('/api/upload', (req, res) => {
    const rawFilename = (req.query.filename as string) || (req.headers['x-file-name'] as string) || 'upload.mp3';
    let filename = path.basename(decodeURIComponent(rawFilename));
    if (!filename.includes('.')) {
      filename += '.mp3';
    }

    const rawArtist = (req.query.artist as string) || (req.headers['x-song-artist'] as string) || 'Unknown Artist';
    const rawAlbum = (req.query.album as string) || (req.headers['x-song-album'] as string) || 'Unknown Album';
    const rawTitle = (req.query.title as string) || (req.headers['x-song-title'] as string) || '';
    const duration = parseInt((req.query.duration as string) || (req.headers['x-song-duration'] as string) || '0', 10);
    const hash = (req.query.hash as string) || (req.headers['x-song-hash'] as string) || '';

    // Multi-uploader & access control headers
    const rawUploader = ((req.headers['x-client-username'] as string) || (req.query.uploader as string) || 'guest').trim();
    const rawVisibility = (((req.headers['x-song-visibility'] as string) || (req.query.visibility as string) || 'public').trim()) as SongVisibility;
    const rawWhitelist = (req.headers['x-song-whitelist'] as string) || (req.query.whitelist as string) || '';
    const whitelist = rawWhitelist
      ? rawWhitelist.split(',').map((u) => u.trim()).filter(Boolean)
      : [];

    // Optional custom metadata (chapters, lyrics)
    const rawMetadata = (req.headers['x-song-metadata'] as string) || (req.query.metadata as string) || '';
    let parsedMetadata: Partial<Song> = {};
    if (rawMetadata) {
      try {
        parsedMetadata = JSON.parse(decodeURIComponent(rawMetadata));
      } catch {
        try {
          parsedMetadata = JSON.parse(rawMetadata);
        } catch {
          // Ignored
        }
      }
    }

    const safeArtist = decodeURIComponent(rawArtist).replace(/[\\/:*?"<>|]/g, '_').trim() || 'Unknown Artist';
    const safeAlbum = decodeURIComponent(rawAlbum).replace(/[\\/:*?"<>|]/g, '_').trim() || 'Unknown Album';
    const safeTitle = decodeURIComponent(rawTitle || path.basename(filename, path.extname(filename))).replace(/[\\/:*?"<>|]/g, '_').trim();

    const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'data/music');
    const targetFolder = path.join(musicDir, safeArtist, safeAlbum);
    try {
      fs.mkdirSync(targetFolder, { recursive: true });
    } catch {
      // Ignored
    }

    const targetPath = path.join(targetFolder, filename);
    const writeStream = fs.createWriteStream(targetPath);

    req.on('aborted', () => {
      writeStream.destroy();
      try {
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
      } catch {
        // Ignored
      }
    });

    req.pipe(writeStream);

    writeStream.on('finish', async () => {
      try {
        const song = await scanner.addUploadedSong(
          targetPath,
          {
            title: safeTitle,
            artist: safeArtist,
            album: safeAlbum,
            duration: duration || undefined,
            hash: hash || undefined,
            chapters: parsedMetadata?.chapters,
            lyrics: parsedMetadata?.lyrics,
            syncedLyrics: parsedMetadata?.syncedLyrics,
          },
          {
            uploader: rawUploader,
            visibility: rawVisibility,
            whitelist,
            chapters: parsedMetadata?.chapters,
            lyrics: parsedMetadata?.lyrics,
            syncedLyrics: parsedMetadata?.syncedLyrics,
          }
        );
        res.json({ success: true, song });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to register uploaded song';
        res.status(500).json({ error: message });
      }
    });

    writeStream.on('error', (err) => {
      res.status(500).json({ error: `File write error: ${err.message}` });
    });
  });

  return app;
}
