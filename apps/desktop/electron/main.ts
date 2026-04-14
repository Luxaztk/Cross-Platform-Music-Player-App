process.env.YOUTUBE_DL_SKIP_PYTHON_CHECK = '1';

import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { normalizePathForHash } from '@music/utils';
import { setupLibraryIPC } from './ipc/library';
import { setupStorageIPC } from './ipc/storage';
import { setupDownloaderIPC } from './ipc/downloader';
import { logFileTrace } from './infrastructure/FileTraceLogger';

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

// [MIME_TYPES removed: net.fetch handles detection naturally]

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

app.whenReady().then(async () => {
  const COVERS_DIR = path.join(app.getPath('userData'), 'cache', 'covers');

  protocol.handle('melovista', async (request) => {
    const rawUrl = request.url;
    let decodedString = '';
    let requestType = '';

    // 1. NHẬN DIỆN ĐƯỜNG CAO TỐC (Dựa vào Hostname)
    if (rawUrl.startsWith('melovista://app/')) {
      requestType = 'image';
      decodedString = decodeURIComponent(rawUrl.slice('melovista://app/'.length));
    } else if (rawUrl.startsWith('melovista://stream/')) {
      requestType = 'audio';
      decodedString = decodeURIComponent(rawUrl.slice('melovista://stream/'.length));
    } else if (rawUrl.startsWith('melovista:///')) {
      // Đề phòng trường hợp UI vẫn dùng ///
      requestType = 'audio';
      decodedString = decodeURIComponent(rawUrl.slice('melovista:///'.length));
    }

    try {
      logFileTrace('melovistaProtocol.resolvePath', filePath, 'SUCCESS', 'Resolved request URL to absolute path');
      const fileStat = await fs.stat(filePath);
      logFileTrace('melovistaProtocol.stat', filePath, 'SUCCESS', `File exists and size ${fileStat.size}`);

      const fileSize = fileStat.size;
      const ext = path.extname(filePath).toLowerCase();
      const contentType = AUDIO_MIME_TYPES[ext] || 'application/octet-stream';

    // ==========================================
    // NHÁNH 1: XỬ LÝ ẢNH BÌA
    // ==========================================
    if (requestType === 'image') {
      const hash = crypto.createHash('md5').update(normalizePathForHash(rawPath)).digest('hex');
      const coverPath = path.join(COVERS_DIR, `${hash}.jpg`);

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
          const chunkSize = end - start + 1;
          const fileHandle = await fs.open(filePath, 'r');
          const buffer = Buffer.alloc(chunkSize);
          const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, start);
          await fileHandle.close();

          if (bytesRead === 0) {
            logFileTrace('melovistaProtocol.readRange', filePath, 'EMPTY_BUFFER', `Requested ${chunkSize} bytes from ${start}-${end}`);
          } else {
            logFileTrace('melovistaProtocol.readRange', filePath, 'SUCCESS', `Read ${bytesRead}/${chunkSize} bytes`);
          }

          return new Response(buffer, {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunksize),
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*' // Chìa khóa để Player không báo lỗi
            },
          });
        } else {
          const buffer = await fs.readFile(rawPath);
          return new Response(buffer, {
            status: 200,
            headers: {
              'Accept-Ranges': 'bytes',
              'Content-Length': String(fileSize),
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*'
            },
          });
        }
      } catch (err: any) {
        console.error('[AUDIO STREAM ERROR]', err.message);
        return new Response('File not found', { status: 404 });
      }

      const buffer = await fs.readFile(filePath);
      logFileTrace('melovistaProtocol.readFull', filePath, buffer.length === 0 ? 'EMPTY_BUFFER' : 'SUCCESS', `Loaded full file, ${buffer.length} bytes`);

      return new Response(buffer, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logFileTrace('melovistaProtocol', filePath, 'FAIL', message);
      console.error('melovista:// protocol error:', err);
      return new Response('File not found', { status: 404 });
    }

    return new Response('Bad Request', { status: 400 });
  });

  // Inject CSP headers dynamically based on environment
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!VITE_DEV_SERVER_URL;

    // [FIX CSP]: Đổi melovista://* thành melovista: cho cả img-src và media-src
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: melovista:; media-src 'self' melovista:; connect-src 'self' http://localhost:5173 ws://localhost:5173;"
      : "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: melovista:; media-src 'self' melovista:; connect-src 'self';";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  setupLibraryIPC();
  await setupStorageIPC();
  setupDownloaderIPC();
  setupDialogIPC();
  createWindow();
});