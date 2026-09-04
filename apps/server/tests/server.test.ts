import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Request, Response } from 'express';
import { createApp } from '../src/app.js';
import { MusicScanner } from '../src/library/MusicScanner.js';
import { streamAudioFile, getMimeType } from '../src/stream/StreamController.js';

describe('MeloVista Streaming Server Suite', () => {
  let tempDir: string;
  let sampleAudioPath: string;
  let scanner: MusicScanner;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'melovista-test-'));
    sampleAudioPath = path.join(tempDir, 'test-song.mp3');
    // Create dummy 1024 bytes audio file
    const dummyBuffer = Buffer.alloc(1024, 0xaa);
    fs.writeFileSync(sampleAudioPath, dummyBuffer);

    scanner = new MusicScanner('http://localhost:4545');
    app = createApp(scanner);
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('StreamController (HTTP 206 Range Streaming)', () => {
    it('detects correct MIME types for audio extensions', () => {
      expect(getMimeType('song.mp3')).toBe('audio/mpeg');
      expect(getMimeType('track.flac')).toBe('audio/flac');
      expect(getMimeType('audio.wav')).toBe('audio/wav');
      expect(getMimeType('music.m4a')).toBe('audio/mp4');
      expect(getMimeType('music.aac')).toBe('audio/aac');
      expect(getMimeType('sound.ogg')).toBe('audio/ogg');
      expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    });

    it('returns 404 when file does not exist', () => {
      const req = { headers: {} } as unknown as Request;
      const res = {
        status: function (code: number) {
          expect(code).toBe(404);
          return this;
        },
        json: function (data: { error: string }) {
          expect(data.error).toBe('File not found');
        },
      } as unknown as Response;

      streamAudioFile(req, res, path.join(tempDir, 'non-existent.mp3'));
    });

    it('streams full file with status 200 when no Range header is sent', async () => {
      // Mock song into scanner
      const songId = scanner.generateId(sampleAudioPath);
      scanner.setIndexedSong(songId, {
        song: {
          id: songId,
          title: 'Test Song',
          artist: 'Test Artist',
          artists: ['Test Artist'],
          album: 'Test Album',
          duration: 100,
          genre: 'Test',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId}`,
          fileSize: 1024,
        },
        physicalPath: sampleAudioPath,
      });

      const res = await request(app).get(`/api/stream/${songId}`);
      expect(res.status).toBe(200);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['content-length']).toBe('1024');
      expect(res.headers['content-type']).toBe('audio/mpeg');
      expect(res.body.length).toBe(1024);
    });

    it('streams partial content with status 206 when Range header is provided', async () => {
      const songId = scanner.generateId(sampleAudioPath);
      scanner.setIndexedSong(songId, {
        song: {
          id: songId,
          title: 'Test Song',
          artist: 'Test Artist',
          artists: ['Test Artist'],
          album: 'Test Album',
          duration: 100,
          genre: 'Test',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId}`,
          fileSize: 1024,
        },
        physicalPath: sampleAudioPath,
      });

      // Request first 256 bytes (0-255)
      const res = await request(app)
        .get(`/api/stream/${songId}`)
        .set('Range', 'bytes=0-255');

      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe('bytes 0-255/1024');
      expect(res.headers['content-length']).toBe('256');
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.body.length).toBe(256);
    });

    it('handles open-ended range request (e.g. bytes=512-)', async () => {
      const songId = scanner.generateId(sampleAudioPath);
      scanner.setIndexedSong(songId, {
        song: {
          id: songId,
          title: 'Test Song',
          artist: 'Test Artist',
          artists: ['Test Artist'],
          album: 'Test Album',
          duration: 100,
          genre: 'Test',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId}`,
          fileSize: 1024,
        },
        physicalPath: sampleAudioPath,
      });

      const res = await request(app)
        .get(`/api/stream/${songId}`)
        .set('Range', 'bytes=512-');

      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe('bytes 512-1023/1024');
      expect(res.headers['content-length']).toBe('512');
      expect(res.body.length).toBe(512);
    });

    it('returns 416 Range Not Satisfiable when range is invalid or out of bounds', async () => {
      const songId = scanner.generateId(sampleAudioPath);
      scanner.setIndexedSong(songId, {
        song: {
          id: songId,
          title: 'Test Song',
          artist: 'Test Artist',
          artists: ['Test Artist'],
          album: 'Test Album',
          duration: 100,
          genre: 'Test',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId}`,
          fileSize: 1024,
        },
        physicalPath: sampleAudioPath,
      });

      const res = await request(app)
        .get(`/api/stream/${songId}`)
        .set('Range', 'bytes=2000-3000');

      expect(res.status).toBe(416);
      expect(res.headers['content-range']).toBe('bytes */1024');
    });
  });

  describe('REST API Endpoints', () => {
    it('GET /api/health returns operational metrics', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('melovista-streaming-server');
      expect(res.body.memoryUsage).toBeDefined();
      expect(res.body.memoryUsage.heapUsedMb).toBeGreaterThan(0);
    });

    it('GET /api/songs returns list of indexed songs with sourceType: stream', async () => {
      const songId = scanner.generateId(sampleAudioPath);
      scanner.setIndexedSong(songId, {
        song: {
          id: songId,
          title: 'Song 1',
          artist: 'Artist 1',
          artists: ['Artist 1'],
          album: 'Album 1',
          duration: 210,
          genre: 'Pop',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId}`,
          fileSize: 1024,
        },
        physicalPath: sampleAudioPath,
      });

      const res = await request(app).get('/api/songs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(songId);
      expect(res.body[0].sourceType).toBe('stream');
      expect(res.body[0].filePath).toContain('/api/stream/');
    });

    it('GET /api/cover/:id returns cover art with correct MIME', async () => {
      const songId = 'mock-cover-id';
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic bytes
      scanner.setCover(songId, {
        buffer: mockImageBuffer,
        mime: 'image/jpeg',
      });

      const res = await request(app).get(`/api/cover/${songId}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/jpeg');
      expect(res.body).toEqual(mockImageBuffer);
    });

    it('GET /api/cover/:id returns 404 when no cover exists', async () => {
      const res = await request(app).get('/api/cover/non-existent');
      expect(res.status).toBe(404);
    });

    it('POST /api/library/diff correctly classifies toUploadIds and alreadyExists (Fingerprint & Metadata)', async () => {
      const songId1 = 'song-1';
      scanner.setIndexedSong(songId1, {
        song: {
          id: songId1,
          title: 'Existing Song',
          artist: 'Known Artist',
          artists: ['Known Artist'],
          album: 'Album 1',
          duration: 180,
          genre: 'Pop',
          year: 2026,
          coverArt: null,
          filePath: `/api/stream/${songId1}`,
          sourceType: 'stream',
          streamUrl: `/api/stream/${songId1}`,
          fileSize: 1024,
          hash: 'p2:abcdef123456',
        },
        physicalPath: sampleAudioPath,
      });

      const res = await request(app)
        .post('/api/library/diff')
        .send({
          songs: [
            // 1. Same hash, different title/fileSize -> should match by HASH!
            { localId: 'client-1', title: 'Renamed Song', artist: 'Known Artist', duration: 180, hash: 'p2:abcdef123456', fileSize: 9999 },
            // 2. Same metadata, no hash -> should match by METADATA!
            { localId: 'client-2', title: 'Existing Song', artist: 'Known Artist', duration: 181, fileSize: 1024 },
            // 3. Completely new song -> toUploadIds
            { localId: 'client-3', title: 'Brand New Song', artist: 'New Artist', duration: 240, hash: 'p2:unique999', fileSize: 5000 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.toUploadIds).toEqual(['client-3']);
      expect(res.body.alreadyExists).toHaveLength(2);
      expect(res.body.alreadyExists).toEqual(
        expect.arrayContaining([
          { localId: 'client-1', serverId: songId1, matchReason: 'HASH' },
          { localId: 'client-2', serverId: songId1, matchReason: 'METADATA' },
        ])
      );
    });

    it('POST /api/upload streams file to disk and registers song in scanner', async () => {
      process.env.MUSIC_DIR = tempDir;
      const audioBuffer = Buffer.alloc(2048, 0xbb);

      const res = await request(app)
        .post('/api/upload?title=My%20Song&artist=Great%20Artist&album=Hit%20Album&hash=p2:mysong123&filename=mysong.mp3')
        .set('Content-Type', 'audio/mpeg')
        .send(audioBuffer);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.song).toBeDefined();
      expect(res.body.song.title).toBe('My Song');
      expect(res.body.song.artist).toBe('Great Artist');
      expect(res.body.song.hash).toBe('p2:mysong123');

      // Verify scanner now has this song
      const allSongs = scanner.getSongs();
      expect(allSongs.some((s) => s.title === 'My Song')).toBe(true);
    });
  });
});
