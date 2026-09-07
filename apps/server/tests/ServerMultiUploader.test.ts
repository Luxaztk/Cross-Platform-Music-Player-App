import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Song, ServerUserSummary } from '@music/types';
import { createApp } from '../src/app.js';
import { MusicScanner } from '../src/library/MusicScanner.js';
import { ServerStorage } from '../src/library/ServerStorage.js';

describe('Server Multi-Uploader & Stream Access Control Suite', () => {
  let tempDir: string;
  let dbPath: string;
  let storage: ServerStorage;
  let scanner: MusicScanner;
  let app: ReturnType<typeof createApp>;
  let dummyAudioBuffer: Buffer;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'melovista-multi-'));
    dbPath = path.join(tempDir, 'test_db.json');
    storage = new ServerStorage(dbPath);
    await storage.init();

    scanner = new MusicScanner('http://localhost:4545', storage);
    app = createApp(scanner);

    dummyAudioBuffer = Buffer.alloc(2048, 0x55);
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('1. Access Control on Songs Listing & Streaming (Public, Whitelist, Private)', () => {
    it('enforces visibility rules across GET /api/songs and GET /api/stream/:id', async () => {
      // 1. Upload public song by 'user_b'
      const pubRes = await request(app)
        .post('/api/upload?filename=public_song.mp3')
        .set('X-Client-Username', 'user_b')
        .set('X-Song-Title', 'Public Song')
        .set('X-Song-Artist', 'Artist B')
        .set('X-Song-Visibility', 'public')
        .set('X-Song-Hash', 'hash_pub_1')
        .send(dummyAudioBuffer);

      expect(pubRes.status).toBe(200);
      const pubSongId = pubRes.body.song.id;

      // 2. Upload whitelist song by 'user_b' allowing 'user_a' and 'user_c'
      const wlRes = await request(app)
        .post('/api/upload?filename=whitelist_song.mp3')
        .set('X-Client-Username', 'user_b')
        .set('X-Song-Title', 'Whitelist Song')
        .set('X-Song-Artist', 'Artist B')
        .set('X-Song-Visibility', 'whitelist')
        .set('X-Song-Whitelist', 'user_a,user_c')
        .set('X-Song-Hash', 'hash_wl_1')
        .send(dummyAudioBuffer);

      expect(wlRes.status).toBe(200);
      const wlSongId = wlRes.body.song.id;

      // 3. Upload private song by 'user_b' (Only me)
      const privRes = await request(app)
        .post('/api/upload?filename=private_song.mp3')
        .set('X-Client-Username', 'user_b')
        .set('X-Song-Title', 'Private Song')
        .set('X-Song-Artist', 'Artist B')
        .set('X-Song-Visibility', 'private')
        .set('X-Song-Hash', 'hash_priv_1')
        .send(dummyAudioBuffer);

      expect(privRes.status).toBe(200);
      const privSongId = privRes.body.song.id;

      // --- Test GET /api/songs for different users ---

      // Anonymous (no header) should only see public song
      const anonSongs = await request(app).get('/api/songs');
      expect(anonSongs.status).toBe(200);
      const anonTitles = anonSongs.body.map((s: Song) => s.title);
      expect(anonTitles).toContain('Public Song');
      expect(anonTitles).not.toContain('Whitelist Song');
      expect(anonTitles).not.toContain('Private Song');

      // user_a (on whitelist) should see Public + Whitelist, but not Private
      const userASongs = await request(app).get('/api/songs').set('X-Client-Username', 'user_a');
      expect(userASongs.status).toBe(200);
      const userATitles = userASongs.body.map((s: Song) => s.title);
      expect(userATitles).toContain('Public Song');
      expect(userATitles).toContain('Whitelist Song');
      expect(userATitles).not.toContain('Private Song');

      // user_d (NOT on whitelist) should only see Public
      const userDSongs = await request(app).get('/api/songs').set('X-Client-Username', 'user_d');
      expect(userDSongs.status).toBe(200);
      const userDTitles = userDSongs.body.map((s: Song) => s.title);
      expect(userDTitles).toContain('Public Song');
      expect(userDTitles).not.toContain('Whitelist Song');
      expect(userDTitles).not.toContain('Private Song');

      // user_b (the uploader) sees all 3 of their songs
      const userBSongs = await request(app).get('/api/songs').set('X-Client-Username', 'user_b');
      expect(userBSongs.status).toBe(200);
      const userBTitles = userBSongs.body.map((s: Song) => s.title);
      expect(userBTitles).toContain('Public Song');
      expect(userBTitles).toContain('Whitelist Song');
      expect(userBTitles).toContain('Private Song');

      // --- Test GET /api/stream/:id Gatekeeper ---

      // Public song can be streamed by anyone
      const streamPub = await request(app).get(`/api/stream/${pubSongId}`);
      expect(streamPub.status).toBe(200);

      // Whitelist song: user_a can stream
      const streamWlAllowed = await request(app)
        .get(`/api/stream/${wlSongId}`)
        .set('X-Client-Username', 'user_a');
      expect(streamWlAllowed.status).toBe(200);

      // Whitelist song: user_d gets 403 Forbidden
      const streamWlDenied = await request(app)
        .get(`/api/stream/${wlSongId}`)
        .set('X-Client-Username', 'user_d');
      expect(streamWlDenied.status).toBe(403);

      // Private song: user_b can stream
      const streamPrivOwner = await request(app)
        .get(`/api/stream/${privSongId}`)
        .set('X-Client-Username', 'user_b');
      expect(streamPrivOwner.status).toBe(200);

      // Private song: user_a gets 403 Forbidden
      const streamPrivDenied = await request(app)
        .get(`/api/stream/${privSongId}`)
        .set('X-Client-Username', 'user_a');
      expect(streamPrivDenied.status).toBe(403);
    });
  });

  describe('2. Deduplication on Identical Hash & Independent Personalization (Option 1)', () => {
    it('reuses physical audio file on identical hash but stores separate metadata and chapters for each user', async () => {
      const commonHash = 'p2:identical_mixtape_123';

      // User A uploads mixtape with 3 chapters
      const metaA = encodeURIComponent(
        JSON.stringify({
          chapters: [
            { id: 'ch-1', title: 'Intro', startTime: 0, endTime: 60 },
            { id: 'ch-2', title: 'Drop', startTime: 60, endTime: 180 },
            { id: 'ch-3', title: 'Outro', startTime: 180, endTime: 240 },
          ],
        })
      );

      const resA = await request(app)
        .post('/api/upload?filename=mixtape_user_a.mp3')
        .set('X-Client-Username', 'user_a')
        .set('X-Song-Title', "User A's Custom Mixtape")
        .set('X-Song-Artist', 'DJ Walker')
        .set('X-Song-Hash', commonHash)
        .set('X-Song-Metadata', metaA)
        .send(dummyAudioBuffer);

      expect(resA.status).toBe(200);
      const songA = resA.body.song;
      expect(songA.chapters).toHaveLength(3);
      expect(songA.uploader).toBe('user_a');

      // User B uploads the exact same file with 0 chapters and different title
      const resB = await request(app)
        .post('/api/upload?filename=mixtape_user_b.mp3')
        .set('X-Client-Username', 'user_b')
        .set('X-Song-Title', 'Original Radio Mix')
        .set('X-Song-Artist', 'Alan Walker')
        .set('X-Song-Hash', commonHash)
        .send(dummyAudioBuffer);

      expect(resB.status).toBe(200);
      const songB = resB.body.song;
      expect(songB.chapters).toBeUndefined();
      expect(songB.uploader).toBe('user_b');

      // 1. Both records have distinct IDs
      expect(songA.id).not.toBe(songB.id);

      // 2. Both records share the exact same physical audio file on disk
      const recA = storage.getRecord(songA.id);
      const recB = storage.getRecord(songB.id);
      expect(recA).toBeDefined();
      expect(recB).toBeDefined();
      expect(recA!.physicalPath).toBe(recB!.physicalPath);

      // RefCount in storage should be 2
      const audioEntry = storage.getAudioFile(commonHash);
      expect(audioEntry).toBeDefined();
      expect(audioEntry!.refCount).toBe(2);
      const sharedPhysicalFile = audioEntry!.physicalPath;
      expect(fs.existsSync(sharedPhysicalFile)).toBe(true);

      // 3. User A deletes their song
      const delResA = await request(app)
        .delete(`/api/songs/${songA.id}`)
        .set('X-Client-Username', 'user_a');
      expect(delResA.status).toBe(200);

      // Record A is gone, but physical file MUST NOT be deleted because User B still uses it!
      expect(storage.getRecord(songA.id)).toBeUndefined();
      expect(storage.getRecord(songB.id)).toBeDefined();
      expect(fs.existsSync(sharedPhysicalFile)).toBe(true);
      expect(storage.getAudioFile(commonHash)!.refCount).toBe(1);

      // 4. User B deletes their song
      const delResB = await request(app)
        .delete(`/api/songs/${songB.id}`)
        .set('X-Client-Username', 'user_b');
      expect(delResB.status).toBe(200);

      // Now refCount reaches 0, physical file should be cleanly deleted from disk!
      expect(storage.getRecord(songB.id)).toBeUndefined();
      expect(storage.getAudioFile(commonHash)).toBeUndefined();
      expect(fs.existsSync(sharedPhysicalFile)).toBe(false);
    });
  });

  describe('3. Users Statistics & Uploader Filtering (Selective Sync)', () => {
    it('returns summary of uploaders and supports filtering songs by uploader', async () => {
      // Upload songs for alex and bob
      await request(app)
        .post('/api/upload?filename=alex_song.mp3')
        .set('X-Client-Username', 'alex')
        .set('X-Song-Title', 'Alex Song 1')
        .set('X-Song-Hash', 'alex_hash_1')
        .set('X-Song-Visibility', 'public')
        .send(dummyAudioBuffer);

      await request(app)
        .post('/api/upload?filename=alex_song2.mp3')
        .set('X-Client-Username', 'alex')
        .set('X-Song-Title', 'Alex Song 2')
        .set('X-Song-Hash', 'alex_hash_2')
        .set('X-Song-Visibility', 'public')
        .send(dummyAudioBuffer);

      await request(app)
        .post('/api/upload?filename=bob_song.mp3')
        .set('X-Client-Username', 'bob')
        .set('X-Song-Title', 'Bob Song')
        .set('X-Song-Hash', 'bob_hash_1')
        .set('X-Song-Visibility', 'public')
        .send(dummyAudioBuffer);

      // GET /api/users
      const usersRes = await request(app).get('/api/users');
      expect(usersRes.status).toBe(200);
      expect(usersRes.body.users).toBeDefined();
      const alexSummary = usersRes.body.users.find((u: ServerUserSummary) => u.username === 'alex');
      const bobSummary = usersRes.body.users.find((u: ServerUserSummary) => u.username === 'bob');
      expect(alexSummary.songCount).toBe(2);
      expect(bobSummary.songCount).toBe(1);

      // Filter GET /api/songs?uploader=bob
      const bobOnlyRes = await request(app).get('/api/songs?uploader=bob');
      expect(bobOnlyRes.status).toBe(200);
      expect(bobOnlyRes.body).toHaveLength(1);
      expect(bobOnlyRes.body[0].title).toBe('Bob Song');
      expect(bobOnlyRes.body[0].uploader).toBe('bob');
    });

    it('prevents non-owner from updating or deleting someone elses song', async () => {
      const uploadRes = await request(app)
        .post('/api/upload?filename=locked_song.mp3')
        .set('X-Client-Username', 'alex')
        .set('X-Song-Title', 'Alex Locked Song')
        .set('X-Song-Visibility', 'private')
        .send(dummyAudioBuffer);

      const songId = uploadRes.body.song.id;

      // Bob attempts to edit permissions -> 403 Forbidden
      const patchForbidden = await request(app)
        .patch(`/api/songs/${songId}`)
        .set('X-Client-Username', 'bob')
        .send({ visibility: 'public' });
      expect(patchForbidden.status).toBe(403);

      // Bob attempts to delete Alex's song -> 403 Forbidden
      const delForbidden = await request(app)
        .delete(`/api/songs/${songId}`)
        .set('X-Client-Username', 'bob');
      expect(delForbidden.status).toBe(403);

      // Alex (owner) can edit permissions
      const patchOwner = await request(app)
        .patch(`/api/songs/${songId}`)
        .set('X-Client-Username', 'alex')
        .send({ visibility: 'public' });
      expect(patchOwner.status).toBe(200);
      expect(patchOwner.body.song.visibility).toBe('public');
    });
  });
});
