// electron/main.js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "密涅瓦的巡林官", // 窗口标题
    icon: path.join(__dirname, '../public/favicon.ico'), // (可选) 如果你有图标的话
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 关键：去掉菜单栏（让它看起来更像游戏）
  win.setMenuBarVisibility(false)

  // 关键步骤：加载 dist 目录下的 index.html
  // __dirname 指的是当前文件(main.js)所在目录
  // '../dist/index.html' 指的是上一级目录下的 dist 文件夹
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