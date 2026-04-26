// electron/main.js
const fs = require('node:fs')
const { app, BrowserWindow } = require('electron')
const path = require('path')

function getWindowIconPath() {
  const distIconPath = path.join(app.getAppPath(), 'dist', 'favicon.ico')
  if (fs.existsSync(distIconPath)) return distIconPath

  return path.join(__dirname, '../public/favicon.ico')
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '密涅瓦的巡林官',
    icon: getWindowIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.setMenuBarVisibility(false)
  win.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
