process.env.YOUTUBE_DL_SKIP_PYTHON_CHECK = '1'

import { app, BrowserWindow, protocol, session, ipcMain, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import fs from 'node:fs/promises'
import log from 'electron-log'
import { fileURLToPath } from 'node:url'

(globalThis as Record<string, unknown>).__electronLog = log;

// --- CONFIG THE PHYSICAL LOGGER (electron-log) ---
if (app) {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.melovista.app');
  }

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
import { setupStorageIPC, storageAdapter } from './ipc/storage'
import { setupDownloaderIPC } from './ipc/downloader'
import { setupDialogIPC } from './ipc/dialog'
import { setupServerIPC } from './ipc/server'
import { logFileTrace } from './infrastructure/FileTraceLogger'
import themeScss from '../src/presentations/components/Theme/ThemeProvider.scss?raw'
import { extractThemeBackgroundColors } from './utils/themeScssParser'

const THEME_BACKGROUND_COLORS = extractThemeBackgroundColors(themeScss)

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

async function createWindow() {
  const settings = await storageAdapter.getSettings()
  const userTheme = settings?.appearance?.theme || 'midnight'
  const backgroundColor = THEME_BACKGROUND_COLORS[userTheme] || THEME_BACKGROUND_COLORS['midnight'] || '#0a0a0a'

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC as string, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      autoplayPolicy: 'no-user-gesture-required',
    },
  })

  // Tự động mở toàn màn hình (Maximized) ngay lập tức (Zero-Latency)
  win.maximize()

  // Đảm bảo tất cả các liên kết target="_blank" mở trên trình duyệt hệ thống
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// --- HÀM XỬ LÝ AUTO UPDATE (CƠ CHẾ BROADCAST) ---
async function setupAutoUpdate() {
  autoUpdater.logger = log

  // Đọc cấu hình từ storageAdapter đã được khởi tạo
  const settings = await storageAdapter.getSettings();
  const isAutoUpdateEnabled = settings?.general?.autoUpdate !== false // Mặc định là true

  const isUnpackedTest = app.getAppPath().includes('unpacked');
  const isDev = !app.isPackaged || isUnpackedTest;

  const broadcast = (channel: string, data?: unknown) => {
    BrowserWindow.getAllWindows().forEach((w) => {
      w.webContents.send(channel, data)
    })
  }

  const simulateUpdate = () => {
    log.info('[Updater] Bắt đầu giả lập cập nhật...');
    
    setTimeout(() => {
      // 1. Check update available
      broadcast('update-available', '2.0.0-mock');
      log.info('[Updater] Giả lập: Đã tìm thấy bản cập nhật mới: 2.0.0-mock');
      
      // 2. Download progress
      let percent = 0;
      const interval = setInterval(() => {
        percent += 20;
        broadcast('update-progress', percent);
        log.info(`[Updater] Giả lập tiến độ tải: ${percent}%`);
        
        if (percent >= 100) {
          clearInterval(interval);
          // 3. Downloaded
          setTimeout(() => {
            broadcast('update-downloaded');
            log.info('[Updater] Giả lập: Tải xong bản cập nhật.');
          }, 1000);
        }
      }, 1000);
    }, 2000);
  };

  // Đăng ký IPC handler cho kiểm tra thủ công (Luôn luôn đăng ký dù có bật auto-update hay không!)
  ipcMain.removeHandler('check-for-updates-manual');
  ipcMain.handle('check-for-updates-manual', async () => {
    log.info('[Updater] Yêu cầu kiểm tra cập nhật thủ công.')
    if (isDev) {
      log.info('[Updater] Chạy ở Development - Giả lập luồng check update thủ công.')
      simulateUpdate()
      return { success: true, version: '2.0.0-mock' }
    } else {
      try {
        const result = await autoUpdater.checkForUpdates()
        return { success: true, version: result?.updateInfo.version }
      } catch (err) {
        log.error('[Updater] Lỗi khi kiểm tra cập nhật thủ công:', err)
        return { success: false, error: String(err) }
      }
    }
  })

  if (!isAutoUpdateEnabled) {
    log.info('[Updater] Tự động cập nhật bị tắt theo cài đặt người dùng.')
    return
  }

  if (isDev) {
    log.info('[Updater] Chạy ở Development - Bật chế độ MOCK UPDATE trên startup.');
    
    // Chờ window load xong để đảm bảo React đã mount và lắng nghe event
    if (win) {
      win.webContents.on('did-finish-load', () => {
        log.info('[Updater] Window đã load xong. Sẽ chạy giả lập update sau 5 giây...');
        setTimeout(simulateUpdate, 5000);
      });
    } else {
      // Fallback nếu win chưa được tạo (thường thì đã tạo rồi)
      setTimeout(simulateUpdate, 5000);
    }
    
    
    // IPC handler đã được đăng ký ở trên để dùng chung
    return
    
    return
  }

  log.info('[Updater] Bắt đầu kiểm tra bản cập nhật mới...')
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('checking-for-update', () => {
    log.info('[Updater] Đang kiểm tra cập nhật...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info(`[Updater] Đã tìm thấy bản cập nhật mới: ${info.version}`)
    broadcast('update-available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    log.info('[Updater] Không có bản cập nhật nào mới.')
    broadcast('update-not-available')
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
    
    let uiMessage = err.message || 'Đã có lỗi xảy ra khi kiểm tra cập nhật.';
    
    // Nếu lỗi là 404 khi tìm latest.yml (do chưa publish release)
    if (uiMessage.includes('latest.yml') && uiMessage.includes('404')) {
      uiMessage = 'Chưa có bản phân phối phát hành cho phiên bản này (Lỗi 404 Not Found). Vui lòng đợi bản Build hoàn tất!';
    } 
    // Lỗi mạng
    else if (uiMessage.includes('net::ERR_INTERNET_DISCONNECTED') || uiMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
      uiMessage = 'Không thể kết nối đến máy chủ cập nhật. Vui lòng kiểm tra kết nối mạng của bạn.';
    }
    // Rút gọn nếu log quá dài
    else if (uiMessage.length > 150) {
      uiMessage = uiMessage.substring(0, 150) + '... (Xem log để biết thêm)';
    }

    broadcast('update-error', uiMessage)
  })

  // IPC handler đã được đăng ký ở trên để dùng chung
}

// Lắng nghe lệnh yêu cầu khởi động lại từ React
ipcMain.handle('restart-app', async () => {
  const isUnpackedTest = app.getAppPath().includes('unpacked');
  const isDev = !app.isPackaged || isUnpackedTest;

  if (isDev) {
    log.info('[Updater] Chạy ở Dev - Giả lập thông báo khởi động lại.');
    await dialog.showMessageBox({
      type: 'info',
      title: 'Mock Update',
      message: 'Ứng dụng đang chạy ở môi trường Dev. Luồng Mock Update đã hoàn thành!\n\nNếu ở bản thật, ứng dụng sẽ tự đóng và cài đặt bản cập nhật.',
      buttons: ['Đóng']
    });
    return;
  }

  autoUpdater.quitAndInstall()
})

// Lắng nghe lệnh kiểm tra cập nhật thủ công đã được chuyển vào trong setupAutoUpdate
// ------------------------------------

ipcMain.handle('quit-app', () => {
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error)
  }
})

