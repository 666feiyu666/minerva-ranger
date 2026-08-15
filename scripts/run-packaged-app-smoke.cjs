const { spawnSync } = require('node:child_process')
const { existsSync, mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const executablePath = path.join(repoRoot, 'release', 'win-unpacked', 'MinervaRanger.exe')
if (!existsSync(executablePath)) {
  throw new Error('缺少 release/win-unpacked/MinervaRanger.exe，请先运行 npm run dist。')
}

const smokeDirectory = mkdtempSync(path.join(tmpdir(), 'minerva-packaged-app-'))
const expectedUserDataDirectory = path.join(smokeDirectory, 'packaged-user-data')

try {
  for (const run of ['packaged-first-launch', 'packaged-restart']) {
    const environment = {
      ...process.env,
      MINERVA_SMOKE_RUN: run,
      MINERVA_SMOKE_TEST: '1',
      MINERVA_EXPECTED_USER_DATA_DIR: expectedUserDataDirectory,
    }
    delete environment.MINERVA_USER_DATA_DIR

    const smoke = spawnSync(executablePath, [`--user-data-dir=${expectedUserDataDirectory}`], {
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
} finally {
  rmSync(smokeDirectory, { recursive: true, force: true })
}
