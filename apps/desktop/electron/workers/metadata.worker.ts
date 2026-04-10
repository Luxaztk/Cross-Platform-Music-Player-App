import { parentPort } from 'node:worker_threads';
import * as mm from 'music-metadata';
import path from 'node:path';
import NodeID3 from 'node-id3';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'node:fs/promises';
import { splitArtists, normalizePathForHash } from '@music/utils';

// Re-using the logic from MainMetadataService
interface NodeID3Lyric {
  language?: string;
  text: string;
}

function isNodeID3Lyric(obj: unknown): obj is NodeID3Lyric {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'text' in obj &&
    typeof (obj as Record<string, unknown>).text === 'string'
  );
}

async function calculateAudioHash(filePath: string): Promise<string> {
  const runFfmpeg = (offset: number): Promise<Buffer> => {
    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath.path, [
        '-ss', offset.toString(),
        '-t', '30',
        '-i', filePath,
        '-f', 's16le',
        '-ac', '1',
        '-ar', '8000',
        '-loglevel', 'error',
        '-'
      ]);

      let pcmData = Buffer.alloc(0);
      ffmpeg.stdout.on('data', (chunk) => { pcmData = Buffer.concat([pcmData, chunk]); });
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(pcmData);
        else resolve(Buffer.alloc(0));
      });
      ffmpeg.on('error', () => resolve(Buffer.alloc(0)));
    });
  };

  let pcm = await runFfmpeg(30);
  if (pcm.length === 0) {
    pcm = await runFfmpeg(0);
  }

  if (pcm.length === 0) {
    return `error-fallback-v2-${Date.now()}`;
  }

  const numWindows = 64;
  const bytesPerSample = 2;
  const windowSize = Math.floor(pcm.length / bytesPerSample / numWindows);
  const envelope: string[] = [];

  for (let i = 0; i < numWindows; i++) {
    let sumSquare = 0;
    let actualSamples = 0;
    for (let j = 0; j < windowSize; j++) {
      const idx = (i * windowSize + j) * bytesPerSample;
      if (idx + 1 >= pcm.length) break;
      const sample = pcm.readInt16LE(idx);
      sumSquare += (sample / 32768) ** 2;
      actualSamples++;
    }
    const rms = actualSamples > 0 ? Math.sqrt(sumSquare / actualSamples) : 0;
    const charCode = Math.min(35, Math.floor(rms * 100));
    envelope.push(charCode.toString(36));
  }

  return `p2:${envelope.join('')}`;
}

