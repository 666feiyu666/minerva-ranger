const { spawnSync } = require('node:child_process')
const path = require('node:path')

const electronPath = require('electron')
const probePath = path.join(__dirname, 'electron-sqlite-probe.cjs')
const result = spawnSync(electronPath, [probePath], {
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
  },
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exitCode = result.status ?? 1
