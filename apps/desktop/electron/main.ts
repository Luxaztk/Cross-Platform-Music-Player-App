process.env.YOUTUBE_DL_SKIP_PYTHON_CHECK = '1'

import { app, BrowserWindow, protocol, session, ipcMain } from 'electron' // Xóa 'dialog', thêm 'ipcMain'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs/promises'
import log from 'electron-log'
import { fileURLToPath } from 'node:url'

// --- CONFIG THE PHYSICAL LOGGER (electron-log) ---
if (app) {
  const logFolder = path.join(app.getPath('userData'), 'logs');
  log.transports.file.resolvePathFn = () => path.join(logFolder, 'main.log');

  // 1. Enforce File Logs globally (even in production)
  log.transports.file.level = 'info';

  // 2. Enforce File Size Limit (Safety Guard: 5MB)
  log.transports.file.maxSize = 5 * 1024 * 1024;

  // 3. Disable Console output in Production to keep UI/Terminal clean
  log.transports.console.level = app.isPackaged ? false : 'silly';

  // Auto-capture renderer logs and setup IPC listeners
  log.initialize();
  log.errorHandler.startCatching();

  // CRITICAL: Print the exact path to the terminal so the developer can find it
  console.log('\n=======================================');
  console.log('📝 LOG FILE PATH:', log.transports.file.getFile().path);
  console.log('=======================================\n');

  log.info('[System] Logger initialized successfully');
}
// -------------------------------------------------
import { setupLibraryIPC } from './ipc/library'
import { setupStorageIPC } from './ipc/storage'
import { setupDownloaderIPC } from './ipc/downloader'
import { logFileTrace } from './infrastructure/FileTraceLogger'

// Register custom scheme BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'melovista',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
])

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// MIME type lookup for audio files
const AUDIO_MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma',
  '.opus': 'audio/opus',
}

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC as string, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// --- HÀM XỬ LÝ AUTO UPDATE (CƠ CHẾ BROADCAST) ---
function setupAutoUpdate() {
  autoUpdater.logger = log

  // Kiểm tra xem app có đang chạy trong thư mục "win-unpacked" của lệnh build:fast không
  const isUnpackedTest = app.getAppPath().includes('unpacked');

  if (!app.isPackaged || isUnpackedTest) {
    log.info('[Updater] Chạy ở Development hoặc Test Local - Bỏ qua kiểm tra cập nhật.');
    return
  }

  log.info('[Updater] Bắt đầu kiểm tra bản cập nhật mới...')
  autoUpdater.checkForUpdatesAndNotify()

  const broadcast = (channel: string, data?: any) => {
    BrowserWindow.getAllWindows().forEach((w) => {
      w.webContents.send(channel, data)
    })
  }

  autoUpdater.on('checking-for-update', () => {
    log.info('[Updater] Đang kiểm tra cập nhật...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info(`[Updater] Đã tìm thấy bản cập nhật mới: ${info.version}`)
    broadcast('update-available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    log.info('[Updater] Không có bản cập nhật nào mới.')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    log.debug(`[Updater] Tiến độ tải: ${progressObj.percent}%`)
    broadcast('update-progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`[Updater] Bản cập nhật ${info.version} đã tải xong ngầm. Sẵn sàng khởi động lại.`)
    broadcast('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    log.error('[Updater] Lỗi nghiêm trọng khi cập nhật:', err)
  })
}

// Lắng nghe lệnh yêu cầu khởi động lại từ React
ipcMain.handle('restart-app', () => {
  autoUpdater.quitAndInstall()
})
// ------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Protocol handler for melovista://app/{encodedFilePath}
  protocol.handle('melovista', async (request) => {
    const url = new URL(request.url)
    let filePath = decodeURIComponent(url.pathname)
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1)
    }

    try {
      logFileTrace(
        'melovistaProtocol.resolvePath',
        filePath,
        'SUCCESS',
        'Resolved request URL to absolute path',
      )
      const fileStat = await fs.stat(filePath)
      logFileTrace(
        'melovistaProtocol.stat',
        filePath,
        'SUCCESS',
        `File exists and size ${fileStat.size}`,
      )

      const fileSize = fileStat.size
      const ext = path.extname(filePath).toLowerCase()
      const contentType = AUDIO_MIME_TYPES[ext] || 'application/octet-stream'

      const rangeHeader = request.headers.get('range')

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
        if (match) {
          const start = parseInt(match[1], 10)
          const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
          const chunkSize = end - start + 1
          const fileHandle = await fs.open(filePath, 'r')
          const buffer = Buffer.alloc(chunkSize)
          const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, start)
          await fileHandle.close()

          if (bytesRead === 0) {
            logFileTrace(
              'melovistaProtocol.readRange',
              filePath,
              'EMPTY_BUFFER',
              `Requested ${chunkSize} bytes from ${start}-${end}`,
            )
          } else {
            logFileTrace(
              'melovistaProtocol.readRange',
              filePath,
              'SUCCESS',
              `Read ${bytesRead}/${chunkSize} bytes`,
            )
          }

          return new Response(buffer, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunkSize),
              'Content-Type': contentType,
            },
          })
        }
      }

      const buffer = await fs.readFile(filePath)
      logFileTrace(
        'melovistaProtocol.readFull',
        filePath,
        buffer.length === 0 ? 'EMPTY_BUFFER' : 'SUCCESS',
        `Loaded full file, ${buffer.length} bytes`,
      )

      return new Response(buffer, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(fileSize),
          'Content-Type': contentType,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logFileTrace('melovistaProtocol', filePath, 'FAIL', message)
      console.error('melovista:// protocol error:', err)
      return new Response('File not found', { status: 404 })
    }
  })

  // Inject CSP headers dynamically based on environment
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!VITE_DEV_SERVER_URL

    // In Dev, we need 'unsafe-eval' for Vite HMR. In Prod, we strip it out.
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: melovista://app/*; media-src 'self' melovista://app/*; connect-src 'self' http://localhost:5173 ws://localhost:5173;"
      : "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: melovista://app/*; media-src 'self' melovista://app/*; connect-src 'self';"

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })

  setupLibraryIPC()
  setupStorageIPC()
  setupDownloaderIPC()
  createWindow()

  // Khởi chạy cơ chế tự động cập nhật
  setupAutoUpdate()
})
