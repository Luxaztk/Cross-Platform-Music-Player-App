import type {
  Song,
  ServerHealth,
  LibraryDiffRequest,
  LibraryDiffResult,
  ServerUserSummary,
  SongVisibility,
} from '@music/types';

export interface ServerAuthOptions {
  username?: string;
  token?: string;
}

export interface FetchSongsOptions extends ServerAuthOptions {
  uploader?: string | string[];
  timeoutMs?: number;
}

export class ServerClient {
  public static normalizeUrl(url: string): string {
    let clean = (url || '').trim();
    if (!clean) return '';
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }
    return clean.replace(/\/+$/, '');
  }

  public static async checkHealth(
    baseUrl: string,
    timeoutMs: number = 5000
  ): Promise<{ ok: boolean; health?: ServerHealth; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, error: 'URL không hợp lệ' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${normalized}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, error: `Máy chủ phản hồi mã lỗi: ${response.status}` };
      }

      const data = (await response.json()) as ServerHealth;
      if (data && data.status === 'ok') {
        return { ok: true, health: data };
      }

      return { ok: false, error: 'Máy chủ phản hồi dữ liệu không hợp lệ' };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        return { ok: false, error: 'Hết thời gian chờ phản hồi (Timeout)' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message || 'Không thể kết nối tới máy chủ' };
    }
  }

  public static async fetchUsers(
    baseUrl: string,
    auth?: ServerAuthOptions,
    timeoutMs: number = 5000
  ): Promise<{ ok: boolean; users: ServerUserSummary[]; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, users: [], error: 'URL không hợp lệ' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (auth?.username) headers['X-Client-Username'] = auth.username;
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

    try {
      const response = await fetch(`${normalized}/api/users`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, users: [], error: `Máy chủ phản hồi mã lỗi: ${response.status}` };
      }

      const data = (await response.json()) as { users: ServerUserSummary[] };
      return { ok: true, users: data.users || [] };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        return { ok: false, users: [], error: 'Hết thời gian chờ tải danh sách người dùng (Timeout)' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, users: [], error: message || 'Không thể tải danh sách người dùng' };
    }
  }

  public static async fetchSongs(
    baseUrl: string,
    options?: FetchSongsOptions | number
  ): Promise<{ ok: boolean; songs: Song[]; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, songs: [], error: 'URL không hợp lệ' };
    }

    const opts: FetchSongsOptions = typeof options === 'number' ? { timeoutMs: options } : options || {};
    const timeoutMs = opts.timeoutMs || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.username) headers['X-Client-Username'] = opts.username;
    if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

    let url = `${normalized}/api/songs`;
    if (opts.uploader) {
      const uploaderParam = Array.isArray(opts.uploader) ? opts.uploader.join(',') : opts.uploader;
      url += `?uploader=${encodeURIComponent(uploaderParam)}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, songs: [], error: `Máy chủ phản hồi mã lỗi: ${response.status}` };
      }

      const rawSongs = (await response.json()) as Song[];
      if (!Array.isArray(rawSongs)) {
        return { ok: false, songs: [], error: 'Dữ liệu bài hát không phải danh sách mảng' };
      }

      // Ensure stream URLs are fully qualified
      const songs: Song[] = rawSongs.map((s) => ({
        ...s,
        sourceType: 'stream',
        filePath: s.filePath.startsWith('http') ? s.filePath : `${normalized}/api/stream/${s.id}`,
        streamUrl: s.streamUrl?.startsWith('http') ? s.streamUrl : `${normalized}/api/stream/${s.id}`,
        coverArt: s.coverArt ? (s.coverArt.startsWith('http') ? s.coverArt : `${normalized}/api/cover/${s.id}`) : null,
      }));

      return { ok: true, songs };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        return { ok: false, songs: [], error: 'Hết thời gian chờ tải danh sách bài hát (Timeout)' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, songs: [], error: message || 'Không thể tải danh sách bài hát' };
    }
  }

  public static async updateSongPermissions(
    baseUrl: string,
    songId: string,
    updates: { visibility?: SongVisibility; whitelist?: string[]; songUpdates?: Partial<Song> },
    auth?: ServerAuthOptions,
    timeoutMs: number = 5000
  ): Promise<{ ok: boolean; song?: Song; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, error: 'URL không hợp lệ' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (auth?.username) headers['X-Client-Username'] = auth.username;
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

    try {
      const response = await fetch(`${normalized}/api/songs/${songId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: errorData.error || `Mã lỗi: ${response.status}` };
      }

      const data = (await response.json()) as { success: boolean; song?: Song };
      return { ok: true, song: data.song };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message || 'Không thể cập nhật quyền bài hát' };
    }
  }

  public static async deleteSong(
    baseUrl: string,
    songId: string,
    auth?: ServerAuthOptions,
    timeoutMs: number = 5000
  ): Promise<{ ok: boolean; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, error: 'URL không hợp lệ' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (auth?.username) headers['X-Client-Username'] = auth.username;
    if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

    try {
      const response = await fetch(`${normalized}/api/songs/${songId}`, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: errorData.error || `Mã lỗi: ${response.status}` };
      }

      return { ok: true };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message || 'Không thể xóa bài hát trên máy chủ' };
    }
  }

  public static async checkLibraryDiff(
    baseUrl: string,
    songs: Array<{ id: string; title: string; artist: string; duration: number; hash?: string; fileSize?: number }>,
    timeoutMs: number = 10000
  ): Promise<{ ok: boolean; diff?: LibraryDiffResult; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, error: 'URL không hợp lệ' };
    }

    const payload: LibraryDiffRequest = {
      songs: songs.map((s) => ({
        localId: s.id,
        title: s.title,
        artist: s.artist,
        duration: s.duration,
        hash: s.hash,
        fileSize: s.fileSize,
      })),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${normalized}/api/library/diff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { ok: false, error: `Máy chủ phản hồi mã lỗi: ${response.status}` };
      }

      const diff = (await response.json()) as LibraryDiffResult;
      return { ok: true, diff };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        return { ok: false, error: 'Hết thời gian chờ so khớp thư viện (Timeout)' };
      }
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message || 'Không thể so khớp thư viện với máy chủ' };
    }
  }
}

