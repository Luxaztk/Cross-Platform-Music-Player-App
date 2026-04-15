import ffmpeg from '@ffmpeg-installer/ffmpeg';

/**
 * Resolves the correct path for the FFmpeg binary, handling ASAR unpacking.
 * Handles both the Main process and Worker threads without needing Electron APIs.
 * 
 * Logic: If the path contains 'app.asar', we replace it with 'app.asar.unpacked'.
 * In dev, 'app.asar' is not present, so the path remains unchanged.
 */
export function getFixedFfmpegPath(): string {
  let ffmpegPath = ffmpeg.path;

  // Simple, robust replacement that works in both dev (no-op) and prod
  if (ffmpegPath.includes('app.asar')) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
  }

  return ffmpegPath;
}