async function extractMetadata(rawFilePath: string, sourceUrl?: string, originId?: string, coversDir?: string) {
  // [FIX] Ép chuẩn NFC ngay lập tức cho Windows File System
  const filePath = rawFilePath.normalize('NFC');
  
  console.log(`\n--- [WORKER ĐANG CHẠY] ---`);
  console.log(`1. Bài hát: ${filePath}`);
  console.log(`2. Thư mục coversDir nhận được: ${coversDir || 'BỊ UNDEFINED RỒI!!!'}`);
  try {
    const stats = await fs.stat(filePath);
    const metadata = await mm.parseFile(filePath);
    const { common, format } = metadata;

    console.log(`3. Bài này có chứa ảnh bìa gốc không?: ${common.picture ? 'CÓ' : 'KHÔNG'}`);
    let coverArt: string | null = null;
    if (coversDir) {
      // Băm MD5 bằng hàm Sắt đá (chữ thường toàn bộ)
      const hash = createHash('md5').update(normalizePathForHash(filePath)).digest('hex');
      const coverPath = path.join(coversDir, `${hash}.jpg`);

      // 2. SMART RESOLUTION: Kiểm tra xem Downloader đã tải ảnh này về trước đó chưa?
      try {
        await fs.access(coverPath, fs.constants.F_OK);
        // Nếu không văng lỗi -> File đã tồn tại! Lấy luôn
        coverArt = `melovista://app/${encodeURIComponent(filePath)}`;
        console.log(`[WORKER] Đã nhận diện được ảnh ngoài (External Cover): ${coverPath}`);
      } catch {
        // 3. Nếu file không tồn tại, rơi vào Fallback: Bóc từ ID3 Tag (nhạc Local)
        if (common.picture && common.picture.length > 0) {
          try {
            await fs.mkdir(coversDir, { recursive: true });
            await fs.writeFile(coverPath, common.picture[0].data);
            coverArt = `melovista://app/${encodeURIComponent(filePath)}`;
            console.log(`[WORKER] Đã bóc tách và lưu ảnh gốc ID3: ${coverPath}`);
          } catch (err) {
            console.error("[WORKER] Lỗi khi lưu ảnh ID3:", err);
          }
        }
      }
    }

    const audioHash = await calculateAudioHash(filePath);
    const rawArtist = common.artist || 'Unknown Artist';
    const artists = (common.artists && common.artists.length > 0)
      ? common.artists.flatMap(a => splitArtists(a))
      : splitArtists(rawArtist);

    let finalOriginId = originId;
    let finalSourceUrl = sourceUrl;
    let syncedLyrics: string | undefined;
    let plainLyrics: string | undefined;
    let lyricId: string | undefined;

    try {
      const tags = NodeID3.read(filePath);
      if (tags) {
        if (tags.userDefinedText) {
          for (const t of tags.userDefinedText) {
            if (t.description === 'melovista_origin_id' && !finalOriginId) finalOriginId = t.value;
            if (t.description === 'melovista_source_url' && !finalSourceUrl) finalSourceUrl = t.value;
            if (t.description === 'melovista_lyric_id') lyricId = t.value;
            if (t.description === 'melovista_lrc' && !syncedLyrics) syncedLyrics = t.value;
          }
        }
        if (tags.unsynchronisedLyrics) {
          if (Array.isArray(tags.unsynchronisedLyrics)) {
            const firstItem = tags.unsynchronisedLyrics[0];
            if (isNodeID3Lyric(firstItem)) plainLyrics = firstItem.text;
          } else if (isNodeID3Lyric(tags.unsynchronisedLyrics)) {
            plainLyrics = tags.unsynchronisedLyrics.text;
          }
        }
      }
    } catch (e) {
      console.error("Worker failed to read ID3 tags:", e);
    }

    return {
      id: randomUUID(),
      filePath,
      title: (common.title || path.basename(filePath, path.extname(filePath)))
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      artist: rawArtist,
      artists: artists,
      album: common.album || 'Unknown Album',
      duration: isFinite(format.duration || 0) ? (format.duration || 0) : 0,
      genre: common.genre ? common.genre.join(', ') : 'Unknown Genre',
      year: common.year || null,
      coverArt,
      hash: audioHash,
      fileSize: stats.size,
      sourceUrl: finalSourceUrl,
      originId: finalOriginId,
      lyricId: lyricId ? parseInt(lyricId) : undefined,
      lyrics: plainLyrics,
      syncedLyrics: syncedLyrics
    };
  } catch (error) {
    console.error(`Worker error extracting metadata for ${filePath}:`, error);
    return null;
  }
}

if (parentPort) {
  parentPort.on('message', async (message) => {
    const { type, payload } = message;

    if (type === 'EXTRACT_METADATA') {
      const { filePath, sourceUrl, originId, coversDir } = payload;
      const result = await extractMetadata(filePath, sourceUrl, originId, coversDir);
      parentPort?.postMessage({ type: 'EXTRACT_METADATA_RESULT', payload: result });
    }

    // Multiple metadata extraction (Batch) - optimized for message passing
    if (type === 'BATCH_EXTRACT_METADATA') {
      const { items, coversDir } = payload;
      const results = [];
      for (const item of items) {
        const result = await extractMetadata(item.filePath, item.sourceUrl, item.originId, coversDir);
        if (result) results.push(result);
      }
      parentPort?.postMessage({ type: 'BATCH_EXTRACT_METADATA_RESULT', payload: results });
    }
  });
}
