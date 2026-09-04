import type { Song, ServerHealth, LibraryDiffRequest, LibraryDiffResult } from '@music/types';

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

  public static async fetchSongs(
    baseUrl: string,
    timeoutMs: number = 10000
  ): Promise<{ ok: boolean; songs: Song[]; error?: string }> {
    const normalized = this.normalizeUrl(baseUrl);
    if (!normalized) {
      return { ok: false, songs: [], error: 'URL không hợp lệ' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${normalized}/api/songs`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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

