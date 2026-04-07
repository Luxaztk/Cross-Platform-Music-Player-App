import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setupLibraryIPC } from './ipc/library';
import { setupStorageIPC } from './ipc/storage';

// Register custom scheme BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'melovista', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

// MIME type lookup for audio files
const AUDIO_MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.wav': 'audio/wav',
  '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma', '.opus': 'audio/opus',
};

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  // Protocol handler for melovista://app/{encodedFilePath}
  // Supports HTTP Range requests for audio seeking
  protocol.handle('melovista', async (request) => {
    const url = new URL(request.url);
    let filePath = decodeURIComponent(url.pathname);
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1);
    }

    try {
      const fileStat = await fs.stat(filePath);
      const fileSize = fileStat.size;
      const ext = path.extname(filePath).toLowerCase();
      const contentType = AUDIO_MIME_TYPES[ext] || 'application/octet-stream';

      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        // Parse "bytes=START-END" (END is optional)
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          const fileHandle = await fs.open(filePath, 'r');
          const buffer = Buffer.alloc(chunkSize);
          await fileHandle.read(buffer, 0, chunkSize, start);
          await fileHandle.close();

          return new Response(buffer, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunkSize),
              'Content-Type': contentType,
            },
          });
        }
      }

      // No Range header → return full file with Accept-Ranges to advertise support
      const buffer = await fs.readFile(filePath);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
        },
      });
    } catch (err) {
      console.error('melovista:// protocol error:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  // Inject CSP headers dynamically based on environment
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!VITE_DEV_SERVER_URL;
    
    // In Dev, we need 'unsafe-eval' for Vite HMR. In Prod, we strip it out.
    const csp = isDev 
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: melovista://app/*; media-src 'self' melovista://app/*; connect-src 'self' http://localhost:5173 ws://localhost:5173;" 
      : "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: melovista://app/*; media-src 'self' melovista://app/*; connect-src 'self';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  setupLibraryIPC();
  setupStorageIPC();
  createWindow();
});
