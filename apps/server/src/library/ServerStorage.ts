import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ServerSongRecord, ServerUserSummary, SongVisibility } from '@music/types';

export interface AudioFileEntry {
  audioHash: string;
  physicalPath: string;
  fileSize: number;
  refCount: number;
  createdAt: string;
}

export interface UserEntry {
  username: string;
  createdAt: string;
}

export interface ServerDatabaseSchema {
  version: number;
  records: Record<string, ServerSongRecord>;
  audioFiles: Record<string, AudioFileEntry>;
  users: Record<string, UserEntry>;
}

export function generateRecordId(audioHash: string, uploader: string): string {
  const cleanUploader = (uploader || 'guest').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const cleanHash = (audioHash || crypto.randomUUID()).replace(/^f1:|^p2:/, '').substring(0, 12);
  return `srv-${cleanHash}-${cleanUploader}`;
}

export class ServerStorage {
  private dbPath: string;
  private records = new Map<string, ServerSongRecord>();
  private audioFiles = new Map<string, AudioFileEntry>();
  private users = new Map<string, UserEntry>();
  private isLoaded = false;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.DB_PATH || path.join(process.cwd(), 'data/server_db.json');
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public async init(): Promise<void> {
    if (this.isLoaded) return;

    const dir = path.dirname(this.dbPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Ignore directory create error
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const data = JSON.parse(raw) as Partial<ServerDatabaseSchema>;
        if (data && typeof data === 'object') {
          if (data.records) {
            for (const [id, rec] of Object.entries(data.records)) {
              this.records.set(id, rec);
            }
          }
          if (data.audioFiles) {
            for (const [hash, file] of Object.entries(data.audioFiles)) {
              this.audioFiles.set(hash, file);
            }
          }
          if (data.users) {
            for (const [u, user] of Object.entries(data.users)) {
              this.users.set(u.toLowerCase(), user);
            }
          }
        }
        console.log(`[ServerStorage] Loaded ${this.records.size} song records, ${this.audioFiles.size} audio files, ${this.users.size} users from DB.`);
      } catch (err) {
        console.error(`[ServerStorage] Error reading DB file at ${this.dbPath}:`, err);
      }
    } else {
      await this.saveImmediate();
    }

