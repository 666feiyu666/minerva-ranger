const { spawnSync } = require('node:child_process')
const { mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const electronPath = require('electron')
const vitePath = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const smokeDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-electron-app-'))
const rendererDirectory = path.join(smokeDirectory, 'renderer')
const defaultUserDataDirectory = path.join(smokeDirectory, 'default-user-data')
const overrideUserDataDirectory = path.join(smokeDirectory, 'override-user-data')

try {
  const build = spawnSync(
    process.execPath,
    [vitePath, 'build', '--outDir', rendererDirectory, '--emptyOutDir'],
    { cwd: repoRoot, env: process.env, stdio: 'inherit' },
  )
  if (build.error) throw build.error
  if (build.status !== 0) {
    process.exitCode = build.status ?? 1
  } else {
    const runs = [
      {
        name: 'development-default-path',
        arguments: [`--user-data-dir=${defaultUserDataDirectory}`],
        expectedUserDataDirectory: `${defaultUserDataDirectory}-dev`,
      },
      {
        name: 'override-first-launch',
        userDataDirectory: overrideUserDataDirectory,
        expectedUserDataDirectory: overrideUserDataDirectory,
      },
      {
        name: 'override-restart',
        userDataDirectory: overrideUserDataDirectory,
        expectedUserDataDirectory: overrideUserDataDirectory,
      },
    ]

    for (const run of runs) {
      const environment = {
        ...process.env,
        MINERVA_RENDERER_DIR: rendererDirectory,
        MINERVA_SMOKE_RUN: run.name,
        MINERVA_SMOKE_TEST: '1',
        MINERVA_EXPECTED_USER_DATA_DIR: run.expectedUserDataDirectory,
      }
      delete environment.MINERVA_USER_DATA_DIR
      if (run.userDataDirectory) {
        environment.MINERVA_USER_DATA_DIR = run.userDataDirectory
      }

      const smoke = spawnSync(electronPath, [repoRoot, ...(run.arguments || [])], {
        cwd: repoRoot,
        env: environment,
        stdio: 'inherit',
        timeout: 30000,
      })
      if (smoke.error) throw smoke.error
      if (smoke.status !== 0) {
        process.exitCode = smoke.status ?? 1
        break
      }
    }
  }
} finally {
  rmSync(smokeDirectory, { recursive: true, force: true })
}
