import path from 'node:path';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { MusicScanner } from './library/MusicScanner.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4545', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MUSIC_DIR = process.env.MUSIC_DIR || path.join(process.cwd(), 'data/music');

const scanner = new MusicScanner();
const app = createApp(scanner);

async function start() {
  console.log('='.repeat(50));
  console.log('🎵 MeloVista Standalone Streaming Server');
  console.log(`📡 Binding to: http://${HOST}:${PORT}`);
  console.log(`📁 Music Directory: ${MUSIC_DIR}`);
  console.log('='.repeat(50));

  // Initial Scan
  try {
    const count = await scanner.scanDirectory(MUSIC_DIR);
    console.log(`[Server] Initial scan completed: ${count} songs indexed.`);
  } catch (err) {
    console.error('[Server] Initial scan error:', err);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Server] Streaming server is LIVE and ready at http://${HOST}:${PORT}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [Server Error] Port ${PORT} is already in use by another process!`);
      console.error(`👉 Please terminate the process using port ${PORT} or configure a different PORT.\n`);
    } else {
      console.error('\n❌ [Server Error]:', err);
    }
    process.exit(1);
  });
}

void start();
