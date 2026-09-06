import type { SongChapter } from '@music/types';

/**
 * Converts timestamp string (e.g. "03:45" or "01:23:45") to total seconds.
 */
export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Clean up title text by stripping track numbering, delimiters, etc.
 */
function cleanChapterTitle(raw: string): { title: string; artist?: string } {
  let cleaned = raw
    // remove leading numbering like "01.", "1 -", "[01]"
    .replace(/^\[?\d+[\].\-\s]+/, '')
    // remove surrounding quotes
    .replace(/^["'“”]+|["'“”]+$/g, '')
    // normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Strip leading/trailing dashes, colons, or pipes
  cleaned = cleaned.replace(/^[-–—:|]+\s*/, '').replace(/\s*[-–—:|]+$/, '').trim();

  if (!cleaned) {
    cleaned = 'Untitled Chapter';
  }

  // Attempt to detect "Artist - Title" pattern
  const splitMatch = cleaned.match(/^([^–—-]+)\s*[-–—]\s*(.+)$/);
  if (splitMatch && splitMatch[1] && splitMatch[2]) {
    return {
      artist: splitMatch[1].trim(),
      title: splitMatch[2].trim(),
    };
  }

  return { title: cleaned };
}

/**
 * Extracts chapters from description or text with timestamp lines.
 * Supported formats:
 * - 00:00 Intro
 * - [03:45] Artist - Song
 * - 01. 05:20 Title
 * - 1:15:30 Epic Trance Track
 * - Track 05 (02:30:10) Name
 */
export function parseChaptersFromText(text: string, totalDuration?: number): SongChapter[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/);
  const chapters: Array<{ startTime: number; title: string; artist?: string }> = [];

  // Regex to detect timestamp: matches optional brackets/parentheses and MM:SS or HH:MM:SS
  const timestampRegex = /(?:\[|\()?\b(\d{1,2}:\d{2}(?::\d{2})?)\b(?:\]|\)?)/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(timestampRegex);
    if (!match || match.index === undefined) continue;

    const timestampStr = match[1];
    const seconds = parseTimestampToSeconds(timestampStr);

    if (totalDuration && totalDuration > 0 && seconds > totalDuration + 5) {
      continue; // Skip timestamps clearly beyond video duration
    }

    // Extract text before and after the timestamp
    const before = line.slice(0, match.index).trim();
    const after = line.slice(match.index + match[0].length).trim();

    // The title is usually after, but sometimes before: e.g. "Song Name - 03:45"
    let titleCandidate = after;
    if (!titleCandidate && before) {
      titleCandidate = before;
    } else if (after && before && before.length > 2 && !/^\d+[.)]?$/.test(before)) {
      // e.g. "Artist - 03:45 - Title"
      titleCandidate = `${before} - ${after}`;
    }

    const { title, artist } = cleanChapterTitle(titleCandidate);

    chapters.push({
      startTime: seconds,
      title,
      artist,
    });
  }

  // Deduplicate and sort by startTime ascending
  chapters.sort((a, b) => a.startTime - b.startTime);

  const uniqueChapters: Array<{ startTime: number; title: string; artist?: string }> = [];
  const seenTimes = new Set<number>();

  for (const ch of chapters) {
    if (!seenTimes.has(ch.startTime)) {
      seenTimes.add(ch.startTime);
      uniqueChapters.push(ch);
    }
  }

  // Calculate endTimes and generate IDs
  return uniqueChapters.map((ch, idx) => {
    const nextChapter = uniqueChapters[idx + 1];
    const endTime = nextChapter ? nextChapter.startTime : totalDuration;

    return {
      id: `ch-${idx}`,
      title: ch.title,
      startTime: ch.startTime,
      endTime: endTime !== undefined && endTime > ch.startTime ? endTime : undefined,
      artist: ch.artist,
    };
  });
}

/**
 * Normalizes raw yt-dlp chapter objects:
 * e.g. [{ start_time: 0, end_time: 120, title: "..." }]
 */
export function normalizeYtDlpChapters(
  rawChapters: Array<{ start_time?: number; end_time?: number; title?: string }>,
  totalDuration?: number
): SongChapter[] {
  if (!Array.isArray(rawChapters) || rawChapters.length === 0) return [];

  const sorted = [...rawChapters].sort((a, b) => (a.start_time ?? 0) - (b.start_time ?? 0));

  return sorted.map((raw, idx) => {
    const startTime = Math.max(0, Math.floor(raw.start_time ?? 0));
    const nextRaw = sorted[idx + 1];
    let endTime = raw.end_time ? Math.floor(raw.end_time) : undefined;

    if (!endTime && nextRaw && nextRaw.start_time !== undefined) {
      endTime = Math.floor(nextRaw.start_time);
    } else if (!endTime && totalDuration) {
      endTime = Math.floor(totalDuration);
    }

    const { title, artist } = cleanChapterTitle(raw.title || `Track ${idx + 1}`);

    return {
      id: `ch-${idx}`,
      title,
      startTime,
      endTime: endTime && endTime > startTime ? endTime : undefined,
      artist,
    };
  });
}

/**
 * High-level extractor: Prefers yt-dlp native chapters, falls back to parsing text description.
 */
export function extractSongChapters(options: {
  rawChapters?: Array<{ start_time?: number; end_time?: number; title?: string }>;
  description?: string;
  totalDuration?: number;
}): SongChapter[] {
  const { rawChapters, description, totalDuration } = options;

  if (rawChapters && Array.isArray(rawChapters) && rawChapters.length > 0) {
    const parsed = normalizeYtDlpChapters(rawChapters, totalDuration);
    if (parsed.length > 0) return parsed;
  }

  if (description) {
    const parsed = parseChaptersFromText(description, totalDuration);
    if (parsed.length > 0) return parsed;
  }

  return [];
}