    this.isLoaded = true;
  }

  public async saveImmediate(): Promise<void> {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const schema: ServerDatabaseSchema = {
      version: 1,
      records: Object.fromEntries(this.records),
      audioFiles: Object.fromEntries(this.audioFiles),
      users: Object.fromEntries(this.users),
    };

    const tempPath = `${this.dbPath}.tmp.${Date.now()}`;
    const jsonStr = JSON.stringify(schema, null, 2);
    fs.writeFileSync(tempPath, jsonStr, 'utf8');

    try {
      fs.renameSync(tempPath, this.dbPath);
    } catch {
      // Fallback for Windows file lock
      fs.copyFileSync(tempPath, this.dbPath);
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignored
      }
    }
  }

  public save(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveImmediate().catch((err) => {
        console.error('[ServerStorage] Failed to save DB in debounce:', err);
      });
    }, 200);
  }

  public canUserAccess(record: ServerSongRecord, username?: string): boolean {
    if (record.visibility === 'public') {
      return true;
    }

    const clientUser = (username || '').trim().toLowerCase();
    if (!clientUser) {
      return false;
    }

    const uploader = (record.uploader || '').toLowerCase();
    if (uploader === clientUser) {
      return true;
    }

    if (record.visibility === 'whitelist') {
      const allowed = (record.whitelist || []).map((w) => w.toLowerCase());
      return allowed.includes(clientUser);
    }

    // private
    return false;
  }

  public getRecord(id: string): ServerSongRecord | undefined {
    return this.records.get(id);
  }

  public getRecords(): ServerSongRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordsForUser(username?: string, filterUploaders?: string[]): ServerSongRecord[] {
    const filterList = filterUploaders && filterUploaders.length > 0
      ? filterUploaders.map((u) => u.toLowerCase().trim())
      : null;

    return Array.from(this.records.values()).filter((record) => {
      if (!this.canUserAccess(record, username)) {
        return false;
      }
      if (filterList) {
        const recUploader = (record.uploader || '').toLowerCase();
        if (!filterList.includes(recUploader)) {
          return false;
        }
      }
      return true;
    });
  }

  public getUsers(): ServerUserSummary[] {
    const userMap = new Map<string, { total: number; publicCount: number }>();

    // Seed with registered users
    for (const u of this.users.keys()) {
      userMap.set(u, { total: 0, publicCount: 0 });
    }

    // Count songs per uploader
    for (const record of this.records.values()) {
      const uploader = (record.uploader || 'anonymous').toLowerCase();
      const current = userMap.get(uploader) || { total: 0, publicCount: 0 };
      current.total += 1;
      if (record.visibility === 'public') {
        current.publicCount += 1;
      }
      userMap.set(uploader, current);
    }

    return Array.from(userMap.entries()).map(([username, counts]) => ({
      username,
      songCount: counts.total,
      publicCount: counts.publicCount,
    }));
  }

  public registerUser(username: string): void {
    const clean = (username || '').trim().toLowerCase();
    if (!clean) return;
    if (!this.users.has(clean)) {
      this.users.set(clean, {
        username: clean,
        createdAt: new Date().toISOString(),
      });
      this.save();
    }
  }

  public getAudioFile(audioHash: string): AudioFileEntry | undefined {
    return this.audioFiles.get(audioHash);
  }

  public registerAudioFile(audioHash: string, physicalPath: string, fileSize: number): AudioFileEntry {
    const existing = this.audioFiles.get(audioHash);
    if (existing) {
      existing.physicalPath = physicalPath;
      existing.fileSize = fileSize;
      return existing;
    }

    const entry: AudioFileEntry = {
      audioHash,
      physicalPath,
      fileSize,
      refCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.audioFiles.set(audioHash, entry);
    return entry;
  }

  public async addSongRecord(record: ServerSongRecord): Promise<void> {
    // Register uploader user
    if (record.uploader) {
      this.registerUser(record.uploader);
    }

    // Ensure audio file refCount
    let audioEntry = this.audioFiles.get(record.audioHash);
    if (!audioEntry) {
      audioEntry = this.registerAudioFile(record.audioHash, record.physicalPath, record.song.fileSize || 0);
    }

    const isNew = !this.records.has(record.id);
    if (isNew) {
      audioEntry.refCount += 1;
    }

    this.records.set(record.id, record);
    await this.saveImmediate();
  }

  public async updateSongRecord(
    id: string,
    updates: {
      visibility?: SongVisibility;
      whitelist?: string[];
      songUpdates?: Partial<ServerSongRecord['song']>;
    }
  ): Promise<ServerSongRecord | null> {
    const record = this.records.get(id);
    if (!record) return null;

    if (updates.visibility) {
      record.visibility = updates.visibility;
      record.song.visibility = updates.visibility;
    }
    if (updates.whitelist !== undefined) {
      record.whitelist = updates.whitelist;
      record.song.whitelist = updates.whitelist;
    }
    if (updates.songUpdates) {
      record.song = {
        ...record.song,
        ...updates.songUpdates,
        updatedAt: new Date().toISOString(),
      };
    }
    record.updatedAt = new Date().toISOString();

    this.records.set(id, record);
    await this.saveImmediate();
    return record;
  }

  public async removeSongRecord(
    id: string
  ): Promise<{ success: boolean; physicalPathToDelete?: string }> {
    const record = this.records.get(id);
    if (!record) {
      return { success: false };
    }

    this.records.delete(id);

    let physicalPathToDelete: string | undefined;
    const audioEntry = this.audioFiles.get(record.audioHash);
    if (audioEntry) {
      audioEntry.refCount = Math.max(0, audioEntry.refCount - 1);
      if (audioEntry.refCount === 0) {
        this.audioFiles.delete(record.audioHash);
        physicalPathToDelete = audioEntry.physicalPath;
      }
    }

    await this.saveImmediate();
    return { success: true, physicalPathToDelete };
  }

  public async pruneOrphans(): Promise<number> {
    let prunedCount = 0;
    const toDeleteIds: string[] = [];

    for (const [id, record] of this.records.entries()) {
      if (!fs.existsSync(record.physicalPath)) {
        toDeleteIds.push(id);
      }
    }

    for (const id of toDeleteIds) {
      const rec = this.records.get(id);
      if (rec) {
        this.records.delete(id);
        const audioEntry = this.audioFiles.get(rec.audioHash);
        if (audioEntry) {
          audioEntry.refCount = Math.max(0, audioEntry.refCount - 1);
          if (audioEntry.refCount === 0) {
            this.audioFiles.delete(rec.audioHash);
          }
        }
        prunedCount += 1;
      }
    }

    // Clean audio files that no longer exist on disk
    for (const [hash, entry] of this.audioFiles.entries()) {
      if (!fs.existsSync(entry.physicalPath)) {
        this.audioFiles.delete(hash);
      }
    }

    if (prunedCount > 0) {
      await this.saveImmediate();
      console.log(`[ServerStorage] Pruned ${prunedCount} orphan song records.`);
    }

    return prunedCount;
  }

  public clearAll(): void {
    this.records.clear();
    this.audioFiles.clear();
    this.users.clear();
    if (fs.existsSync(this.dbPath)) {
      try {
        fs.unlinkSync(this.dbPath);
      } catch {
        // Ignored
      }
    }
  }
}