app.whenReady().then(async () => {
  // Protocol handler for melovista://app/{encodedFilePath}
  protocol.handle('melovista', async (request) => {
    // Xử lý CORS Preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Accept, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

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
          let buffer: Buffer = Buffer.alloc(0)
          let bytesRead = 0
          try {
            buffer = Buffer.alloc(chunkSize)
            const readResult = await fileHandle.read(buffer, 0, chunkSize, start)
            bytesRead = readResult.bytesRead
          } finally {
            await fileHandle.close()
          }

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

          return new Response(buffer as unknown as BodyInit, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunkSize),
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
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
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logFileTrace('melovistaProtocol', filePath, 'FAIL', message)
      console.error('melovista:// protocol error:', err)
      return new Response('File not found', { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }
  })

  // Inject CSP headers dynamically based on environment
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !!VITE_DEV_SERVER_URL

    // In Dev, we need 'unsafe-eval' for Vite HMR. In Prod, we strip it out.
    const csp = isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http: melovista://app/*; media-src 'self' melovista://app/* http: https: blob:; connect-src 'self' http: https: ws: wss:;"
      : "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http: melovista://app/*; media-src 'self' melovista://app/* http: https: blob:; connect-src 'self' http: https: ws: wss:;"

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
  setupDialogIPC()
  setupServerIPC()
  await createWindow()

  // Khởi chạy cơ chế tự động cập nhật
  setupAutoUpdate()
})
