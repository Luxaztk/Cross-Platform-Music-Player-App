import { app, BrowserWindow, protocol, net, session } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setupLibraryIPC } from './ipc/library';
import { setupStorageIPC } from './ipc/storage';

// Register custom scheme BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'melovista', privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    // icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'), // Vite builds preload as .mjs by default with esm
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools();
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
  // Protocol handler for melovista://
  protocol.handle('melovista', (request) => {
    const url = request.url;
    const prefix = 'melovista://';
    const filePath = decodeURIComponent(url.slice(prefix.length));
    const targetUrl = pathToFileURL(filePath).toString();
    return net.fetch(targetUrl);
  });

  // Inject CSP headers dynamically based on environment
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!VITE_DEV_SERVER_URL;
    
    // In Dev, we need 'unsafe-eval' for Vite HMR. In Prod, we strip it out.
    const csp = isDev 
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: melovista:; media-src 'self' melovista:; connect-src 'self' http://localhost:5173 ws://localhost:5173;" 
      : "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: melovista:; media-src 'self' melovista:; connect-src 'self';";

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
