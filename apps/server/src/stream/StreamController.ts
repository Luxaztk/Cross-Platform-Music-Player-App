import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
};

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function streamAudioFile(req: Request, res: Response, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const mimeType = getMimeType(filePath);
  const range = req.headers.range;

  // CORS & Range headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', mimeType);

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);

    res.on('close', () => {
      stream.destroy();
    });

    stream.on('error', (err) => {
      console.error('[StreamController] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', mimeType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    res.on('close', () => {
      stream.destroy();
    });

    stream.on('error', (err) => {
      console.error('[StreamController] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
  }
}
