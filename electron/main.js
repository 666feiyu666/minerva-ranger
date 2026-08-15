// electron/main.js
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, ipcMain, session } = require('electron')
const { registerPersistenceIpc } = require('./persistence/ipc')
const { PersistenceService } = require('./persistence/service')
const { resolveUserDataPath } = require('./userDataPath')

const isSmokeTest = process.env.MINERVA_SMOKE_TEST === '1'
if (isSmokeTest) app.disableHardwareAcceleration()
const defaultUserDataPath = app.getPath('userData')
const configuredUserDataPath = resolveUserDataPath({
  defaultUserDataPath,
  isPackaged: app.isPackaged,
  overridePath: process.env.MINERVA_USER_DATA_DIR,
})
if (configuredUserDataPath !== defaultUserDataPath) {
  app.setPath('userData', configuredUserDataPath)
}
const rendererDirectory =
  !app.isPackaged && process.env.MINERVA_RENDERER_DIR
    ? path.resolve(process.env.MINERVA_RENDERER_DIR)
    : path.join(__dirname, '../dist')
const INDEX_PATH = path.join(rendererDirectory, 'index.html')
let persistenceService = null
let removePersistenceHandlers = null
let isClosingPersistence = false

function getWindowIconPath() {
  const distIconPath = path.join(app.getAppPath(), 'dist', 'favicon.ico')
  if (fs.existsSync(distIconPath)) return distIconPath

  return path.join(__dirname, '../public/favicon.ico')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    title: '密涅瓦的巡林官',
    icon: getWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  })

  win.setMenuBarVisibility(false)
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const expected = pathToFileURL(INDEX_PATH)
    try {
      const candidate = new URL(navigationUrl)
      if (candidate.protocol === 'file:' && candidate.pathname === expected.pathname) return
    } catch {
      // Invalid navigation targets are denied below.
    }
    event.preventDefault()
  })
  void win.loadFile(INDEX_PATH)
  return win
}

function configureSessionSecurity() {
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
}

async function runSmokeTest(win) {
  const userDataPath = path.resolve(app.getPath('userData'))
  if (process.env.MINERVA_EXPECTED_USER_DATA_DIR) {
    const expectedUserDataPath = path.resolve(process.env.MINERVA_EXPECTED_USER_DATA_DIR)
    if (userDataPath.toLowerCase() !== expectedUserDataPath.toLowerCase()) {
      throw new Error(
        `Electron userData 路径不符合预期：${userDataPath} !== ${expectedUserDataPath}`,
      )
    }
  }

  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    const diagnostics = await persistenceService.getDiagnostics()
    const renderer = await win.webContents.executeJavaScript(`({
      bridge: Boolean(window.minervaDesktopPersistence),
      hasDefaultIdentity: document.body.textContent.includes('开发设计师')
    })`)
    if (diagnostics.revision >= 1 && renderer.bridge && renderer.hasDefaultIdentity) {
      console.log(
        JSON.stringify({
          ok: true,
          run: process.env.MINERVA_SMOKE_RUN || 'single',
          userDataPath,
          diagnostics,
          renderer,
        }),
      )
      app.quit()
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error('Electron 应用烟雾测试超时。')
}

app.whenReady().then(() => {
  persistenceService = new PersistenceService(app.getPath('userData'))
  removePersistenceHandlers = registerPersistenceIpc({
    ipcMain,
    service: persistenceService,
    indexPath: INDEX_PATH,
    appVersion: app.getVersion(),
  })
  configureSessionSecurity()
  const mainWindow = createWindow()
  if (isSmokeTest) {
    mainWindow.webContents.once('did-finish-load', () => {
      void runSmokeTest(mainWindow).catch((error) => {
        console.error(error)
        app.exit(1)
      })
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', (event) => {
  if (!persistenceService || isClosingPersistence) return
  event.preventDefault()
  isClosingPersistence = true
  void persistenceService.close().finally(() => {
    removePersistenceHandlers?.()
    app.quit()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
